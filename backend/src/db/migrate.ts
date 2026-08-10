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

/**
 * Applies every `.sql` file in `db/migrations` that this database has not seen
 * yet, in filename order, recording each one in `schema_migrations` so reruns
 * are no-ops.
 */
async function runMigrations(): Promise<void> {
  let connection: Connection | undefined;

  try {
    connection = await mysql.createConnection({
      ...buildConnectionOptions(),
      // Lets a single migration file contain several statements. Safe here
      // because migration SQL is authored in this repository and never built
      // from user input; the application pool deliberately leaves this off.
      multipleStatements: true,
    });

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
      await connection.end();
    }
  }
}

void runMigrations().catch((error: unknown) => {
  logger.fatal({ err: error }, 'Migration runner crashed');
  process.exitCode = 1;
});
