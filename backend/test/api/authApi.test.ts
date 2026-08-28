import { expect } from 'chai';
import request from 'supertest';
import type { Application } from 'express';

import { queueResults, resetPool, rowsResult, writeResult } from '../helpers/fakePool';
import { createApp } from '../../src/app';
import { hashPassword } from '../../src/services/passwordService';
import { signAccessToken } from '../../src/services/tokenService';
import type { UserRecord } from '../../src/types/user';

const app: Application = createApp();

const PASSWORD = 'GoodPass1';
let aUser: UserRecord;

before(async () => {
  aUser = {
    id: 5,
    name: 'Aiman',
    email: 'aiman@example.com',
    password_hash: await hashPassword(PASSWORD),
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
  };
});

describe('auth API', () => {
  beforeEach(() => {
    resetPool();
  });

  describe('POST /api/auth/signup', () => {
    it('creates the account and hands back a token', async () => {
      queueResults(writeResult({ insertId: 5 }), rowsResult([aUser]));

      const response = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Aiman', email: 'aiman@example.com', password: PASSWORD })
        .expect(201);

      expect(response.body.data.token).to.be.a('string');
      expect(response.body.data.user.email).to.equal('aiman@example.com');
    });

    // The hash is the only thing that should ever leave the server
    it('never sends the password or its hash back', async () => {
      queueResults(writeResult({ insertId: 5 }), rowsResult([aUser]));

      const response = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Aiman', email: 'aiman@example.com', password: PASSWORD })
        .expect(201);

      const body = JSON.stringify(response.body);
      expect(body).to.not.contain(PASSWORD);
      expect(body).to.not.contain('password_hash');
    });

    it('turns down a weak password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Aiman', email: 'aiman@example.com', password: 'short' });

      expect(response.status).to.equal(400);
    });

    it('turns down an email that is not an email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Aiman', email: 'not-an-email', password: PASSWORD });

      expect(response.status).to.equal(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('hands back a token for the right password', async () => {
      queueResults(rowsResult([aUser]));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'aiman@example.com', password: PASSWORD })
        .expect(200);

      expect(response.body.data.token).to.be.a('string');
    });

    it('refuses the wrong password', async () => {
      queueResults(rowsResult([aUser]));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'aiman@example.com', password: 'WrongPass1' });

      expect(response.status).to.equal(401);
    });

    // Saying "no such user" would tell someone which emails are registered
    it('gives the same answer when the email is not registered', async () => {
      queueResults(rowsResult([]));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: PASSWORD })
        .expect(401);

      expect(response.body.message).to.equal('Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    it('says who the token belongs to', async () => {
      queueResults(rowsResult([aUser]));

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${signAccessToken(5)}`)
        .expect(200);

      expect(response.body.data.user.email).to.equal('aiman@example.com');
    });

    it('refuses without a token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).to.equal(401);
    });

    // The token can outlive the account it points at
    it('refuses a token for a user who is gone', async () => {
      queueResults(rowsResult([]));

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${signAccessToken(999)}`);

      expect(response.status).to.equal(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('accepts a signed in caller', async () => {
      queueResults(rowsResult([aUser]));

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${signAccessToken(5)}`);

      expect(response.status).to.equal(200);
    });

    it('refuses without a token', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).to.equal(401);
    });
  });
});
