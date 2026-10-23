import { CorsOptions } from 'cors';
import { env } from './env.config';

// Comma-separated in ALLOWED_ORIGINS. The web app normally calls through its
// own same-origin proxy, so this matters only for direct browser calls.
const whitelist = env.ALLOWED_ORIGINS.split(',')
  .map((o) => o.trim())
  .filter(Boolean);

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
