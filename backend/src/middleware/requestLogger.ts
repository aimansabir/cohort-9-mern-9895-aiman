import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

import type { RequestHandler } from 'express';
import pinoHttp, { type Options } from 'pino-http';

import { logger } from '../utils/logger';

const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Express rewrites `req.url` to the router-relative path once a mounted router
 * takes over, so the full path is only reliable via `originalUrl`.
 */
function resolveUrl(req: IncomingMessage): string {
  const { originalUrl } = req as IncomingMessage & { originalUrl?: string };
  return originalUrl ?? req.url ?? '';
}

const options: Options = {
  logger,

  /** Reuse an upstream correlation id when present, otherwise mint one. */
  genReqId: (req, res): string => {
    const incoming = req.headers[REQUEST_ID_HEADER];
    const requestId = typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID();
    res.setHeader(REQUEST_ID_HEADER, requestId);
    return requestId;
  },

  customLogLevel: (_req, res, error) => {
    if (error !== undefined || res.statusCode >= 500) {
      return 'error';
    }
    if (res.statusCode >= 400) {
      return 'warn';
    }
    return 'info';
  },

  // Providing a "received" message makes pino-http log the inbound request as
  // well as the completed response.
  customReceivedMessage: (req) => `request received: ${req.method ?? 'UNKNOWN'} ${resolveUrl(req)}`,
  customSuccessMessage: (req, res) =>
    `request completed: ${req.method ?? 'UNKNOWN'} ${resolveUrl(req)} ${res.statusCode}`,
  customErrorMessage: (req, res) =>
    `request errored: ${req.method ?? 'UNKNOWN'} ${resolveUrl(req)} ${res.statusCode}`,
};

/**
 * Logs every request on arrival and every response on completion, including
 * method, URL, status code and response time. Sensitive headers are redacted
 * by the shared logger configuration.
 */
export const requestLogger: RequestHandler = pinoHttp(options);
