import type { ResultSetHeader, RowDataPacket } from 'mysql2';

import { getPool } from '../config/database';
import type { NewUser, UserRecord } from '../types/user';
import { AppError } from '../utils/AppError';

const ER_DUP_ENTRY = 1062;

interface UserRow extends RowDataPacket, UserRecord {}

export async function findUserByEmail(email: string): Promise<UserRecord | undefined> {
  const [rows] = await getPool().execute<UserRow[]>(
    `SELECT id, name, email, password_hash, created_at, updated_at
       FROM users
      WHERE email = :email
      LIMIT 1`,
    { email },
  );
  return rows[0];
}

export async function findUserById(id: number): Promise<UserRecord | undefined> {
  const [rows] = await getPool().execute<UserRow[]>(
    `SELECT id, name, email, password_hash, created_at, updated_at
       FROM users
      WHERE id = :id
      LIMIT 1`,
    { id },
  );
  return rows[0];
}

export async function createUser(user: NewUser): Promise<UserRecord> {
  try {
    const [result] = await getPool().execute<ResultSetHeader>(
      `INSERT INTO users (name, email, password_hash)
       VALUES (:name, :email, :passwordHash)`,
      { name: user.name, email: user.email, passwordHash: user.passwordHash },
    );

    const created = await findUserById(result.insertId);
    if (!created) {
      throw new Error('Failed to read back the created user');
    }
    return created;
  } catch (error) {
    // handle duplicate email
    if (typeof error === 'object' && error !== null && (error as { errno?: number }).errno === ER_DUP_ENTRY) {
      throw new AppError('An account with this email already exists', 409);
    }
    throw error;
  }
}
