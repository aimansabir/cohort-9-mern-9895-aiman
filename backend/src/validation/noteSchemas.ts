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

// One colour label per note. The empty string means no label, which is what
// The column is VARCHAR(20), so this is the same limit.
const MAX_LABEL_LENGTH = 20;

// A category is a short name the user picked rather than one of a fixed set,
// so it is checked by shape. The empty string means no category. Letters and
// numbers are matched by unicode class so a name is not forced into English.
const labelSchema = z
  .string()
  .trim()
  .max(MAX_LABEL_LENGTH, `Category must be at most ${MAX_LABEL_LENGTH} characters`)
  .refine((value) => value === '' || /^[\p{L}\p{N} -]+$/u.test(value), {
    message: 'Category can only hold letters, numbers, spaces and hyphens',
  });

// strictObject rejects anything extra, so userId/user_id in the body is an error
export const createNoteSchema = z.strictObject({
  title: titleSchema,
  content: contentSchema,
  label: labelSchema.default(''),
  isFavourite: z.boolean().default(false),
});

// label and isFavourite are optional here rather than defaulted, because a
// missing field has to mean "leave it as it was". Defaulting them would let
// an edit of the text quietly unstar the note.
export const updateNoteSchema = z.strictObject({
  title: titleSchema,
  content: contentSchema,
  label: labelSchema.optional(),
  isFavourite: z.boolean().optional(),
});

// Starring a note or recolouring it should not mean sending the whole note
// back, so this accepts just the parts that change.
export const patchNoteSchema = z
  .strictObject({
    label: labelSchema.optional(),
    isFavourite: z.boolean().optional(),
  })
  .refine((value) => value.label !== undefined || value.isFavourite !== undefined, {
    message: 'Provide a label or a favourite flag to change',
  });

// z.input rather than z.infer, because these describe what a caller hands in
// and the defaults above have not been filled in at that point. The service
// validates what it is given, so it has to accept the shape before defaults.
export type CreateNoteInput = z.input<typeof createNoteSchema>;
export type UpdateNoteInput = z.input<typeof updateNoteSchema>;
export type PatchNoteInput = z.input<typeof patchNoteSchema>;

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
