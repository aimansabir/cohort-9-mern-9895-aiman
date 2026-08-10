import type { Request, RequestHandler } from 'express';

import { verifyAccessToken } from '../services/tokenService';
import type { AuthenticatedUser } from '../types/user';
import { AppError } from '../utils/AppError';

const BEARER_SCHEME = 'bearer';
const AUTHENTICATION_REQUIRED = 'Authentication required';

/**
 * Splits an `Authorization` header into scheme and credentials, accepting only
 * a single-space `Bearer <token>` form. The scheme is compared
 * case-insensitively because RFC 7235 defines it that way.
 */
function readBearerToken(header: string | undefined): string {
  if (header === undefined) {
    throw new AppError(AUTHENTICATION_REQUIRED, 401);
  }

  const separator = header.indexOf(' ');
  if (separator === -1) {
    throw new AppError('Authorization header must use the Bearer scheme', 401);
  }

  const scheme = header.slice(0, separator);
  const token = header.slice(separator + 1).trim();

  if (scheme.toLowerCase() !== BEARER_SCHEME) {
    throw new AppError('Authorization header must use the Bearer scheme', 401);
  }
  if (token.length === 0) {
    throw new AppError(AUTHENTICATION_REQUIRED, 401);
  }
  return token;
}

/**
 * Establishes identity from a Bearer token. Only the user id is attached: no
 * database read happens here, so protected routes stay cheap, and handlers that
 * need profile fields load them explicitly.
 */
export const authenticate: RequestHandler = (req, _res, next): void => {
  try {
    const { userId } = verifyAccessToken(readBearerToken(req.headers.authorization));
    req.user = { id: userId };
    next();
  } catch (error) {
    // Recorded as its own activity event so authentication failures can be
    // audited separately from ordinary 4xx responses. The token is never
    // logged, only why it was refused.
    if (error instanceof AppError) {
      req.log.warn({ reason: error.message }, 'Authentication rejected');
    }
    next(error);
  }
};

/**
 * Returns the identity established by `authenticate`. Throwing rather than
 * returning `undefined` keeps protected handlers free of null checks and of
 * non-null assertions, and turns a route accidentally left unprotected into a
 * 401 instead of a crash.
 */
export function requireAuthenticatedUser(req: Request): AuthenticatedUser {
  if (req.user === undefined) {
    throw new AppError(AUTHENTICATION_REQUIRED, 401);
  }
  return req.user;
}
