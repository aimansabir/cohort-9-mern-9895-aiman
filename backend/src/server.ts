import type { Server } from 'node:http';

import { createApp } from './app';
import { closeDatabasePool, pingDatabase } from './config/database';
import { env } from './config/env';
import { logger } from './utils/logger';

const SHUTDOWN_TIMEOUT_MS = 10_000;

let httpServer: Server | undefined;
let isShuttingDown = false;

function closeHttpServer(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (httpServer === undefined || !httpServer.listening) {
      resolve();
      return;
    }
    httpServer.close((error) => {
      if (error !== undefined) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

/**
 * Stops accepting connections, drains the MySQL pool and lets the event loop
 * empty so buffered logs are flushed. A watchdog forces exit if anything hangs.
 */
async function shutdown(reason: string, exitCode: number): Promise<void> {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  logger.info({ reason }, 'Shutdown requested');

  const watchdog = setTimeout(() => {
    logger.error({ timeoutMs: SHUTDOWN_TIMEOUT_MS }, 'Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  // Do not keep the process alive purely for the watchdog.
  watchdog.unref();

  let resolvedExitCode = exitCode;
  try {
    await closeHttpServer();
    await closeDatabasePool();
    logger.info('Shutdown complete');
  } catch (error) {
    logger.error({ err: error }, 'Shutdown finished with errors');
    resolvedExitCode = 1;
  }

  process.exitCode = resolvedExitCode;
}

async function start(): Promise<void> {
  // The API cannot serve its purpose without MySQL, so an unreachable database
  // aborts startup in every environment rather than leaving a server running
  // that would misreport itself as healthy.
  try {
    await pingDatabase();
    logger.info(
      { host: env.database.host, port: env.database.port, database: env.database.name },
      'MySQL connection verified',
    );
  } catch (error) {
    logger.fatal({ err: error }, 'Database is unreachable, refusing to start');
    await closeDatabasePool();
    // Let the event loop drain instead of calling process.exit() so buffered
    // log output is flushed before the process ends.
    process.exitCode = 1;
    return;
  }

  // A signal can arrive while the readiness check above is still pending. If
  // shutdown already ran, binding a port now would leave a listener behind
  // that nothing is left to close.
  if (isShuttingDown) {
    logger.warn('Shutdown started during startup, not binding the HTTP server');
    return;
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info({ port: env.port, environment: env.nodeEnv }, 'HTTP server listening');
  });

  server.on('error', (error) => {
    logger.fatal({ err: error }, 'HTTP server error');
    void shutdown('server-error', 1);
  });

  httpServer = server;
}

process.on('SIGINT', () => {
  void shutdown('SIGINT', 0);
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM', 0);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
  void shutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (error: Error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  void shutdown('uncaughtException', 1);
});

start().catch((error: unknown) => {
  logger.fatal({ err: error }, 'Failed to start the server');
  process.exit(1);
});
