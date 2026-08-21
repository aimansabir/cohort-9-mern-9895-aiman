import { expect } from 'chai';

import { AppError } from '../../src/utils/AppError';
import {
  createNoteSchema,
  parseNoteId,
  updateNoteSchema,
} from '../../src/validation/noteSchemas';

describe('parseNoteId', () => {
  it('accepts a plain positive integer', () => {
    expect(parseNoteId('1')).to.equal(1);
    expect(parseNoteId('42')).to.equal(42);
  });

  // Number() accepts every one of these, which is the reason the check is a
  // digits only regex instead. Each of them would otherwise reach the query.
  const numberWouldAccept = ['1e3', '0x10', '0b101', ' 12 ', '+5', '1.0'];

  numberWouldAccept.forEach((raw) => {
    it(`rejects ${JSON.stringify(raw)}, which Number() would accept`, () => {
      expect(() => parseNoteId(raw)).to.throw(AppError, 'Invalid note ID');
    });
  });

  it('rejects zero and negatives', () => {
    expect(() => parseNoteId('0')).to.throw(AppError);
    expect(() => parseNoteId('-1')).to.throw(AppError);
  });

  it('rejects an empty string', () => {
    expect(() => parseNoteId('')).to.throw(AppError);
  });

  it('rejects a missing id', () => {
    expect(() => parseNoteId(undefined)).to.throw(AppError);
  });

  it('rejects repeated query parameters, which arrive as an array', () => {
    expect(() => parseNoteId(['1', '2'])).to.throw(AppError);
  });

  it('rejects a number too large to be exact', () => {
    expect(() => parseNoteId('99999999999999999999')).to.throw(AppError);
  });

  it('reports 400 rather than 500', () => {
    try {
      parseNoteId('nope');
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).to.be.instanceOf(AppError);
      expect((error as AppError).statusCode).to.equal(400);
    }
  });
});

describe('createNoteSchema', () => {
  it('accepts a title and content', () => {
    const result = createNoteSchema.parse({ title: 'Groceries', content: '<p>milk</p>' });
    expect(result.title).to.equal('Groceries');
    expect(result.content).to.equal('<p>milk</p>');
  });

  it('trims the title', () => {
    expect(createNoteSchema.parse({ title: '  Spaced  ', content: '' }).title).to.equal('Spaced');
  });

  it('rejects a title that is only whitespace', () => {
    expect(() => createNoteSchema.parse({ title: '   ', content: '' })).to.throw();
  });

  it('rejects a title over 255 characters', () => {
    expect(() => createNoteSchema.parse({ title: 'a'.repeat(256), content: '' })).to.throw();
  });

  it('accepts a title of exactly 255 characters', () => {
    expect(createNoteSchema.parse({ title: 'a'.repeat(255), content: '' }).title).to.have.length(255);
  });

  it('accepts empty content', () => {
    expect(createNoteSchema.parse({ title: 'Empty', content: '' }).content).to.equal('');
  });

  // strictObject is what stops a request smuggling in someone else's user id
  it('rejects unexpected keys', () => {
    expect(() =>
      createNoteSchema.parse({ title: 'Mine', content: '', userId: 99 }),
    ).to.throw();
  });

  it('rejects a missing title', () => {
    expect(() => createNoteSchema.parse({ content: 'no title' })).to.throw();
  });
});

describe('updateNoteSchema', () => {
  it('accepts a title and content', () => {
    const result = updateNoteSchema.parse({ title: 'Renamed', content: '<p>body</p>' });
    expect(result.title).to.equal('Renamed');
  });

  it('rejects unexpected keys', () => {
    expect(() => updateNoteSchema.parse({ title: 'x', content: '', id: 3 })).to.throw();
  });
});
