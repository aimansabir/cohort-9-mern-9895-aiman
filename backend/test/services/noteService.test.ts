import { expect } from 'chai';

import {
  queries,
  queueResults,
  resetPool,
  rowsResult,
  writeResult,
} from '../helpers/fakePool';
import { silentLogger } from '../helpers/silentLogger';
import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  updateNote,
} from '../../src/services/noteService';
import type { NoteRecord } from '../../src/types/note';
import { AppError } from '../../src/utils/AppError';

const log = silentLogger();

const aRow: NoteRecord = {
  id: 1,
  user_id: 5,
  title: 'Groceries',
  content: '<p>milk</p>',
  is_favourite: 0,
  label: '',
  created_at: new Date('2026-01-02T03:04:05Z'),
  updated_at: new Date('2026-01-02T03:04:05Z'),
};

describe('noteService', () => {
  beforeEach(() => {
    resetPool();
  });

  describe('what it hands back to the client', () => {
    it('never includes the owner id', async () => {
      queueResults(rowsResult([aRow]));
      const note = await getNote(log, 5, 1);

      expect(note).to.not.have.property('user_id');
      expect(note).to.not.have.property('userId');
    });

    it('turns the database dates into ISO strings', async () => {
      queueResults(rowsResult([aRow]));
      const note = await getNote(log, 5, 1);

      expect(note.createdAt).to.equal('2026-01-02T03:04:05.000Z');
      expect(note.updatedAt).to.equal('2026-01-02T03:04:05.000Z');
    });

    it('turns the stored 1 or 0 into a real boolean', async () => {
      queueResults(rowsResult([{ ...aRow, is_favourite: 1 }]));
      expect((await getNote(log, 5, 1)).isFavourite).to.equal(true);
    });

    it('reports a note that is not starred as false', async () => {
      queueResults(rowsResult([{ ...aRow, is_favourite: 0 }]));
      expect((await getNote(log, 5, 1)).isFavourite).to.equal(false);
    });

    it('passes the label straight through', async () => {
      queueResults(rowsResult([{ ...aRow, label: 'important' }]));
      expect((await getNote(log, 5, 1)).label).to.equal('important');
    });

    it('keeps the fields the client actually needs', async () => {
      queueResults(rowsResult([aRow]));
      const note = await getNote(log, 5, 1);

      expect(Object.keys(note).sort()).to.deep.equal([
        'content',
        'createdAt',
        'id',
        'isFavourite',
        'label',
        'title',
        'updatedAt',
      ]);
    });
  });

  // The repository returns nothing for a note owned by someone else, and the
  // service turns that into a 404 rather than a 403, so the response cannot
  // be used to work out which note ids exist.
  describe('a note that is missing or belongs to someone else', () => {
    it('reads as 404', async () => {
      queueResults(rowsResult([]));
      try {
        await getNote(log, 999, 1);
        expect.fail('should have thrown');
      } catch (error) {
        expect(error).to.be.instanceOf(AppError);
        expect((error as AppError).statusCode).to.equal(404);
        expect((error as AppError).message).to.equal('Note not found');
      }
    });

    it('cannot be updated', async () => {
      queueResults(writeResult({ affectedRows: 0 }));
      try {
          await updateNote(log, 999, 1, { title: 'Hijacked', content: '' });
        expect.fail('should have thrown');
      } catch (error) {
        expect((error as AppError).statusCode).to.equal(404);
      }
    });

    it('cannot be deleted', async () => {
      queueResults(writeResult({ affectedRows: 0 }));
      try {
        await deleteNote(log, 999, 1);
        expect.fail('should have thrown');
      } catch (error) {
        expect((error as AppError).statusCode).to.equal(404);
      }
    });
  });

  describe('validation at the service boundary', () => {
    it('answers 400 rather than 500 for a bad title', async () => {
      try {
        await createNote(log, 5, { title: '', content: '' });
        expect.fail('should have thrown');
      } catch (error) {
        expect(error).to.be.instanceOf(AppError);
        expect((error as AppError).statusCode).to.equal(400);
      }
    });

    it('does not touch the database when the input is invalid', async () => {
      try {
        await createNote(log, 5, { title: '', content: '' });
      } catch {
        // expected
      }
      expect(queries).to.have.length(0);
    });
  });

  describe('listNotes', () => {
    it('maps every row', async () => {
      queueResults(rowsResult([aRow, { ...aRow, id: 2 }]));
      const notes = await listNotes(log, 5);

      expect(notes).to.have.length(2);
      expect(notes[0]).to.not.have.property('user_id');
    });

    it('returns an empty list rather than failing when there are none', async () => {
      queueResults(rowsResult([]));
      expect(await listNotes(log, 5)).to.deep.equal([]);
    });
  });

  describe('createNote', () => {
    it('returns the stored note', async () => {
      queueResults(writeResult({ insertId: 1 }), rowsResult([aRow]));
      const note = await createNote(log, 5, { title: 'Groceries', content: '<p>milk</p>', label: '' as const, isFavourite: false });

      expect(note.id).to.equal(1);
      expect(note.title).to.equal('Groceries');
    });
  });
});
