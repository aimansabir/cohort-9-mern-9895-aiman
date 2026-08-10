import { randomUUID } from 'node:crypto';

import bcrypt from 'bcrypt';

/**
 * bcrypt cost factor. 12 is a common current default: expensive enough to slow
 * offline cracking, fast enough for an interactive login.
 */
const SALT_ROUNDS = 12;

/** Hash of a throwaway value, used only to spend time on unknown accounts. */
let placeholderHash: Promise<string> | undefined;

export async function hashPassword(plainPassword: string): Promise<string> {
  try {
    return await bcrypt.hash(plainPassword, SALT_ROUNDS);
  } catch (error) {
    // The password itself is never included in the message.
    throw new Error('Failed to hash password', { cause: error });
  }
}

export async function verifyPassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, passwordHash);
  } catch (error) {
    throw new Error('Failed to verify password', { cause: error });
  }
}

/**
 * Performs a comparison against a dummy hash so that a login attempt for an
 * address with no account costs roughly the same as one for an existing
 * account. Without this, response time alone reveals which emails are
 * registered, however generic the error message is.
 */
export async function spendVerificationTime(plainPassword: string): Promise<void> {
  try {
    placeholderHash ??= bcrypt.hash(randomUUID(), SALT_ROUNDS);
    await bcrypt.compare(plainPassword, await placeholderHash);
  } catch (error) {
    throw new Error('Failed to run placeholder password verification', { cause: error });
  }
}
