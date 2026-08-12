import type { ResultSetHeader, RowDataPacket } from 'mysql2';

import { getPool } from '../config/database';
import type { NewUser, UserRecord } from '../types/user';
import { AppError } from '../utils/AppError';

/** MySQL error number raised when a UNIQUE constraint is violated. */
const ER_DUP_ENTRY = 1062;

interface UserRow extends RowDataPacket, UserRecord {}

/**
 * Translates driver failures so that neither SQL text nor MySQL error codes can
 * reach a client. A duplicate email becomes a 409; anything else becomes an
 * opaque error that the global handler reports as a 500.
 */
function toDomainError(error: unknown, operation: string): Error {
  if (typeof error === 'object' && error !== null) {
    const { errno } = error as { errno?: unknown };
    if (errno === ER_DUP_ENTRY) {
      return new AppError('An account with this email already exists', 409);
    }
  }
  return new Error(`Database operation failed: ${operation}`, { cause: error });
}

export async function findUserByEmail(email: string): Promise<UserRecord | undefined> {
  try {
    const [rows] = await getPool().execute<UserRow[]>(
      `SELECT id, name, email, password_hash, created_at, updated_at
         FROM users
        WHERE email = :email
        LIMIT 1`,
      { email },
    );
    return rows[0];
  } catch (error) {
    throw toDomainError(error, 'findUserByEmail');
  }
}

export async function findUserById(id: number): Promise<UserRecord | undefined> {
  try {
    const [rows] = await getPool().execute<UserRow[]>(
      `SELECT id, name, email, password_hash, created_at, updated_at
         FROM users
        WHERE id = :id
        LIMIT 1`,
      { id },
    );
    return rows[0];
  } catch (error) {
    throw toDomainError(error, 'findUserById');
  }
}

/**
 * Inserts a user and returns the stored row, so callers see the timestamps
 * MySQL generated rather than values guessed in application code. Uniqueness is
 * enforced by the index instead of a preceding SELECT, which would leave a race
 * between the check and the insert.
 */
export async function createUser(user: NewUser): Promise<UserRecord> {
  let insertId: number;
  try {
    const [result] = await getPool().execute<ResultSetHeader>(
      `INSERT INTO users (name, email, password_hash)
       VALUES (:name, :email, :passwordHash)`,
      { name: user.name, email: user.email, passwordHash: user.passwordHash },
    );
    insertId = result.insertId;
  } catch (error) {
    throw toDomainError(error, 'createUser');
  }

  let created: UserRecord | undefined;
  try {
    created = await findUserById(insertId);
  } catch (error) {
    throw new Error(`User ${String(insertId)} was inserted but could not be read back`, {
      cause: error,
    });
  }

  if (created === undefined) {
    throw new Error(`User ${String(insertId)} could not be read back after insertion`);
  }
  return created;
}
