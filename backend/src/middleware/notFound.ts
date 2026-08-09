import type { RequestHandler } from 'express';

/**
 * Terminal handler for requests that matched no route. Registered after all
 * routes and before the global error handler.
 */
export const notFound: RequestHandler = (_req, res): void => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
};
