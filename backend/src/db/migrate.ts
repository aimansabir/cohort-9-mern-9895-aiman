import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import mysql, { type Connection, type RowDataPacket } from 'mysql2/promise';

import { buildConnectionOptions } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Resolves to `backend/db/migrations` from both `src/db` and the compiled
 * `dist/db`, since both sit two levels below the package root.
 */
const MIGRATIONS_DIRECTORY = path.resolve(__dirname, '../../db/migrations');
const MIGRATION_LOCK_TIMEOUT_SECONDS = 10;

const CREATE_MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    name       VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (name)
  ) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE = utf8mb4_unicode_ci;
`;

interface AppliedMigrationRow extends RowDataPacket {
  name: string;
}

interface AdvisoryLockRow extends RowDataPacket {
  lockAcquired: 0 | 1 | null;
}

interface AdvisoryLockReleaseRow extends RowDataPacket {
  lockReleased: 0 | 1 | null;
}

function buildMigrationLockName(databaseName: string): string {
  // Keep the lock name under MySQL's 64-character limit while still scoping it
  // to the configured database.
  const databaseScope = createHash('sha256').update(databaseName).digest('hex').slice(0, 16);
  return `notes-api:migrations:${databaseScope}`;
}

async function acquireMigrationLock(connection: Connection, lockName: string): Promise<void> {
  const [rows] = await connection.query<AdvisoryLockRow[]>(
    'SELECT GET_LOCK(:lockName, :timeoutSeconds) AS lockAcquired',
    { lockName, timeoutSeconds: MIGRATION_LOCK_TIMEOUT_SECONDS },
  );

  const lockAcquired = rows[0]?.lockAcquired;
  if (lockAcquired === 1) {
    return;
  }

  if (lockAcquired === 0) {
    throw new Error(
      `Timed out after ${String(MIGRATION_LOCK_TIMEOUT_SECONDS)} seconds waiting for migration advisory lock`,
    );
  }

  throw new Error('MySQL did not acquire the migration advisory lock');
}

async function releaseMigrationLock(connection: Connection, lockName: string): Promise<void> {
  const [rows] = await connection.query<AdvisoryLockReleaseRow[]>(
    'SELECT RELEASE_LOCK(:lockName) AS lockReleased',
    { lockName },
  );

  if (rows[0]?.lockReleased !== 1) {
    throw new Error('MySQL did not release the migration advisory lock');
  }
}

/**
 * Applies every `.sql` file in `db/migrations` that this database has not seen
 * yet, in filename order, recording each one in `schema_migrations` so reruns
 * are no-ops.
 */
async function runMigrations(): Promise<void> {
  let connection: Connection | undefined;
  let migrationLockName: string | undefined;
  let migrationLockAcquired = false;

  try {
    const connectionOptions = buildConnectionOptions();
    if (connectionOptions.database === undefined || connectionOptions.database.length === 0) {
      throw new Error('Migration advisory lock requires a configured database name');
    }
    migrationLockName = buildMigrationLockName(connectionOptions.database);

    connection = await mysql.createConnection({
      ...connectionOptions,
      // Lets a single migration file contain several statements. Safe here
      // because migration SQL is authored in this repository and never built
      // from user input; the application pool deliberately leaves this off.
      multipleStatements: true,
    });

    await acquireMigrationLock(connection, migrationLockName);
    migrationLockAcquired = true;

    await connection.query(CREATE_MIGRATIONS_TABLE);

    const [appliedRows] = await connection.query<AppliedMigrationRow[]>(
      'SELECT name FROM schema_migrations',
    );
    const applied = new Set(appliedRows.map((row) => row.name));

    const files = await readdir(MIGRATIONS_DIRECTORY);
    const pending = files.filter((file) => file.endsWith('.sql') && !applied.has(file)).sort();

    if (pending.length === 0) {
      logger.info({ alreadyApplied: applied.size }, 'No pending migrations');
      return;
    }

    for (const file of pending) {
      const sql = await readFile(path.join(MIGRATIONS_DIRECTORY, file), 'utf8');

      // MySQL commits DDL implicitly, so this transaction only makes the
      // bookkeeping of data migrations atomic. A DDL migration that fails
      // partway may still need to be inspected by hand.
      await connection.beginTransaction();
      try {
        await connection.query(sql);
        await connection.query('INSERT INTO schema_migrations (name) VALUES (:name)', {
          name: file,
        });
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw new Error(`Migration ${file} failed`, { cause: error });
      }

      logger.info({ migration: file }, 'Migration applied');
    }

    logger.info({ applied: pending.length }, 'Migrations complete');
  } catch (error) {
    logger.fatal({ err: error }, 'Migration run failed');
    process.exitCode = 1;
  } finally {
    if (connection !== undefined) {
      try {
        if (migrationLockAcquired && migrationLockName !== undefined) {
          await releaseMigrationLock(connection, migrationLockName);
        }
      } catch (error) {
        logger.error({ err: error }, 'Failed to release migration advisory lock');
        if (process.exitCode === undefined || process.exitCode === 0) {
          process.exitCode = 1;
        }
      } finally {
        await connection.end();
      }
    }
  }
}

void runMigrations().catch((error: unknown) => {
  logger.fatal({ err: error }, 'Migration runner crashed');
  process.exitCode = 1;
});
