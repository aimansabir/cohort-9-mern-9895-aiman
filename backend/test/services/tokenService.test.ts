import { expect } from 'chai';
import jwt from 'jsonwebtoken';

import { env } from '../../src/config/env';
import { signAccessToken, verifyAccessToken } from '../../src/services/tokenService';
import { AppError } from '../../src/utils/AppError';

function expectRejected(token: string): void {
  try {
    verifyAccessToken(token);
    expect.fail('the token should have been rejected');
  } catch (error) {
    expect(error).to.be.instanceOf(AppError);
    expect((error as AppError).statusCode).to.equal(401);
  }
}

describe('tokenService', () => {
  it('round trips a user id', () => {
    expect(verifyAccessToken(signAccessToken(7)).userId).to.equal(7);
  });

  it('puts the user id in sub, not in the body', () => {
    const decoded = jwt.decode(signAccessToken(7)) as Record<string, unknown>;
    expect(decoded['sub']).to.equal('7');
    expect(decoded['userId']).to.equal(undefined);
  });

  it('rejects a token that is not a token', () => {
    expectRejected('not.a.token');
  });

  it('rejects a token signed with a different secret', () => {
    const forged = jwt.sign({}, 'some-other-secret-entirely-long-enough', {
      algorithm: 'HS256',
      subject: '7',
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
    });
    expectRejected(forged);
  });

  // issuer and audience are what stop a token from another service being
  // accepted here, so they are worth pinning down
  it('rejects a token issued by something else', () => {
    const other = jwt.sign({}, env.jwt.secret, {
      algorithm: 'HS256',
      subject: '7',
      issuer: 'some-other-api',
      audience: env.jwt.audience,
    });
    expectRejected(other);
  });

  it('rejects a token meant for a different audience', () => {
    const other = jwt.sign({}, env.jwt.secret, {
      algorithm: 'HS256',
      subject: '7',
      issuer: env.jwt.issuer,
      audience: 'some-other-app',
    });
    expectRejected(other);
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign({}, env.jwt.secret, {
      algorithm: 'HS256',
      subject: '7',
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
      expiresIn: '-1s',
    });
    expectRejected(expired);
  });

  it('rejects a subject that is not a usable id', () => {
    ['0', '-3', 'abc', '1.5'].forEach((sub) => {
      const odd = jwt.sign({}, env.jwt.secret, {
        algorithm: 'HS256',
        subject: sub,
        issuer: env.jwt.issuer,
        audience: env.jwt.audience,
      });
      expectRejected(odd);
    });
  });
});
