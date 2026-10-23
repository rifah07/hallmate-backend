import winston from 'winston';
import { env } from '@/config/env.config';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  return env.NODE_ENV === 'development' ? 'debug' : 'warn';
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const isDev = env.NODE_ENV === 'development';

// printf alone drops everything but `message`; keep the stack and any
// metadata, since that's what you read in Vercel → Logs when something breaks.
const line = winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
  const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} ${level}: ${message}${extra}${stack ? `\n${stack}` : ''}`;
});

const format = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  ...(isDev ? [winston.format.colorize({ all: true })] : []), // no ANSI codes in hosted logs
  line,
);

// Files only on a developer machine: serverless hosts have a read-only disk
// and keep stdout themselves.
const transports: winston.transport[] = [new winston.transports.Console()];
if (isDev) {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  );
}

const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

export default logger;
