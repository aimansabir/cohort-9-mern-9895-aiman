import type { Logger } from 'pino';

import { createUser, findUserByEmail, findUserById } from '../repositories/userRepository';
import type { PublicUser, UserRecord } from '../types/user';
import { AppError } from '../utils/AppError';
import type { LoginInput, SignupInput } from '../validation/authSchemas';
import { hashPassword, spendVerificationTime, verifyPassword } from './passwordService';
import { signAccessToken } from './tokenService';

export interface AuthResult {
  user: PublicUser;
  token: string;
}

/**
 * Identical for an unknown address and a wrong password, so a caller cannot
 * discover which emails have accounts.
 */
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

/** Drops `password_hash` and every other internal column. */
function toPublicUser(record: UserRecord): PublicUser {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    createdAt: record.created_at.toISOString(),
  };
}

/**
 * Distinguishes expected outcomes from genuine faults: an `AppError` is a
 * deliberate answer and travels on untouched, while anything else is a real
 * failure worth its own log entry before the global handler turns it into a 500.
 */
function rethrow(log: Logger, error: unknown, event: string): never {
  if (error instanceof AppError) {
    throw error;
  }
  log.error({ err: error }, event);
  throw error;
}

export async function signUp(log: Logger, input: SignupInput): Promise<AuthResult> {
  try {
    const passwordHash = await hashPassword(input.password);
    const user = await createUser({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    log.info({ userId: user.id }, 'User signed up');
    return { user: toPublicUser(user), token: signAccessToken(user.id) };
  } catch (error) {
    if (error instanceof AppError) {
      log.warn({ statusCode: error.statusCode }, 'Signup rejected');
    }
    return rethrow(log, error, 'Signup failed unexpectedly');
  }
}

export async function logIn(log: Logger, input: LoginInput): Promise<AuthResult> {
  try {
    const user = await findUserByEmail(input.email);

    if (user === undefined) {
      await spendVerificationTime(input.password);
      log.warn({ reason: 'unknown_email' }, 'Login failed');
      throw new AppError(INVALID_CREDENTIALS_MESSAGE, 401);
    }

    if (!(await verifyPassword(input.password, user.password_hash))) {
      log.warn({ userId: user.id, reason: 'wrong_password' }, 'Login failed');
      throw new AppError(INVALID_CREDENTIALS_MESSAGE, 401);
    }

    log.info({ userId: user.id }, 'User logged in');
    return { user: toPublicUser(user), token: signAccessToken(user.id) };
  } catch (error) {
    return rethrow(log, error, 'Login failed unexpectedly');
  }
}

/**
 * Reads the current row rather than trusting the token, so a profile change or
 * a deleted account is reflected immediately instead of persisting until the
 * token expires.
 */
export async function getUserProfile(log: Logger, userId: number): Promise<PublicUser> {
  try {
    const user = await findUserById(userId);
    if (user === undefined) {
      log.warn({ userId, reason: 'user_no_longer_exists' }, 'Authenticated user not found');
      throw new AppError('Authentication required', 401);
    }
    return toPublicUser(user);
  } catch (error) {
    return rethrow(log, error, 'Loading the current user failed unexpectedly');
  }
}
