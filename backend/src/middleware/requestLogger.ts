import { randomUUID } from 'node:crypto';
import type { IncomingHttpHeaders, IncomingMessage } from 'node:http';

import type { RequestHandler } from 'express';
import pinoHttp, { type Options, type ReqId } from 'pino-http';

import { logger } from '../utils/logger';

const REQUEST_ID_HEADER = 'x-request-id';

/** Raw request as seen by the message callbacks. */
type LoggableRequest = IncomingMessage & { originalUrl?: string };

/**
 * Shape produced by pino's standard request serializer. pino-http always runs
 * it first and passes the result to a custom serializer, so this — not the raw
 * request — is what `serializeRequest` receives.
 */
interface StandardSerializedRequest {
  id: ReqId;
  method?: string;
  url?: string;
  params?: unknown;
  headers: IncomingHttpHeaders;
  remoteAddress?: string;
  remotePort?: number;
}

interface SerializedRequest {
  id: ReqId;
  method: string | undefined;
  path: string;
  params: unknown;
  headers: IncomingHttpHeaders;
  remoteAddress: string | undefined;
  remotePort: number | undefined;
}

/**
 * Drops the query string. Query strings routinely carry user data such as
 * search terms, email addresses and tokens, none of which belongs in a log.
 */
function stripQuery(target: string): string {
  const queryStart = target.indexOf('?');
  return queryStart === -1 ? target : target.slice(0, queryStart);
}

/**
 * Path for the log message. `originalUrl` is preferred because Express
 * rewrites `req.url` to the router-relative path once a mounted router takes
 * over.
 */
function resolveRequestPath(req: LoggableRequest): string {
  return stripQuery(req.originalUrl ?? req.url ?? '');
}

/**
 * Replaces the standard serializer's `url` (which carries the query string)
 * and removes its parsed `query` object. Everything else worth keeping is
 * passed through: correlation id, method, route params, headers (redacted by
 * the shared logger) and the peer address.
 */
function serializeRequest(req: StandardSerializedRequest): SerializedRequest {
  return {
    id: req.id,
    method: req.method,
    path: stripQuery(req.url ?? ''),
    params: req.params,
    headers: req.headers,
    remoteAddress: req.remoteAddress,
    remotePort: req.remotePort,
  };
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

  serializers: {
    req: serializeRequest,
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
  customReceivedMessage: (req) =>
    `request received: ${req.method ?? 'UNKNOWN'} ${resolveRequestPath(req)}`,
  customSuccessMessage: (req, res) =>
    `request completed: ${req.method ?? 'UNKNOWN'} ${resolveRequestPath(req)} ${res.statusCode}`,
  customErrorMessage: (req, res) =>
    `request errored: ${req.method ?? 'UNKNOWN'} ${resolveRequestPath(req)} ${res.statusCode}`,
};

/**
 * Logs every request on arrival and every response on completion, including
 * method, path, status code and response time. Query strings are stripped and
 * sensitive headers are redacted by the shared logger configuration.
 */
export const requestLogger: RequestHandler = pinoHttp(options);
