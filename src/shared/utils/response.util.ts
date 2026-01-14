import { Response } from 'express';

interface SuccessResponse {
  success: true;
  data: any;
  message?: string;
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}

export const sendSuccess = (
  res: Response,
  data: any,
  message?: string,
  statusCode: number = 200,
): Response<SuccessResponse> => {
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
  details?: any,
): Response<ErrorResponse> => {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(code && { code }),
      ...(details && { details }),
    },
  });
};

export const sendPaginatedSuccess = (
  res: Response,
  data: any[],
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
