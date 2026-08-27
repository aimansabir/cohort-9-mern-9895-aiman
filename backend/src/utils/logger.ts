import pino, { type Logger, type LoggerOptions } from 'pino';

import { env } from '../config/env';

/**
 * Values that must never reach a log sink. Covers the shapes the API will log
 * once authentication and notes endpoints exist: HTTP headers, request bodies,
 * and nested config/credential objects.
 */
const REDACTED_PATHS: readonly string[] = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'res.headers["set-cookie"]',
  'req.body.password',
  'req.body.currentPassword',
  'req.body.newPassword',
  'req.body.confirmPassword',
  'req.body.token',
  'req.body.refreshToken',
  'password',
  'passwordHash',
  'confirmPassword',
  'authorization',
  'cookie',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'DB_PASSWORD',
  'JWT_SECRET',
  '*.password',
  '*.passwordHash',
  '*.authorization',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.secret',
];

const baseOptions: LoggerOptions = {
  level: env.logLevel,
  base: { service: 'notes-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [...REDACTED_PATHS],
    censor: '[REDACTED]',
  },
};

function createLogger(): Logger {
  // Pretty output is a development convenience only: production emits newline
  // delimited JSON and does not depend on `pino-pretty` being installed.
  if (!env.isDevelopment) {
    return pino(baseOptions);
  }

  return pino({
    ...baseOptions,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss.l',
        ignore: 'pid,hostname,service',
      },
    },
  });
}

export const logger: Logger = createLogger();
