/**
 * modules/public/index.ts
 *
 * Barrel export - the only file app.ts needs to import.
 *
 * SYSTEM DESIGN: Module Encapsulation
 *
 * Nothing outside this module should import from deep paths like:
 *   import { something } from './modules/public/services/public.service'
 *
 * Everything the outside world needs is exported from here.
 * This gives you one place to control the module's public surface area.
 */

export { default as publicRouter } from './routes/public.routes';

// Export types that other modules may legitimately need
export type { PublicProvostDTO } from './repositories/public.repository';
