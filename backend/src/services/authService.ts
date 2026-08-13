import type { Logger } from 'pino';

import { createUser, findUserByEmail, findUserById } from '../repositories/userRepository';
import type { PublicUser, UserRecord } from '../types/user';
import { AppError } from '../utils/AppError';
import type { LoginInput, SignupInput } from '../validation/authSchemas';
import { hashPassword, verifyPassword } from './passwordService';
import { signAccessToken } from './tokenService';

export interface AuthResult {
  user: PublicUser;
  token: string;
}

const INVALID_CREDENTIALS = 'Invalid email or password';

function toPublicUser(record: UserRecord): PublicUser {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    createdAt: record.created_at.toISOString(),
  };
}

export async function signUp(log: Logger, input: SignupInput): Promise<AuthResult> {
  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  log.info({ userId: user.id }, 'User signed up');
  return { user: toPublicUser(user), token: signAccessToken(user.id) };
}

export async function logIn(log: Logger, input: LoginInput): Promise<AuthResult> {
  const user = await findUserByEmail(input.email);

  if (user === undefined) {
    throw new AppError(INVALID_CREDENTIALS, 401);
  }

  const valid = await verifyPassword(input.password, user.password_hash);
  if (!valid) {
    throw new AppError(INVALID_CREDENTIALS, 401);
  }

  log.info({ userId: user.id }, 'User logged in');
  return { user: toPublicUser(user), token: signAccessToken(user.id) };
}

export async function getUserProfile(log: Logger, userId: number): Promise<PublicUser> {
  const user = await findUserById(userId);
  if (user === undefined) {
    // token is valid but the account was deleted
    log.warn({ userId }, 'User from token not found');
    throw new AppError('Authentication required', 401);
  }
  return toPublicUser(user);
}
