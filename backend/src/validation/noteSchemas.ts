import { z } from 'zod';

import { AppError } from '../utils/AppError';

const MAX_TITLE_LENGTH = 255;
// Measured in bytes, and kept under the 1mb express.json() limit in app.ts so
// oversized content fails validation here instead of in the body parser.
const MAX_CONTENT_BYTES = 500_000;

const titleSchema = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(MAX_TITLE_LENGTH, `Title must be at most ${MAX_TITLE_LENGTH} characters`);

const contentSchema = z
  .string()
  .refine((value) => Buffer.byteLength(value, 'utf8') <= MAX_CONTENT_BYTES, {
    message: `Content must be at most ${MAX_CONTENT_BYTES} bytes`,
  });

// strictObject rejects anything extra, so userId/user_id in the body is an error
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

// Digits only, because Number() would otherwise accept "1e3", "0x10" and " 12 ".
export function parseNoteId(raw: string | string[] | undefined): number {
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) {
    throw new AppError('Invalid note ID', 400);
  }

  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new AppError('Invalid note ID', 400);
  }
  return parsed;
}
