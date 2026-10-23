import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Prisma 7 reads the connection URL here instead of schema.prisma.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node -r tsconfig-paths/register prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
