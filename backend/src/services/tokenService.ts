import jwt, { type JwtPayload } from 'jsonwebtoken';

import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export interface AccessTokenClaims {
  userId: number;
}

export function signAccessToken(userId: number): string {
  return jwt.sign({}, env.jwt.secret, {
    algorithm: 'HS256',
    subject: String(userId),
    expiresIn: env.jwt.expiresInSeconds,
  });
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  let payload: string | JwtPayload;
  try {
    payload = jwt.verify(token, env.jwt.secret, {
      algorithms: ['HS256'],
    });
  } catch {
    throw new AppError('Authentication token is invalid or expired', 401);
  }

  if (typeof payload === 'string') {
    throw new AppError('Authentication token is invalid', 401);
  }

  const userId = Number(payload.sub);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    throw new AppError('Authentication token is invalid', 401);
  }

  return { userId };
}
