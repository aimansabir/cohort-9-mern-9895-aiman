import bcrypt from 'bcrypt';

import { env } from '../config/env';

const SALT_ROUNDS = 12;

// Hash is used when the email is not found to keep login timing consistent
export const DUMMY_PASSWORD_HASH = env.dummyPasswordHash;

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function verifyPassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}
