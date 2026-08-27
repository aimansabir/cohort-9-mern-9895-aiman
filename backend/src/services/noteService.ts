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
import { createNoteSchema, patchNoteSchema, updateNoteSchema } from '../validation/noteSchemas';
import type {
  CreateNoteInput,
  PatchNoteInput,
  UpdateNoteInput,
} from '../validation/noteSchemas';
import { parseBody } from '../validation/parseBody';

const NOTE_NOT_FOUND_MESSAGE = 'Note not found';

function toPublicNote(record: NoteRecord): PublicNote {
  return {
    id: record.id,
    title: record.title,
    content: record.content,
    // the driver hands back 0 or 1 for a TINYINT
    isFavourite: Boolean(record.is_favourite),
    label: record.label,
    createdAt: record.created_at.toISOString(),
    updatedAt: record.updated_at.toISOString(),
  };
}

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
    const validated = parseBody(createNoteSchema, input);
    const record = await insertNote({
      userId,
      title: validated.title,
      content: validated.content,
      label: validated.label,
      isFavourite: validated.isFavourite,
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
    const validated = parseBody(updateNoteSchema, input);
    // label and isFavourite are only passed on when the caller sent them, so
    // editing the text on its own leaves the star and the colour alone.
    const record = await updateNoteByIdAndUserId(noteId, userId, {
      title: validated.title,
      content: validated.content,
      label: validated.label,
      isFavourite: validated.isFavourite,
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

export async function patchNote(
  log: Logger,
  userId: number,
  noteId: number,
  input: PatchNoteInput,
): Promise<PublicNote> {
  try {
    const validated = parseBody(patchNoteSchema, input);
    const record = await updateNoteByIdAndUserId(noteId, userId, validated);

    if (record === undefined) {
      throw new AppError(NOTE_NOT_FOUND_MESSAGE, 404);
    }

    log.info({ userId, noteId }, 'Note label or favourite changed');
    return toPublicNote(record);
  } catch (error) {
    return rethrow(log, error, 'Changing a note label or favourite failed unexpectedly');
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
