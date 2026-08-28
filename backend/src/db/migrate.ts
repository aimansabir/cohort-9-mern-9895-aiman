import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import mysql, { type RowDataPacket } from 'mysql2/promise';

import { buildConnectionOptions } from '../config/database';
import { logger } from '../utils/logger';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../db/migrations');

interface AppliedMigrationRow extends RowDataPacket {
  name: string;
}

async function runMigrations(): Promise<void>  {
  const connection = await mysql.createConnection({
    ...buildConnectionOptions(),
    multipleStatements: true, // some migration files have more than one statement
  });

  try {
    // make sure we have a table to keep track of which migrations already ran
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) NOT NULL PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [appliedRows] = await connection.query<AppliedMigrationRow[]>(
      'SELECT name FROM schema_migrations',
    );
    const appliedNames = appliedRows.map((row) => row.name);

    const allFiles = await readdir(MIGRATIONS_DIR);
    // Migrations have to run in file name order, so the comparison is spelled
    // out rather than leaning on the default sort.
    const migrationFiles = allFiles
      .filter((file) => file.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));
    const pendingFiles = migrationFiles.filter((file) => !appliedNames.includes(file));

    if (pendingFiles.length === 0) {
      logger.info('No new migrations to run');
      return;
    }

    for (const file of pendingFiles) {
      logger.info({ migration: file }, 'Running migration');

      const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');

      await connection.query(sql);
      await connection.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
    }

    logger.info({ applied: pendingFiles.length }, 'Migrations complete');
  } finally {
    await connection.end();
  }
}

runMigrations().catch((err) => {
  logger.error({ err }, 'Migration run failed');
  process.exitCode = 1;
});