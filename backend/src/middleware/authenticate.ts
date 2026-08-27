import type { Request, RequestHandler } from 'express';

import { verifyAccessToken } from '../services/tokenService';
import type { AuthenticatedUser } from '../types/user';
import { AppError } from '../utils/AppError';

// Extract the Bearer token from the Authorization header
function extractToken(header: string | undefined): string {
  if (!header) {
    throw new AppError('Authentication required', 401);
  }

  const parts = header.split(' ');
  const scheme = parts[0] ?? '';
  const token = parts[1] ?? '';

  if (parts.length !== 2 || scheme.toLowerCase() !== 'bearer' || token === '') {
    throw new AppError('Authentication required', 401);
  }

  return token;
}

export const authenticate: RequestHandler = (req, _res, next): void => {
  try {
    const token = extractToken(req.headers.authorization);
    const { userId } = verifyAccessToken(token);
    req.user = { id: userId };
    next();
  } catch (error) {
    next(error);
  }
};

// Helper to get the authenticated user or throw 401
export function requireAuthenticatedUser(req: Request): AuthenticatedUser {
  if (req.user === undefined) {
    throw new AppError('Authentication required', 401);
  }
  return req.user;
}
