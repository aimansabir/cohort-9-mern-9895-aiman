import mysql, {
  type ConnectionOptions,
  type Pool,
  type PoolConnection,
  type PoolOptions,
} from 'mysql2/promise';

import { logger } from '../utils/logger';
import { env } from './env';

let pool: Pool | undefined;

export function buildConnectionOptions(): ConnectionOptions {
  return {
    host: env.database.host,
    port: env.database.port,
    user: env.database.user,
    password: env.database.password,
    database: env.database.name,
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

export function getPool(): Pool {
  if (pool === undefined) {
    pool = mysql.createPool(buildPoolOptions());
    logger.info(
      { host: env.database.host, port: env.database.port, database: env.database.name },
      'MySQL pool created',
    );
  }
  return pool;
}

export async function pingDatabase(): Promise<void> {
  // getConnection() can fail too, so it goes inside the try
  let connection: PoolConnection | undefined;

  try {
    connection = await getPool().getConnection();
    await connection.ping();
  } catch (error) {
    logger.error({ err: error }, 'Failed to connect to MySQL');
    throw error;
  } finally {
    connection?.release();
  }
}

export async function closeDatabasePool(): Promise<void> {
  if (pool === undefined) return;
  const closing = pool;
  pool = undefined;

  try {
    await closing.end();
    logger.info('MySQL pool closed');
  } catch (error) {
    logger.error({ err: error }, 'Failed to close MySQL pool');
    throw error;
  }
}
