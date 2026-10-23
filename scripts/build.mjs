// Production build. tsc only type-checks (see package.json); esbuild emits.
// Why esbuild: tsc copies `@/...` imports as they are, and plain Node can't
// resolve tsconfig path aliases. esbuild resolves them while bundling our
// code into one file; npm packages stay external in node_modules.
import { rmSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';
import swaggerJsdoc from 'swagger-jsdoc';
import definition from '../src/config/openapi-definition.json' with { type: 'json' };

rmSync('dist', { recursive: true, force: true }); // no stale files from older builds

await build({
  entryPoints: ['src/server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  packages: 'external',
  sourcemap: true, // stack traces point at the .ts lines (node --enable-source-maps)
  outfile: 'dist/server.js',
  logLevel: 'info',
});

// API docs are read from source comments once here, not on every cold start
const spec = swaggerJsdoc({ definition, apis: ['src/modules/*/docs/*.swagger.ts'] });
writeFileSync('dist/openapi.json', JSON.stringify(spec));
console.log(`dist/openapi.json: ${Object.keys(spec.paths ?? {}).length} paths`);
