import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '@/shared/errors';

// Storage configuration - use memory storage for Cloudinary
const storage = multer.memoryStorage();

// File filter for images only
const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
  }
};

// File filter for documents (Excel, CSV)
const documentFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only Excel (.xlsx, .xls) and CSV files are allowed'));
  }
};

// Image upload instance (for profile pictures)
export const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Document upload instance (for Excel/CSV)
export const uploadDocument = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// PDF upload instance (notices). The browser's MIME type is only a first
// filter; services check the file really starts with %PDF.
export const uploadPdf = multer({
  storage,
  fileFilter: (_req, file, cb) =>
    file.mimetype === 'application/pdf'
      ? cb(null, true)
      : cb(new BadRequestError('Only PDF files are allowed')),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Multer error handler middleware
export const handleMulterError = (
  err: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new BadRequestError('File is too large'));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new BadRequestError('Unexpected field name'));
    }
    return next(new BadRequestError(`Upload error: ${err.message}`));
  }
  next(err);
};
