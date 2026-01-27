import { Response } from 'express';

// T is a placeholder for actual data type (like UserResponse)
interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown; // 'unknown' is the professional version of 'any'
  };
}

// We add <T> here so the function is "Generic"
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
): Response<SuccessResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: unknown,
): Response<ErrorResponse> => {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(code ? { code } : {}),
      // This ensures we only add 'details' if it's not undefined or null
      ...(details !== undefined && details !== null ? { details } : {}),
    },
  });
};

export const sendPaginatedSuccess = <T>(
  res: Response,
  data: T[],
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
): Response => {
  return res.status(200).json({
    success: true,
    data,
    meta,
  });
};