import { expect } from 'chai';

import { AppError } from '../../src/utils/AppError';

describe('AppError', () => {
  it('defaults to 500', () => {
    expect(new AppError('boom').statusCode).to.equal(500);
  });

  it('keeps the message and is a real Error', () => {
    const error = new AppError('not found', 404);
    expect(error.message).to.equal('not found');
    expect(error.name).to.equal('AppError');
    expect(error).to.be.instanceOf(Error);
  });

  [400, 401, 403, 404, 409, 500, 599].forEach((status) => {
    it(`accepts ${status}`, () => {
      expect(new AppError('ok', status).statusCode).to.equal(status);
    });
  });

  // The global handler passes this straight to res.status(), so a 2xx here
  // would answer a failure with a success code.
  [200, 204, 302, 399, 600, 0, -1].forEach((status) => {
    it(`refuses ${status}`, () => {
      expect(() => new AppError('nope', status)).to.throw(RangeError);
    });
  });

  it('refuses a non integer status', () => {
    expect(() => new AppError('nope', 404.5)).to.throw(RangeError);
    expect(() => new AppError('nope', Number.NaN)).to.throw(RangeError);
  });
});
