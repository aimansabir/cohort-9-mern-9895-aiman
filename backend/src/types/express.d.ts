import type { AuthenticatedUser } from './user';

declare global {
  namespace Express {
    interface Request {
      // set by the authenticate middleware, so it's optional on public routes
      user?: AuthenticatedUser;
    }
  }
}
