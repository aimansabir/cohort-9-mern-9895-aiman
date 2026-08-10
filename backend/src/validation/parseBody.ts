import type { ZodType } from 'zod';

import { AppError } from '../utils/AppError';

/**
 * Validates an untyped request body and returns it as a typed value, or throws
 * a 400 that the global error handler renders.
 *
 * This is a helper rather than a middleware on purpose: middleware would have
 * to write the parsed result back onto `req.body`, which Express types as
 * `any`, and the type safety gained by validating would be lost again on the
 * way to the controller.
 */
export function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (result.success) {
    return result.data;
  }

  const details = result.error.issues
    .map((issue) => {
      const field = issue.path.join('.');
      return field.length > 0 ? `${field}: ${issue.message}` : issue.message;
    })
    .join('; ');

  throw new AppError(`Invalid request: ${details}`, 400);
}
