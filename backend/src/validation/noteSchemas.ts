import { z } from 'zod';

import { AppError } from '../utils/AppError';

/** Matches the `notes.title` column width. */
const MAX_TITLE_LENGTH = 255;

/**
 * Well below the 16 MB MEDIUMTEXT ceiling, but large enough for substantial
 * rich-text documents. Enforcing this before the database prevents oversized
 * payloads from consuming connection time and memory.
 */
const MAX_CONTENT_LENGTH = 5_000_000;

const titleSchema = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(MAX_TITLE_LENGTH, `Title must be at most ${MAX_TITLE_LENGTH} characters`);

/**
 * Content is required as a string, but an empty string is allowed. A note with
 * only a title is a reasonable state — the user may fill in content later,
 * especially when a rich-text editor is involved.
 */
const contentSchema = z
  .string()
  .max(MAX_CONTENT_LENGTH, `Content must be at most ${MAX_CONTENT_LENGTH} characters`);

/** `strictObject` rejects unexpected properties including `userId`/`user_id`. */
export const createNoteSchema = z.strictObject({
  title: titleSchema,
  content: contentSchema,
});

export const updateNoteSchema = z.strictObject({
  title: titleSchema,
  content: contentSchema,
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

/**
 * Validates the `:id` route parameter as a strict positive safe integer.
 * Accepts the `string | string[] | undefined` type that Express 5 gives
 * `req.params` values. Rejects 0, negatives, decimals, non-numeric strings,
 * Infinity, and mixed values such as `"12abc"` that `parseInt` would silently
 * accept.
 */
export function parseNoteId(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number(value ?? '');
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new AppError('Invalid note ID', 400);
  }
  return parsed;
}
