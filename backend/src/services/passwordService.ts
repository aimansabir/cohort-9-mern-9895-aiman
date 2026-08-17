import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

// A real bcrypt hash (same cost) of a random throwaway string. Login compares
// against this when the email isn't found, so a missing account takes about as
// long as a wrong password and you can't work out which emails are registered
// by timing the response. It's not a password for any account.
export const DUMMY_PASSWORD_HASH = '$2b$12$kXBLorKyZHhEgedsB8UniOxq8pFHKVj2YaXtGlEVgYRH9xukpVqHG';

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function verifyPassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}
