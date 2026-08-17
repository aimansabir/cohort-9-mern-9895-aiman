import { z } from 'zod';

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be at most 100 characters');

const emailSchema = z
  .string()
  .trim()
  .max(255, 'Email must be at most 255 characters')
  .transform((value) => value.toLowerCase())
  .pipe(z.email('Email must be a valid email address'));

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
    message: 'Password must be at most 72 bytes',
  })
  .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), {
    message: 'Password must contain at least one letter and one number',
  });

export const signupSchema = z.strictObject({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

// login doesn't reuse passwordSchema — we just need a non-empty string
export const loginSchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
