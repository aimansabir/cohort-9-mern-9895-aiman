import type { ResultSetHeader, RowDataPacket } from 'mysql2';

import { getPool } from '../config/database';
import type { NewNote, NoteRecord, UpdateNote } from '../types/note';

interface NoteRow extends RowDataPacket, NoteRecord {}

/**
 * Translates driver failures so that neither SQL text nor MySQL error codes can
 * reach a client. Every error becomes an opaque wrapper that the global handler
 * reports as a 500.
 */
function toDomainError(error: unknown, operation: string): Error {
  return new Error(`Database operation failed: ${operation}`, { cause: error });
}

/**
 * Inserts a note and reads it back so the response contains the timestamps
 * MySQL generated. The user id comes from the JWT identity — never from the
 * request body.
 */
export async function createNote(note: NewNote): Promise<NoteRecord> {
  let insertId: number;
  try {
    const [result] = await getPool().execute<ResultSetHeader>(
      `INSERT INTO notes (user_id, title, content)
       VALUES (:userId, :title, :content)`,
      { userId: note.userId, title: note.title, content: note.content },
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

/** Returns every note belonging to the authenticated user, newest first. */
export async function findNotesByUserId(userId: number): Promise<NoteRecord[]> {
  try {
    const [rows] = await getPool().execute<NoteRow[]>(
      `SELECT id, user_id, title, content, created_at, updated_at
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

/**
 * Fetches a single note only when it belongs to the given user. Both the note
 * id and the user id appear in the WHERE clause so a foreign-owned note is
 * indistinguishable from a nonexistent one.
 */
export async function findNoteByIdAndUserId(
  id: number,
  userId: number,
): Promise<NoteRecord | undefined> {
  try {
    const [rows] = await getPool().execute<NoteRow[]>(
      `SELECT id, user_id, title, content, created_at, updated_at
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

/**
 * Updates title and content for a note owned by the given user. Returns the
 * updated row, or `undefined` when the note does not exist or belongs to
 * someone else.
 */
export async function updateNoteByIdAndUserId(
  id: number,
  userId: number,
  data: UpdateNote,
): Promise<NoteRecord | undefined> {
  try {
    const [result] = await getPool().execute<ResultSetHeader>(
      `UPDATE notes
          SET title   = :title,
              content = :content
        WHERE id      = :id
          AND user_id = :userId`,
      { title: data.title, content: data.content, id, userId },
    );
    if (result.affectedRows === 0) {
      return undefined;
    }
  } catch (error) {
    throw toDomainError(error, 'updateNoteByIdAndUserId');
  }

  // Read-back is a separate try/catch so a failure here is reported as a
  // post-update read problem rather than the update itself failing.
  try {
    return await findNoteByIdAndUserId(id, userId);
  } catch (error) {
    throw new Error(`Note ${String(id)} was updated but could not be read back`, {
      cause: error,
    });
  }
}

/**
 * Deletes a note owned by the given user. Returns `true` when a row was
 * removed, `false` when nothing matched (nonexistent or foreign-owned).
 */
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
