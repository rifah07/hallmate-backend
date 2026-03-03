import ExcelJS from 'exceljs';
import { BadRequestError, ValidationError } from '@/shared/errors';
import { UserRole, Program, BloodGroup } from '@prisma/client';

export interface ParsedUserRow {
  universityId: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  department?: string;
  year?: number;
  program?: Program;
  session?: string;
  bloodGroup?: BloodGroup;
  assignedFloor?: number;
  designation?: string;
}

export interface ExcelParseResult {
  users: ParsedUserRow[];
  errors: string[];
  totalRows: number;
}

/**
 * Parse Excel file for bulk user upload
 * Expected columns: universityId, email, name, role, phone, department, year, program, session, bloodGroup, assignedFloor, designation
 */
export async function parseUserExcelFile(buffer: Buffer): Promise<ExcelParseResult> {
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(buffer as any);
  } catch (error) {
    throw new BadRequestError('Invalid Excel file format');
  }

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new BadRequestError('Excel file is empty');
  }

  const users: ParsedUserRow[] = [];
  const errors: string[] = [];
  let totalRows = 0;

  // Get header row (row 1)
  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];

  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber] = String(cell.value).toLowerCase().trim();
  });

  // Validate required columns
  const requiredColumns = ['universityid', 'email', 'name', 'role'];
  const missingColumns = requiredColumns.filter((col) => !headers.includes(col));

  if (missingColumns.length > 0) {
    throw new ValidationError(`Missing required columns: ${missingColumns.join(', ')}`, {
      missingColumns,
    });
  }

  // Parse data rows (starting from row 2)
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header row

    totalRows++;

    try {
      const getCellValue = (columnName: string): string | undefined => {
        const colIndex = headers.indexOf(columnName.toLowerCase());
        if (colIndex === -1) return undefined;

        const cell = row.getCell(colIndex);
        const value = cell.value;

        if (value === null || value === undefined) return undefined;

        // Handle different cell types
        if (typeof value === 'object' && 'text' in value) {
          return String(value.text).trim();
        }

        return String(value).trim();
      };

      const universityId = getCellValue('universityid');
      const email = getCellValue('email');
      const name = getCellValue('name');
      const role = getCellValue('role');

      // Validate required fields
      if (!universityId) {
        errors.push(`Row ${rowNumber}: Missing universityId`);
        return;
      }
      if (!email) {
        errors.push(`Row ${rowNumber}: Missing email`);
        return;
      }
      if (!name) {
        errors.push(`Row ${rowNumber}: Missing name`);
        return;
      }
      if (!role) {
        errors.push(`Row ${rowNumber}: Missing role`);
        return;
      }

      // Validate role enum
      const validRoles: UserRole[] = [
        'SUPER_ADMIN',
        'PROVOST',
        'HOUSE_TUTOR',
        'ASSISTANT_WARDEN',
        'OFFICE_STAFF',
        'DINING_STAFF',
        'MAINTENANCE_STAFF',
        'GUARD',
        'STUDENT',
        'PARENT',
      ];

      if (!validRoles.includes(role.toUpperCase() as UserRole)) {
        errors.push(`Row ${rowNumber}: Invalid role '${role}'`);
        return;
      }

      const user: ParsedUserRow = {
        universityId,
        email: email.toLowerCase(),
        name,
        role: role.toUpperCase() as UserRole,
      };

      // Optional fields
      const phone = getCellValue('phone');
      if (phone) user.phone = phone;

      const department = getCellValue('department');
      if (department) user.department = department;

      const yearStr = getCellValue('year');
      if (yearStr) {
        const year = parseInt(yearStr);
        if (isNaN(year) || year < 1 || year > 10) {
          errors.push(`Row ${rowNumber}: Invalid year '${yearStr}' (must be 1-10)`);
          return;
        }
        user.year = year;
      }

      const program = getCellValue('program');
      if (program) {
        const validPrograms: Program[] = ['UNDERGRADUATE', 'MASTERS', 'PHD'];
        if (!validPrograms.includes(program.toUpperCase() as Program)) {
          errors.push(`Row ${rowNumber}: Invalid program '${program}'`);
          return;
        }
        user.program = program.toUpperCase() as Program;
      }

      const session = getCellValue('session');
      if (session) user.session = session;

      const bloodGroup = getCellValue('bloodgroup');
      if (bloodGroup) {
        const validBloodGroups: BloodGroup[] = [
          'A_POSITIVE',
          'A_NEGATIVE',
          'B_POSITIVE',
          'B_NEGATIVE',
          'AB_POSITIVE',
          'AB_NEGATIVE',
          'O_POSITIVE',
          'O_NEGATIVE',
        ];
        const normalized = bloodGroup
          .toUpperCase()
          .replace('+', '_POSITIVE')
          .replace('-', '_NEGATIVE');
        if (!validBloodGroups.includes(normalized as BloodGroup)) {
          errors.push(`Row ${rowNumber}: Invalid blood group '${bloodGroup}'`);
          return;
        }
        user.bloodGroup = normalized as BloodGroup;
      }

      const assignedFloorStr = getCellValue('assignedfloor');
      if (assignedFloorStr) {
        const floor = parseInt(assignedFloorStr);
        if (isNaN(floor) || floor < 1 || floor > 14) {
          errors.push(
            `Row ${rowNumber}: Invalid assigned floor '${assignedFloorStr}' (must be 1-14)`,
          );
          return;
        }
        user.assignedFloor = floor;
      }

      const designation = getCellValue('designation');
      if (designation) user.designation = designation;

      // Validate student-specific fields
      if (user.role === 'STUDENT') {
        if (!user.department || !user.year || !user.program || !user.session) {
          errors.push(
            `Row ${rowNumber}: Students must have department, year, program, and session`,
          );
          return;
        }
      }

      // Validate house tutor-specific fields
      if (user.role === 'HOUSE_TUTOR' && !user.assignedFloor) {
        errors.push(`Row ${rowNumber}: House tutors must have an assigned floor`);
        return;
      }

      users.push(user);
    } catch (error) {
      errors.push(`Row ${rowNumber}: ${(error as Error).message}`);
    }
  });

  return {
    users,
    errors,
    totalRows,
  };
}

/**
 * Parse CSV file for bulk user upload
 */
export async function parseUserCSVFile(buffer: Buffer): Promise<ExcelParseResult> {
  const csvContent = buffer.toString('utf-8');
  const lines = csvContent.split('\n').filter((line) => line.trim());

  if (lines.length === 0) {
    throw new BadRequestError('CSV file is empty');
  }

  const users: ParsedUserRow[] = [];
  const errors: string[] = [];

  // Parse header
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

  const requiredColumns = ['universityid', 'email', 'name', 'role'];
  const missingColumns = requiredColumns.filter((col) => !headers.includes(col));

  if (missingColumns.length > 0) {
    throw new ValidationError(`Missing required columns: ${missingColumns.join(', ')}`, {
      missingColumns,
    });
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(',').map((v) => v.trim());

    try {
      const getValue = (columnName: string): string | undefined => {
        const index = headers.indexOf(columnName.toLowerCase());
        return index !== -1 ? values[index] : undefined;
      };

      const universityId = getValue('universityid');
      const email = getValue('email');
      const name = getValue('name');
      const role = getValue('role');

      if (!universityId || !email || !name || !role) {
        errors.push(`Row ${i + 1}: Missing required fields`);
        continue;
      }

      const user: ParsedUserRow = {
        universityId,
        email: email.toLowerCase(),
        name,
        role: role.toUpperCase() as UserRole,
      };

      // Add optional fields (same logic as Excel parser)
      const phone = getValue('phone');
      if (phone) user.phone = phone;

      const department = getValue('department');
      if (department) user.department = department;

      const yearStr = getValue('year');
      if (yearStr) user.year = parseInt(yearStr);

      const program = getValue('program');
      if (program) user.program = program.toUpperCase() as Program;

      const session = getValue('session');
      if (session) user.session = session;

      users.push(user);
    } catch (error) {
      errors.push(`Row ${i + 1}: ${(error as Error).message}`);
    }
  }

  return {
    users,
    errors,
    totalRows: lines.length - 1,
  };
}

/**
 * Generate Excel template for bulk user upload
 */
export async function generateUserExcelTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Users');

  // Define columns
  worksheet.columns = [
    { header: 'universityId', key: 'universityId', width: 20 },
    { header: 'email', key: 'email', width: 30 },
    { header: 'name', key: 'name', width: 25 },
    { header: 'role', key: 'role', width: 20 },
    { header: 'phone', key: 'phone', width: 15 },
    { header: 'department', key: 'department', width: 25 },
    { header: 'year', key: 'year', width: 10 },
    { header: 'program', key: 'program', width: 20 },
    { header: 'session', key: 'session', width: 15 },
    { header: 'bloodGroup', key: 'bloodGroup', width: 15 },
    { header: 'assignedFloor', key: 'assignedFloor', width: 15 },
    { header: 'designation', key: 'designation', width: 25 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' },
  };

  // Add sample rows
  worksheet.addRow({
    universityId: '2024-1-60-001',
    email: 'student@example.com',
    name: 'John Doe',
    role: 'STUDENT',
    phone: '01712345678',
    department: 'Computer Science',
    year: 1,
    program: 'UNDERGRADUATE',
    session: '2024-2025',
    bloodGroup: 'A_POSITIVE',
    assignedFloor: '',
    designation: '',
  });

  worksheet.addRow({
    universityId: 'TUTOR-001',
    email: 'tutor@example.com',
    name: 'Jane Smith',
    role: 'HOUSE_TUTOR',
    phone: '01812345678',
    department: '',
    year: '',
    program: '',
    session: '',
    bloodGroup: 'B_POSITIVE',
    assignedFloor: 3,
    designation: '',
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
