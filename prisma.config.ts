import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Prisma 7 reads the connection URL here instead of schema.prisma.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node -r tsconfig-paths/register prisma/seed.ts',
  },
  // Used by the CLI (migrate, studio) only; the app connects through the
  // pg adapter with DATABASE_URL. Neon's pooled URL can't hold the lock
  // migrations take, so the CLI prefers the direct one when it's set.
  datasource: {
    url: process.env.DIRECT_URL || env('DATABASE_URL'),
  },
});
