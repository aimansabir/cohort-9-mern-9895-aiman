import { z } from 'zod';

const MIN_NAME_LENGTH = 2;
/** Matches the `users.name` column width. */
const MAX_NAME_LENGTH = 100;
/** Matches the `users.email` column width. */
const MAX_EMAIL_LENGTH = 255;
const MIN_PASSWORD_LENGTH = 8;
/** bcrypt hashes only the first 72 bytes, so anything longer is misleading. */
const MAX_PASSWORD_BYTES = 72;

const nameSchema = z
  .string()
  .trim()
  .min(MIN_NAME_LENGTH, `Name must be at least ${MIN_NAME_LENGTH} characters`)
  .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`);

/**
 * Trims, lower-cases and then validates. Normalising before the format check
 * means the stored address matches what the unique index compares, so the same
 * account cannot be registered twice under different casing.
 */
const emailSchema = z
  .string()
  .trim()
  .max(MAX_EMAIL_LENGTH, `Email must be at most ${MAX_EMAIL_LENGTH} characters`)
  .transform((value) => value.toLowerCase())
  .pipe(z.email('Email must be a valid email address'));

/**
 * Length-led rather than composition-heavy, with one mild character
 * requirement. Passwords are never trimmed: surrounding whitespace may be
 * deliberate.
 */
const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  .refine((value) => Buffer.byteLength(value, 'utf8') <= MAX_PASSWORD_BYTES, {
    message: `Password must be at most ${MAX_PASSWORD_BYTES} bytes`,
  })
  .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), {
    message: 'Password must contain at least one letter and one number',
  });

/** `strictObject` rejects unexpected properties instead of silently ignoring them. */
export const signupSchema = z.strictObject({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Login deliberately does not reuse `passwordSchema`: rejecting a stored
 * password that no longer meets current rules would turn a credential check
 * into a policy check, and the length hints would leak the rules to attackers.
 */
export const loginSchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
