import { CorsOptions } from 'cors';
import { env } from './env.config';

// Comma-separated in ALLOWED_ORIGINS. The web app normally calls through its
// own same-origin proxy, so this matters only for direct browser calls.
const whitelist = env.ALLOWED_ORIGINS.split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export const corsOptions: CorsOptions = {
  // Unknown origin: no CORS headers, so the browser won't let that page read
  // the response. Not an error: the payment gateway's return is a plain
  // cross-site form post and must still reach the API.
  origin: (origin, callback) => callback(null, !origin || whitelist.includes(origin)),
  credentials: true,
  optionsSuccessStatus: 200,
};
