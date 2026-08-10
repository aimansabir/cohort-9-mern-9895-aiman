import mysql, {
  type ConnectionOptions,
  type Pool,
  type PoolConnection,
  type PoolOptions,
} from 'mysql2/promise';

import { logger } from '../utils/logger';
import { env } from './env';

let pool: Pool | undefined;

/**
 * Credentials shared by the application pool and the migration runner, so the
 * database connection is configured in exactly one place.
 */
export function buildConnectionOptions(): ConnectionOptions {
  return {
    host: env.database.host,
    port: env.database.port,
    user: env.database.user,
    password: env.database.password,
    database: env.database.name,
    // Repositories bind values with `:name` placeholders; SQL is never built
    // by string concatenation.
    namedPlaceholders: true,
  };
}

function buildPoolOptions(): PoolOptions {
  return {
    ...buildConnectionOptions(),
    waitForConnections: true,
    connectionLimit: env.database.connectionLimit,
    queueLimit: 0,
    enableKeepAlive: true,
  };
}

/**
 * Returns the shared MySQL connection pool, creating it on first use. Callers
 * must never create their own connections.
 */
export function getPool(): Pool {
  if (pool === undefined) {
    pool = mysql.createPool(buildPoolOptions());
    logger.info(
      {
        host: env.database.host,
        port: env.database.port,
        database: env.database.name,
        connectionLimit: env.database.connectionLimit,
      },
      'MySQL connection pool created',
    );
  }
  return pool;
}

/**
 * Borrows a connection and pings it, throwing when MySQL cannot be reached.
 * Deliberately silent so callers decide how a failure should be reported: this
 * runs both once at startup and on every health check. No schema is created
 * here.
 */
export async function pingDatabase(): Promise<void> {
  let connection: PoolConnection | undefined;
  try {
    connection = await getPool().getConnection();
    await connection.ping();
  } catch (error) {
    throw new Error(
      `Unable to reach MySQL database "${env.database.name}" at ${env.database.host}:${env.database.port}`,
      { cause: error },
    );
  } finally {
    connection?.release();
  }
}

/** Closes the pool during shutdown. Safe to call when no pool was created. */
export async function closeDatabasePool(): Promise<void> {
  if (pool === undefined) {
    return;
  }
  const closing = pool;
  pool = undefined;
  try {
    await closing.end();
    logger.info('MySQL connection pool closed');
  } catch (error) {
    logger.error({ err: error }, 'Failed to close the MySQL connection pool');
  }
}
