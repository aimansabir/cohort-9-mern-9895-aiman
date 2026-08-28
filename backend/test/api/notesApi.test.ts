import { expect } from 'chai';
import request from 'supertest';
import type { Application } from 'express';

import { queries, queueResults, resetPool, rowsResult, writeResult } from '../helpers/fakePool';
import { createApp } from '../../src/app';
import { signAccessToken } from '../../src/services/tokenService';
import type { NoteRecord } from '../../src/types/note';

// These go through the real app: the router, the authenticate middleware, the
// controller and the error handler. Only the database is stood in for.
const app: Application = createApp();
const token = signAccessToken(5);
const auth = `Bearer ${token}`;

const aRow: NoteRecord = {
  id: 1,
  user_id: 5,
  title: 'Groceries',
  content: '<p>milk</p>',
  is_favourite: 0,
  label: '',
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
};

describe('notes API', () => {
  beforeEach(() => {
    resetPool();
  });

  describe('without a token', () => {
    it('refuses to list notes', async () => {
      const response = await request(app).get('/api/notes');

      expect(response.status).to.equal(401);
    });

    it('refuses to create a note', async () => {
      const response = await request(app).post('/api/notes').send({ title: 'x', content: '' });

      expect(response.status).to.equal(401);
    });

    it('refuses a token that is not really signed', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', 'Bearer not.a.real.token');

      expect(response.status).to.equal(401);
    });
  });

  describe('GET /api/notes', () => {
    it('answers with the caller notes', async () => {
      queueResults(rowsResult([aRow]));

      const response = await request(app).get('/api/notes').set('Authorization', auth).expect(200);

      expect(response.body.success).to.equal(true);
      expect(response.body.data.notes).to.have.length(1);
      expect(response.body.data.notes[0].title).to.equal('Groceries');
    });

    // The id in the token is the one that reaches the query, never anything
    // the caller could put in the request
    it('scopes the query to the user in the token', async () => {
      queueResults(rowsResult([]));

      const response = await request(app).get('/api/notes').set('Authorization', auth);

      expect(response.status).to.equal(200);

      expect(queries[0]?.params).to.deep.equal({ userId: 5 });
    });
  });

  describe('POST /api/notes', () => {
    it('creates a note and answers 201', async () => {
      queueResults(writeResult({ insertId: 1 }), rowsResult([aRow]));

      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', auth)
        .send({ title: 'Groceries', content: '<p>milk</p>' })
        .expect(201);

      expect(response.body.data.note.id).to.equal(1);
    });

    it('turns down a note with no title', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', auth)
        .send({ title: '', content: '' })
        .expect(400);

      expect(response.body.success).to.equal(false);
    });

    // A body key nobody asked for is a mistake worth reporting, not something
    // to quietly accept
    it('turns down a body with an unexpected key', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', auth)
        .send({ title: 'x', content: '', userId: 99 });

      expect(response.status).to.equal(400);
    });
  });

  describe('GET /api/notes/:id', () => {
    it('answers 404 for a note the caller does not own', async () => {
      queueResults(rowsResult([]));

      const response = await request(app).get('/api/notes/1').set('Authorization', auth);

      expect(response.status).to.equal(404);
    });

    it('answers 400 for an id that is not a number', async () => {
      const response = await request(app).get('/api/notes/abc').set('Authorization', auth);

      expect(response.status).to.equal(400);
    });
  });

  describe('PATCH /api/notes/:id', () => {
    it('changes just the star', async () => {
      queueResults(writeResult({ affectedRows: 1 }), rowsResult([{ ...aRow, is_favourite: 1 }]));

      const response = await request(app)
        .patch('/api/notes/1')
        .set('Authorization', auth)
        .send({ isFavourite: true })
        .expect(200);

      expect(response.body.data.note.isFavourite).to.equal(true);
    });

    it('turns down a body that asks for nothing', async () => {
      const response = await request(app).patch('/api/notes/1').set('Authorization', auth).send({});

      expect(response.status).to.equal(400);
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('deletes and answers 200', async () => {
      queueResults(writeResult({ affectedRows: 1 }));

      const response = await request(app).delete('/api/notes/1').set('Authorization', auth);

      expect(response.status).to.equal(200);
    });

    it('answers 404 when there was nothing to delete', async () => {
      queueResults(writeResult({ affectedRows: 0 }));

      const response = await request(app).delete('/api/notes/1').set('Authorization', auth);

      expect(response.status).to.equal(404);
    });
  });

  describe('when the database is down', () => {
    // The driver error must not reach the caller, it becomes a plain 500
    it('answers 500 without leaking the driver error', async () => {
      queueResults(new Error('ECONNREFUSED'));

      const response = await request(app).get('/api/notes').set('Authorization', auth).expect(500);

      expect(response.body.success).to.equal(false);
      // The exact generic wording, not just the absence of one string. The
      // repository wraps the driver error, so checking only for ECONNREFUSED
      // would still pass while the internal message leaked through.
      expect(response.body.message).to.equal('Internal server error');
      expect(response.body.message).to.not.contain('findNotesByUserId');
    });
  });

  describe('routes that do not exist', () => {
    it('answers 404 as JSON rather than html', async () => {
      const response = await request(app).get('/api/nope').expect(404);
      expect(response.body.success).to.equal(false);
    });
  });
});
