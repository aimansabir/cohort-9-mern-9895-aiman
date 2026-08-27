const MIN_ERROR_STATUS = 400;
const MAX_ERROR_STATUS = 599;

/**
 * Error carrying an HTTP status code and a message that is safe to return to
 * the client. Anything that is not an `AppError` is treated as unexpected by
 * the global error handler and reported as a generic 500.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);

    // Only 4xx/5xx make sense here: the global error handler passes this
    // straight to `res.status()`, so a 2xx would answer an error with success.
    if (
      !Number.isInteger(statusCode) ||
      statusCode < MIN_ERROR_STATUS ||
      statusCode > MAX_ERROR_STATUS
    ) {
      throw new RangeError(
        `AppError status code must be an integer between ${MIN_ERROR_STATUS} and ${MAX_ERROR_STATUS}, received ${String(statusCode)}`,
      );
    }

    this.name = 'AppError';
    this.statusCode = statusCode;
    Error.captureStackTrace(this, AppError);
  }
}
