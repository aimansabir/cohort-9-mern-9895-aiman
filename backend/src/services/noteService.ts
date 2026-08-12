import type { Logger } from 'pino';

import {
  createNote as insertNote,
  deleteNoteByIdAndUserId,
  findNoteByIdAndUserId,
  findNotesByUserId,
  updateNoteByIdAndUserId,
} from '../repositories/noteRepository';
import type { NoteRecord, PublicNote } from '../types/note';
import { AppError } from '../utils/AppError';
import type { CreateNoteInput, UpdateNoteInput } from '../validation/noteSchemas';

const NOTE_NOT_FOUND_MESSAGE = 'Note not found';

/** Drops `user_id` and maps snake_case timestamps to camelCase ISO strings. */
function toPublicNote(record: NoteRecord): PublicNote {
  return {
    id: record.id,
    title: record.title,
    content: record.content,
    createdAt: record.created_at.toISOString(),
    updatedAt: record.updated_at.toISOString(),
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

export async function createNote(
  log: Logger,
  userId: number,
  input: CreateNoteInput,
): Promise<PublicNote> {
  try {
    const record = await insertNote({
      userId,
      title: input.title,
      content: input.content,
    });

    log.info({ userId, noteId: record.id }, 'Note created');
    return toPublicNote(record);
  } catch (error) {
    return rethrow(log, error, 'Note creation failed unexpectedly');
  }
}

export async function listNotes(log: Logger, userId: number): Promise<PublicNote[]> {
  try {
    const records = await findNotesByUserId(userId);
    return records.map(toPublicNote);
  } catch (error) {
    return rethrow(log, error, 'Listing notes failed unexpectedly');
  }
}

export async function getNote(
  log: Logger,
  userId: number,
  noteId: number,
): Promise<PublicNote> {
  try {
    const record = await findNoteByIdAndUserId(noteId, userId);
    if (record === undefined) {
      throw new AppError(NOTE_NOT_FOUND_MESSAGE, 404);
    }
    return toPublicNote(record);
  } catch (error) {
    return rethrow(log, error, 'Reading a note failed unexpectedly');
  }
}

export async function updateNote(
  log: Logger,
  userId: number,
  noteId: number,
  input: UpdateNoteInput,
): Promise<PublicNote> {
  try {
    const record = await updateNoteByIdAndUserId(noteId, userId, {
      title: input.title,
      content: input.content,
    });

    if (record === undefined) {
      throw new AppError(NOTE_NOT_FOUND_MESSAGE, 404);
    }

    log.info({ userId, noteId }, 'Note updated');
    return toPublicNote(record);
  } catch (error) {
    return rethrow(log, error, 'Updating a note failed unexpectedly');
  }
}

export async function deleteNote(
  log: Logger,
  userId: number,
  noteId: number,
): Promise<void> {
  try {
    const deleted = await deleteNoteByIdAndUserId(noteId, userId);
    if (!deleted) {
      throw new AppError(NOTE_NOT_FOUND_MESSAGE, 404);
    }

    log.info({ userId, noteId }, 'Note deleted');
  } catch (error) {
    rethrow(log, error, 'Deleting a note failed unexpectedly');
  }
}
