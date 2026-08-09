/**
 * Error carrying an HTTP status code and a message that is safe to return to
 * the client. Anything that is not an `AppError` is treated as unexpected by
 * the global error handler and reported as a generic 500.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    Error.captureStackTrace(this, AppError);
  }
}
