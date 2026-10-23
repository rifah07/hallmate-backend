import { randomUUID } from 'node:crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env.config';

export interface JWTPayload {
  userId: string;
  universityId: string;
  role: string;
  accountStatus: string;
  assignedFloor?: number | null;
  iat?: number; // issued at - JWT adds this automatically
}

/**
 * Token options
 */
const accessTokenOptions: SignOptions = {
  expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
};

const refreshTokenOptions: SignOptions = {
  expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
};

/**
 * Generate access token
 */
export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, accessTokenOptions);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
  // jwtid: without it, two logins in the same second sign identical tokens
  // and the second one fails the unique index on RefreshToken.token.
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { ...refreshTokenOptions, jwtid: randomUUID() });
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JWTPayload;
};
