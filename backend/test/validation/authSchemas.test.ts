import { expect } from 'chai';

import { loginSchema, signupSchema } from '../../src/validation/authSchemas';

const validSignup = {
  name: 'Aiman',
  email: 'aiman@example.com',
  password: 'GoodPass1',
};

describe('signupSchema', () => {
  it('accepts a sensible signup', () => {
    const result = signupSchema.parse(validSignup);
    expect(result.name).to.equal('Aiman');
    expect(result.email).to.equal('aiman@example.com');
  });

  // Stored lowercase so the same person cannot end up with two accounts
  it('lowercases and trims the email', () => {
    const result = signupSchema.parse({ ...validSignup, email: '  Aiman@Example.COM  ' });
    expect(result.email).to.equal('aiman@example.com');
  });

  it('trims the name', () => {
    expect(signupSchema.parse({ ...validSignup, name: '  Aiman  ' }).name).to.equal('Aiman');
  });

  it('rejects a name shorter than 2 characters', () => {
    expect(() => signupSchema.parse({ ...validSignup, name: 'A' })).to.throw();
  });

  it('rejects a name over 100 characters', () => {
    expect(() => signupSchema.parse({ ...validSignup, name: 'a'.repeat(101) })).to.throw();
  });

  it('rejects something that is not an email', () => {
    ['plainword', 'no@domain', '@example.com', 'spaces in@example.com'].forEach((email) => {
      expect(() => signupSchema.parse({ ...validSignup, email }), email).to.throw();
    });
  });

  it('rejects a password under 8 characters', () => {
    expect(() => signupSchema.parse({ ...validSignup, password: 'Short1' })).to.throw();
  });

  it('rejects a password with no number', () => {
    expect(() => signupSchema.parse({ ...validSignup, password: 'nodigitshere' })).to.throw();
  });

  it('rejects a password with no letter', () => {
    expect(() => signupSchema.parse({ ...validSignup, password: '12345678' })).to.throw();
  });

  it('accepts a password of exactly 8 with a letter and a number', () => {
    expect(signupSchema.parse({ ...validSignup, password: 'abcdefg1' }).password).to.equal('abcdefg1');
  });

  // bcrypt silently ignores anything past 72 bytes, so a longer password
  // would not actually all be used
  it('rejects a password over 72 bytes', () => {
    expect(() => signupSchema.parse({ ...validSignup, password: 'a1'.repeat(37) })).to.throw();
  });

  it('counts bytes rather than characters for that limit', () => {
    // each of these is 4 bytes in utf8, so 20 of them is 80 bytes
    const emoji = '\u{1F600}'.repeat(20);
    expect(() => signupSchema.parse({ ...validSignup, password: `ab1${emoji}` })).to.throw();
  });

  it('rejects unexpected keys', () => {
    expect(() => signupSchema.parse({ ...validSignup, isAdmin: true })).to.throw();
  });

  it('rejects a missing field', () => {
    expect(() => signupSchema.parse({ email: 'a@b.com', password: 'GoodPass1' })).to.throw();
  });
});

describe('loginSchema', () => {
  it('accepts an email and password', () => {
    const result = loginSchema.parse({ email: 'aiman@example.com', password: 'anything' });
    expect(result.email).to.equal('aiman@example.com');
  });

  it('lowercases the email so it matches what signup stored', () => {
    expect(loginSchema.parse({ email: 'AIMAN@EXAMPLE.COM', password: 'x' }).email).to.equal(
      'aiman@example.com',
    );
  });

  // Deliberately not the signup rule. Someone whose password predates the
  // rule still has to be able to log in.
  it('does not apply the signup password rule', () => {
    expect(() => loginSchema.parse({ email: 'a@b.com', password: 'short' })).to.not.throw();
  });

  it('still requires a password', () => {
    expect(() => loginSchema.parse({ email: 'a@b.com', password: '' })).to.throw();
  });

  it('rejects unexpected keys', () => {
    expect(() => loginSchema.parse({ email: 'a@b.com', password: 'x', role: 'admin' })).to.throw();
  });
});
