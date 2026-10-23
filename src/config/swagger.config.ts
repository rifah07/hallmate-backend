import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import { env } from './env.config';
import definition from './openapi-definition.json';

// In a build, scripts/build.mjs has already written the spec next to
// server.js. In development it's parsed from the docs comments, so edits
// show up on reload.
const builtSpec = path.join(__dirname, 'openapi.json');
const spec = existsSync(builtSpec)
  ? JSON.parse(readFileSync(builtSpec, 'utf8'))
  : swaggerJsdoc({ definition, apis: ['src/modules/*/docs/*.swagger.ts'] });

spec.servers = [{ url: env.API_PUBLIC_URL }];

export const setupSwagger = (app: Application): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
};
