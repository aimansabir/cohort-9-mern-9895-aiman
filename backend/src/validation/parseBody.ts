import type { ZodType } from 'zod';

import { AppError } from '../utils/AppError';

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
