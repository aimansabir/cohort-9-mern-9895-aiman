import { expect } from 'chai';

import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  verifyPassword,
} from '../../src/services/passwordService';

const BCRYPT_SHAPE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

describe('passwordService', () => {
  it('produces a bcrypt hash rather than the password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).to.match(BCRYPT_SHAPE);
    expect(hash).to.not.contain('correct horse');
  });

  it('salts, so the same password hashes differently each time', async () => {
    const [a, b] = await Promise.all([hashPassword('same input'), hashPassword('same input')]);
    expect(a).to.not.equal(b);
  });

  it('accepts the right password', async () => {
    const hash = await hashPassword('let me in');
    expect(await verifyPassword('let me in', hash)).to.equal(true);
  });

  it('rejects the wrong password', async () => {
    const hash = await hashPassword('let me in');
    expect(await verifyPassword('let me out', hash)).to.equal(false);
  });

  it('is case sensitive', async () => {
    const hash = await hashPassword('CaseMatters1');
    expect(await verifyPassword('casematters1', hash)).to.equal(false);
  });

  // If this were not a real hash, bcrypt.compare would return false straight
  // away instead of doing the work, and an unknown email would answer faster
  // than a known one. That timing difference leaks which emails exist.
  it('has a dummy hash that is a real bcrypt hash', () => {
    expect(DUMMY_PASSWORD_HASH).to.match(BCRYPT_SHAPE);
  });

  it('never matches a password against the dummy hash', async () => {
    expect(await verifyPassword('anything at all', DUMMY_PASSWORD_HASH)).to.equal(false);
  });
});
