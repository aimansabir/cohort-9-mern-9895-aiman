import jwt, { TokenExpiredError, type JwtPayload, type SignOptions } from 'jsonwebtoken';

import { env } from '../config/env';
import { AppError } from '../utils/AppError';

/** Claims this application relies on, extracted from a verified token. */
export interface AccessTokenClaims {
  userId: number;
}

const ALGORITHM = 'HS256';
const INVALID_TOKEN_MESSAGE = 'Authentication token is invalid';

/**
 * Issues a token whose payload is only an identity. Profile fields are
 * deliberately excluded: a name or email copied into a token goes stale as soon
 * as the user edits it, and handlers that need them read the database instead.
 */
export function signAccessToken(userId: number): string {
  const options: SignOptions = {
    algorithm: ALGORITHM,
    subject: String(userId),
    issuer: env.jwt.issuer,
    audience: env.jwt.audience,
    expiresIn: env.jwt.expiresInSeconds,
  };
  return jwt.sign({}, env.jwt.secret, options);
}

/**
 * Verifies signature, expiry, issuer and audience, then checks that the subject
 * really is a user id. Failures raise a 401 whose message says only that the
 * token was rejected — never which check failed internally.
 */
export function verifyAccessToken(token: string): AccessTokenClaims {
  let payload: string | JwtPayload;
  try {
    payload = jwt.verify(token, env.jwt.secret, {
      // Pinning the algorithm prevents a token signed with a different scheme
      // from being accepted.
      algorithms: [ALGORITHM],
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
    });
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new AppError('Authentication token has expired', 401);
    }
    throw new AppError(INVALID_TOKEN_MESSAGE, 401);
  }

  if (typeof payload === 'string') {
    throw new AppError(INVALID_TOKEN_MESSAGE, 401);
  }

  const userId = Number(payload.sub);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    throw new AppError(INVALID_TOKEN_MESSAGE, 401);
  }

  return { userId };
}
