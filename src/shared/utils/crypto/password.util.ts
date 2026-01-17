import bcrypt from 'bcrypt';
import { env } from '@/config/env.config';

const SALT_ROUNDS = parseInt(env.BCRYPT_ROUNDS, 10);

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hashPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword);
};

export const generateOTP = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let otp = '';
  for (let i = 0; i < 8; i++) {
    otp += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return otp;
};
