import { expect } from 'chai';

import {
  queries,
  queueResults,
  resetPool,
  rowsResult,
  writeResult,
} from '../helpers/fakePool';
import {
  createNote,
  deleteNoteByIdAndUserId,
  findNoteByIdAndUserId,
  findNotesByUserId,
  updateNoteByIdAndUserId,
} from '../../src/repositories/noteRepository';
import type { NoteRecord } from '../../src/types/note';

const aRow: NoteRecord = {
  id: 1,
  user_id: 5,
  title: 'Groceries',
  content: '<p>milk</p>',
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
};

function lastSql(): string {
  return (queries.at(-1)?.sql ?? '').replace(/\s+/g, ' ');
}

describe('noteRepository', () => {
  beforeEach(() => {
    resetPool();
  });

  // Every one of these proves the same thing: the user id is part of the
  // query, so one user cannot reach another user's rows even by guessing ids.
  describe('scoping every query to the owner', () => {
    it('filters the list by user id', async () => {
      queueResults(rowsResult([aRow]));
      await findNotesByUserId(5);

      expect(lastSql()).to.contain('WHERE user_id = :userId');
      expect(queries.at(-1)?.params).to.deep.equal({ userId: 5 });
    });

    it('looks a single note up by id and user id together', async () => {
      queueResults(rowsResult([aRow]));
      await findNoteByIdAndUserId(1, 5);

      const sql = lastSql();
      expect(sql).to.contain('WHERE id = :id');
      expect(sql).to.contain('AND user_id = :userId');
      expect(queries.at(-1)?.params).to.deep.equal({ id: 1, userId: 5 });
    });

    it('scopes the update by user id', async () => {
      queueResults(writeResult({ affectedRows: 1 }), rowsResult([aRow]));
      await updateNoteByIdAndUserId(1, 5, { title: 'New', content: 'body' });

      expect(queries[0]?.sql.replace(/\s+/g, ' ')).to.contain('AND user_id = :userId');
    });

    it('scopes the delete by user id', async () => {
      queueResults(writeResult({ affectedRows: 1 }));
      await deleteNoteByIdAndUserId(1, 5);

      expect(lastSql()).to.contain('AND user_id = :userId');
      expect(queries.at(-1)?.params).to.deep.equal({ id: 1, userId: 5 });
    });
  });

  // Someone else's note has to look exactly like a note that does not exist,
  // otherwise the response tells an attacker which ids are real.
  describe('when the note belongs to someone else', () => {
    it('reads as not found rather than as forbidden', async () => {
      queueResults(rowsResult([]));
      expect(await findNoteByIdAndUserId(1, 999)).to.equal(undefined);
    });

    it('updates nothing and reports nothing', async () => {
      queueResults(writeResult({ affectedRows: 0 }));
      expect(await updateNoteByIdAndUserId(1, 999, { title: 'x', content: 'y' })).to.equal(
        undefined,
      );
    });

    it('does not read the note back after an update that changed nothing', async () => {
      queueResults(writeResult({ affectedRows: 0 }));
      await updateNoteByIdAndUserId(1, 999, { title: 'x', content: 'y' });
      expect(queries).to.have.length(1);
    });

    it('deletes nothing and reports false', async () => {
      queueResults(writeResult({ affectedRows: 0 }));
      expect(await deleteNoteByIdAndUserId(1, 999)).to.equal(false);
    });
  });

  describe('createNote', () => {
    it('inserts with the user id from the caller, never from the body', async () => {
      queueResults(writeResult({ insertId: 11 }), rowsResult([{ ...aRow, id: 11 }]));
      await createNote({ userId: 5, title: 'Groceries', content: '<p>milk</p>' });

      expect(queries[0]?.sql.replace(/\s+/g, ' ')).to.contain('INSERT INTO notes (user_id, title, content)');
      expect(queries[0]?.params).to.deep.equal({
        userId: 5,
        title: 'Groceries',
        content: '<p>milk</p>',
      });
    });

    it('returns the note it read back', async () => {
      queueResults(writeResult({ insertId: 11 }), rowsResult([{ ...aRow, id: 11 }]));
      const created = await createNote({ userId: 5, title: 'Groceries', content: '' });
      expect(created.id).to.equal(11);
    });

    it('complains if the row cannot be read back', async () => {
      queueResults(writeResult({ insertId: 11 }), rowsResult([]));
      try {
        await createNote({ userId: 5, title: 'Groceries', content: '' });
        expect.fail('should have thrown');
      } catch (error) {
        expect((error as Error).message).to.contain('could not be read back');
      }
    });
  });

  describe('when the database itself fails', () => {
    it('names the operation instead of leaking the driver message', async () => {
      queueResults(new Error('ER_LOCK_WAIT_TIMEOUT: lock wait timeout exceeded'));

      try {
        await findNotesByUserId(5);
        expect.fail('should have thrown');
      } catch (error) {
        expect((error as Error).message).to.contain('findNotesByUserId');
        expect((error as Error).message).to.not.contain('ER_LOCK_WAIT_TIMEOUT');
      }
    });

    it('keeps the original error as the cause for the logs', async () => {
      const driverError = new Error('ER_NO_SUCH_TABLE');
      queueResults(driverError);

      try {
        await findNotesByUserId(5);
        expect.fail('should have thrown');
      } catch (error) {
        expect((error as Error).cause).to.equal(driverError);
      }
    });
  });
});
