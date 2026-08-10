import type { AuthenticatedUser } from './user';

declare global {
  namespace Express {
    interface Request {
      /**
       * Set by the `authenticate` middleware. Optional because public routes
       * never populate it; protected handlers should read it through
       * `requireAuthenticatedUser` rather than asserting it is present.
       */
      user?: AuthenticatedUser;
    }
  }
}
