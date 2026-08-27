import { expect } from 'chai';

import { AppError } from '../../src/utils/AppError';
import {
  createNoteSchema,
  parseNoteId,
  patchNoteSchema,
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

describe('labels and favourites', () => {
  const aNote = { title: 'Groceries', content: '<p>milk</p>' };

  describe('createNoteSchema', () => {
    it('leaves a new note unlabelled and unstarred by default', () => {
      const parsed = createNoteSchema.parse(aNote);

      expect(parsed.label).to.equal('');
      expect(parsed.isFavourite).to.equal(false);
    });

    ['important', 'Study Group', 'exam-revision', 'Ideas 2026'].forEach((label) => {
      it(`accepts the category ${label}`, () => {
        expect(createNoteSchema.parse({ ...aNote, label }).label).to.equal(label);
      });
    });

    it('trims a category before storing it', () => {
      expect(createNoteSchema.parse({ ...aNote, label: '  Study  ' }).label).to.equal('Study');
    });

    // The column is VARCHAR(20), so a longer name would be cut off silently
    it('refuses a category longer than the column holds', () => {
      expect(() => createNoteSchema.parse({ ...aNote, label: 'a'.repeat(21) })).to.throw();
    });

    it('refuses punctuation that has no business in a category', () => {
      expect(() => createNoteSchema.parse({ ...aNote, label: '<script>' })).to.throw();
      expect(() => createNoteSchema.parse({ ...aNote, label: 'a/b' })).to.throw();
    });

    it('refuses a category that is not text at all', () => {
      expect(() => createNoteSchema.parse({ ...aNote, label: 12 })).to.throw();
    });

    it('refuses a favourite that is not a boolean', () => {
      expect(() => createNoteSchema.parse({ ...aNote, isFavourite: 'yes' })).to.throw();
    });
  });

  describe('updateNoteSchema', () => {
    // This is the whole reason these two are optional rather than defaulted.
    // The editor only sends a title and content, so if they defaulted here,
    // saving an edit would quietly unstar the note and drop its label.
    it('leaves the label and the star untouched when they are not sent', () => {
      const parsed = updateNoteSchema.parse(aNote);

      expect(parsed.label).to.equal(undefined);
      expect(parsed.isFavourite).to.equal(undefined);
    });

    it('still takes them when they are sent', () => {
      const parsed = updateNoteSchema.parse({ ...aNote, label: 'work', isFavourite: true });

      expect(parsed.label).to.equal('work');
      expect(parsed.isFavourite).to.equal(true);
    });
  });

  describe('patchNoteSchema', () => {
    it('takes a star on its own', () => {
      expect(patchNoteSchema.parse({ isFavourite: true }).isFavourite).to.equal(true);
    });

    it('takes a label on its own', () => {
      expect(patchNoteSchema.parse({ label: 'Study' }).label).to.equal('Study');
    });

    it('refuses a body that asks for no change at all', () => {
      expect(() => patchNoteSchema.parse({})).to.throw();
    });

    // The text goes through the full update, so it must not sneak in here
    it('refuses a title or content', () => {
      expect(() => patchNoteSchema.parse({ title: 'New' })).to.throw();
      expect(() => patchNoteSchema.parse({ isFavourite: true, content: '<p>x</p>' })).to.throw();
    });
  });
});
