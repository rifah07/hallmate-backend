import { JWTPayload } from '@/shared/utils/crypto/jwt.util';

declare global {
  namespace Express {
    interface Request {
      /**
       * Set by the `authenticate` middleware after a valid JWT is verified.
       * Undefined on public/unauthenticated routes.
       */
      user?: JWTPayload;
    }
  }
}

export {};
