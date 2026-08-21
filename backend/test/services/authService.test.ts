import { expect } from 'chai';

import { queries, queueResults, resetPool, rowsResult, writeResult } from '../helpers/fakePool';
import { silentLogger } from '../helpers/silentLogger';
import { getUserProfile, logIn, signUp } from '../../src/services/authService';
import { hashPassword } from '../../src/services/passwordService';
import { AppError } from '../../src/utils/AppError';

const log = silentLogger();

function userRow(passwordHash: string) {
  return {
    id: 5,
    name: 'Aiman',
    email: 'aiman@example.com',
    password_hash: passwordHash,
    created_at: new Date('2026-01-02T03:04:05Z'),
    updated_at: new Date('2026-01-02T03:04:05Z'),
  };
}

describe('authService', () => {
  beforeEach(() => {
    resetPool();
  });

  describe('signUp', () => {
    it('returns the user and a token', async () => {
      queueResults(writeResult({ insertId: 5 }), rowsResult([userRow('$2b$12$whatever')]));
      const result = await signUp(log, {
        name: 'Aiman',
        email: 'aiman@example.com',
        password: 'GoodPass1',
      });

      expect(result.user.id).to.equal(5);
      expect(result.token).to.be.a('string').with.length.greaterThan(20);
    });

    // the hash is for the database only, it must never reach the client
    it('never returns the password hash', async () => {
      queueResults(writeResult({ insertId: 5 }), rowsResult([userRow('$2b$12$whatever')]));
      const result = await signUp(log, {
        name: 'Aiman',
        email: 'aiman@example.com',
        password: 'GoodPass1',
      });

      expect(result.user).to.not.have.property('password_hash');
      expect(Object.keys(result.user).sort()).to.deep.equal(['createdAt', 'email', 'id', 'name']);
    });

    it('stores a hash, not the password itself', async () => {
      queueResults(writeResult({ insertId: 5 }), rowsResult([userRow('$2b$12$whatever')]));
      await signUp(log, {
        name: 'Aiman',
        email: 'aiman@example.com',
        password: 'GoodPass1',
      });

      const insert = queries[0]?.params as { passwordHash: string };
      expect(insert.passwordHash).to.match(/^\$2[aby]\$/);
      expect(insert.passwordHash).to.not.contain('GoodPass1');
    });
  });

  describe('logIn', () => {
    it('accepts the right password', async () => {
      const hash = await hashPassword('GoodPass1');
      queueResults(rowsResult([userRow(hash)]));

      const result = await logIn(log, { email: 'aiman@example.com', password: 'GoodPass1' });
      expect(result.user.id).to.equal(5);
    });

    // Both failures answer identically, so the response cannot be used to
    // find out which email addresses have accounts.
    it('gives the same answer for an unknown email and a wrong password', async () => {
      const hash = await hashPassword('GoodPass1');

      queueResults(rowsResult([]));
      let unknownEmail: AppError | undefined;
      try {
        await logIn(log, { email: 'nobody@example.com', password: 'GoodPass1' });
      } catch (error) {
        unknownEmail = error as AppError;
      }

      resetPool();
      queueResults(rowsResult([userRow(hash)]));
      let wrongPassword: AppError | undefined;
      try {
        await logIn(log, { email: 'aiman@example.com', password: 'WrongPass1' });
      } catch (error) {
        wrongPassword = error as AppError;
      }

      expect(unknownEmail?.statusCode).to.equal(401);
      expect(wrongPassword?.statusCode).to.equal(401);
      expect(unknownEmail?.message).to.equal(wrongPassword?.message);
      expect(unknownEmail?.message).to.equal('Invalid email or password');
    });

    it('never returns the password hash', async () => {
      const hash = await hashPassword('GoodPass1');
      queueResults(rowsResult([userRow(hash)]));

      const result = await logIn(log, { email: 'aiman@example.com', password: 'GoodPass1' });
      expect(result.user).to.not.have.property('password_hash');
    });
  });

  describe('getUserProfile', () => {
    it('returns the public fields', async () => {
      queueResults(rowsResult([userRow('$2b$12$whatever')]));
      const user = await getUserProfile(log, 5);

      expect(user.email).to.equal('aiman@example.com');
      expect(user).to.not.have.property('password_hash');
    });

    // the token can outlive the account it was issued for
    it('rejects a token whose account no longer exists', async () => {
      queueResults(rowsResult([]));
      try {
        await getUserProfile(log, 5);
        expect.fail('should have thrown');
      } catch (error) {
        expect((error as AppError).statusCode).to.equal(401);
      }
    });
  });
});
