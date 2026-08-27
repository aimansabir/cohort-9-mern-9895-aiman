import mysql from 'mysql2/promise';

export interface RecordedQuery {
  sql: string;
  params: unknown;
}

export const queries: RecordedQuery[] = [];

let queued: unknown[] = [];

// Each call to execute() takes the next queued result, so a test can line up
// what the database would answer for an insert and the read back after it.
export function queueResults(...results: unknown[]): void {
  queued = [...results];
}

export function resetPool(): void {
  queries.length = 0;
  queued = [];
}

export function rowsResult(rows: unknown[]): unknown {
  return [rows, []];
}

export function writeResult(fields: { insertId?: number; affectedRows?: number }): unknown {
  return [{ insertId: fields.insertId ?? 0, affectedRows: fields.affectedRows ?? 0 }, []];
}

const fakePool = {
  execute: (sql: string, params: unknown): Promise<unknown> => {
    queries.push({ sql, params });
    const next = queued.shift();
    // queue an Error to stand in for the driver failing
    if (next instanceof Error) {
      return Promise.reject(next);
    }
    return Promise.resolve(next ?? rowsResult([]));
  },
};

// getPool() builds its pool lazily through mysql.createPool, so replacing
// that here means the repository talks to this object instead of a database.
(mysql as unknown as { createPool: () => unknown }).createPool = (): unknown => fakePool;
