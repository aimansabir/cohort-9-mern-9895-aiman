import type { ErrorRequestHandler } from 'express';

import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

interface ErrorResponseBody {
  success: false;
  message: string;
  stack?: string;
}

const INTERNAL_SERVER_ERROR = 500;

/**
 * Reads a status code from errors raised by Express internals (for example the
 * 400 that `express.json()` throws on malformed bodies).
 */
function readStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  if (typeof error !== 'object' || error === null) {
    return INTERNAL_SERVER_ERROR;
  }
  const { status, statusCode } = error as { status?: unknown; statusCode?: unknown };
  const candidate = typeof statusCode === 'number' ? statusCode : status;
  if (typeof candidate === 'number' && candidate >= 400 && candidate <= 599) {
    return candidate;
  }
  return INTERNAL_SERVER_ERROR;
}

/**
 * Single exit point for every error raised in the request pipeline. Logs
 * through Pino and returns a response that never leaks internals in
 * production.
 */
export const errorHandler: ErrorRequestHandler = (error, req, res, next): void => {
  // Express cannot rewrite a response that is already streaming, so hand it
  // back to the built-in handler to terminate the connection.
  if (res.headersSent) {
    next(error);
    return;
  }

  const statusCode = readStatusCode(error);
  const message =
    error instanceof AppError
      ? error.message
      : statusCode < INTERNAL_SERVER_ERROR
        ? 'Invalid request'
        : 'Internal server error';

  const log = req.log ?? logger;
  if (statusCode >= INTERNAL_SERVER_ERROR) {
    log.error({ err: error, statusCode }, 'Request failed with an unexpected error');
  } else {
    log.warn({ err: error, statusCode }, 'Request rejected');
  }

  const body: ErrorResponseBody = { success: false, message };
  if (!env.isProduction && error instanceof Error && error.stack !== undefined) {
    body.stack = error.stack;
  }

  res.status(statusCode).json(body);
};
