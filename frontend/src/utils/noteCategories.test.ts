import {
  MAX_CATEGORY_LENGTH,
  SUGGESTED_CATEGORIES,
  categoriesInUse,
  categoryColor,
  isValidCategory,
  sameCategory,
} from './noteCategories';

describe('categoryColor', () => {
  it('gives no colour to a note with no category', () => {
    expect(categoryColor('')).toBe('transparent');
    expect(categoryColor('   ')).toBe('transparent');
  });

  it('keeps the familiar colours for the suggested ones', () => {
    expect(categoryColor('Important')).toBe('#c0392b');
    expect(categoryColor('Study')).toBe('#2563eb');
  });

  // Notes saved before categories were free text hold a lowercase name
  it('colours a suggested one the same whatever its case', () => {
    expect(categoryColor('important')).toBe(categoryColor('Important'));
  });

  // The colour is not stored, so the same name has to come out the same
  // colour every time or a category would change colour between devices
  it('gives a made up category the same colour every time', () => {
    expect(categoryColor('Exam revision')).toBe(categoryColor('Exam revision'));
  });

  it('gives a made up category a real colour rather than nothing', () => {
    expect(categoryColor('Exam revision')).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('ignores surrounding space when working the colour out', () => {
    expect(categoryColor('  Thesis  ')).toBe(categoryColor('Thesis'));
  });
});

describe('isValidCategory', () => {
  it('allows no category at all', () => {
    expect(isValidCategory('')).toBe(true);
    expect(isValidCategory('   ')).toBe(true);
  });

  it('allows the suggested ones', () => {
    for (const name of SUGGESTED_CATEGORIES) {
      expect(isValidCategory(name)).toBe(true);
    }
  });

  it('allows a name with spaces, numbers and hyphens', () => {
    expect(isValidCategory('Exam revision 2026')).toBe(true);
    expect(isValidCategory('exam-revision')).toBe(true);
  });

  it('allows a name that is not written in English', () => {
    expect(isValidCategory('Ideen')).toBe(true);
    expect(isValidCategory('افکار')).toBe(true);
  });

  // The column only holds 20, so a longer name would be cut off silently
  it('turns down a name longer than the column', () => {
    expect(isValidCategory('a'.repeat(MAX_CATEGORY_LENGTH))).toBe(true);
    expect(isValidCategory('a'.repeat(MAX_CATEGORY_LENGTH + 1))).toBe(false);
  });

  it('turns down punctuation that has no business in a category', () => {
    expect(isValidCategory('<script>')).toBe(false);
    expect(isValidCategory('a/b')).toBe(false);
    expect(isValidCategory('why?')).toBe(false);
  });
});

describe('categoriesInUse', () => {
  it('lists what the notes are filed under', () => {
    expect(categoriesInUse(['Study', 'Work', 'Study'])).toEqual(['Study', 'Work']);
  });

  it('leaves out the notes with no category', () => {
    expect(categoriesInUse(['', 'Study', ''])).toEqual(['Study']);
  });

  it('sorts them so the sidebar does not jump about', () => {
    expect(categoriesInUse(['Work', 'Important', 'Study'])).toEqual([
      'Important',
      'Study',
      'Work',
    ]);
  });

  // Otherwise the same category shows up twice under two spellings
  it('counts one category once whatever its case', () => {
    expect(categoriesInUse(['Study', 'study'])).toEqual(['Study']);
  });

  it('has nothing to list when no note is filed', () => {
    expect(categoriesInUse(['', ''])).toEqual([]);
  });
});

describe('sameCategory', () => {
  it('matches a name to itself', () => {
    expect(sameCategory('Study', 'Study')).toBe(true);
  });

  // Notes saved before categories were free text hold a lowercase name, so
  // filtering on Important has to find the ones stored as important
  it('matches whatever the case', () => {
    expect(sameCategory('important', 'Important')).toBe(true);
  });

  it('ignores surrounding space', () => {
    expect(sameCategory('  Work  ', 'Work')).toBe(true);
  });

  it('does not match two different categories', () => {
    expect(sameCategory('Study', 'Work')).toBe(false);
  });
});
