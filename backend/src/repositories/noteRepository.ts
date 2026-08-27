import type { ResultSetHeader, RowDataPacket } from 'mysql2';

import { getPool } from '../config/database';
import type { NewNote, NoteChanges, NoteRecord } from '../types/note';

interface NoteRow extends RowDataPacket, NoteRecord {}

function toDomainError(error: unknown, operation: string): Error {
  return new Error(`Database operation failed: ${operation}`, { cause: error });
}

export async function createNote(note: NewNote): Promise<NoteRecord> {
  let insertId: number;
  try {
    const [result] = await getPool().execute<ResultSetHeader>(
      `INSERT INTO notes (user_id, title, content, label, is_favourite)
       VALUES (:userId, :title, :content, :label, :isFavourite)`,
      {
        userId: note.userId,
        title: note.title,
        content: note.content,
        label: note.label,
        isFavourite: note.isFavourite ? 1 : 0,
      },
    );
    insertId = result.insertId;
  } catch (error) {
    throw toDomainError(error, 'createNote');
  }

  let created: NoteRecord | undefined;
  try {
    created = await findNoteByIdAndUserId(insertId, note.userId);
  } catch (error) {
    throw new Error(`Note ${String(insertId)} was inserted but could not be read back`, {
      cause: error,
    });
  }

  if (created === undefined) {
    throw new Error(`Note ${String(insertId)} could not be read back after insertion`);
  }
  return created;
}

export async function findNotesByUserId(userId: number): Promise<NoteRecord[]> {
  try {
    const [rows] = await getPool().execute<NoteRow[]>(
      `SELECT id, user_id, title, content, is_favourite, label, created_at, updated_at
         FROM notes
        WHERE user_id = :userId
        ORDER BY updated_at DESC, id DESC`,
      { userId },
    );
    return rows;
  } catch (error) {
    throw toDomainError(error, 'findNotesByUserId');
  }
}

// user_id is in the WHERE clause as well as id, so someone else's note looks
// exactly the same as one that doesn't exist
export async function findNoteByIdAndUserId(
  id: number,
  userId: number,
): Promise<NoteRecord | undefined> {
  try {
    const [rows] = await getPool().execute<NoteRow[]>(
      `SELECT id, user_id, title, content, is_favourite, label, created_at, updated_at
         FROM notes
        WHERE id = :id
          AND user_id = :userId
        LIMIT 1`,
      { id, userId },
    );
    return rows[0];
  } catch (error) {
    throw toDomainError(error, 'findNoteByIdAndUserId');
  }
}

// Column names are read from this table and never from the request, so the
// SET clause cannot be shaped by anything a user sends.
const columnFor: [keyof NoteChanges, string][] = [
  ['title', 'title'],
  ['content', 'content'],
  ['label', 'label'],
  ['isFavourite', 'is_favourite'],
];

export async function updateNoteByIdAndUserId(
  id: number,
  userId: number,
  changes: NoteChanges,
): Promise<NoteRecord | undefined> {
  const assignments: string[] = [];
  const params: Record<string, string | number> = { id, userId };

  for (const [field, column] of columnFor) {
    const value = changes[field];
    if (value !== undefined) {
      assignments.push(`${column} = :${field}`);
      params[field] = typeof value === 'boolean' ? Number(value) : value;
    }
  }

  if (assignments.length === 0) {
    return findNoteByIdAndUserId(id, userId);
  }

  // Starring a note or recolouring it is not writing in it, so the timestamp
  // only moves when the text does.
  if (changes.title === undefined && changes.content === undefined) {
    assignments.push('updated_at = updated_at');
  }

  try {
    const [result] = await getPool().execute<ResultSetHeader>(
      `UPDATE notes
          SET ${assignments.join(', ')}
        WHERE id      = :id
          AND user_id = :userId`,
      params,
    );
    if (result.affectedRows === 0) {
      return undefined;
    }
  } catch (error) {
    throw toDomainError(error, 'updateNoteByIdAndUserId');
  }

  try {
    return await findNoteByIdAndUserId(id, userId);
  } catch (error) {
    throw new Error(`Note ${String(id)} was updated but could not be read back`, {
      cause: error,
    });
  }
}

export async function deleteNoteByIdAndUserId(id: number, userId: number): Promise<boolean> {
  try {
    const [result] = await getPool().execute<ResultSetHeader>(
      `DELETE FROM notes
        WHERE id      = :id
          AND user_id = :userId`,
      { id, userId },
    );
    return result.affectedRows > 0;
  } catch (error) {
    throw toDomainError(error, 'deleteNoteByIdAndUserId');
  }
}
