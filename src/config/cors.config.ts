import { CorsOptions } from 'cors';
import { env } from './env.config';

const whitelist = [
  'http://localhost:3000',
  'http://localhost:5173',
  env.NODE_ENV === 'production' ? 'https://frontend-domain.com' : '',
].filter(Boolean);

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};