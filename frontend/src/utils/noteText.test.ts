import {
  countCharacters,
  countWords,
  firstNameOf,
  formatUpdated,
  greetingFor,
  plural,
  sanitizeHtml,
  timeOfDay,
  toPlainText,
} from './noteText';

describe('sanitizeHtml', () => {
  it('keeps the formatting the toolbar can produce', () => {
    const html = '<h1>Title</h1><p><strong>bold</strong> and <em>italic</em></p><ul><li>one</li></ul>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('keeps headings, quotes and both list kinds', () => {
    const html = '<h2>Two</h2><h3>Three</h3><blockquote>quoted</blockquote><ol><li>first</li></ol>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  // A note is put back into the page when it is opened, so anything that
  // could run has to be stripped on the way in and on the way out.
  it('removes a script tag', () => {
    expect(sanitizeHtml('<p>hi</p><script>alert(1)</script>')).toBe('<p>hi</p>');
  });

  it('removes an inline event handler', () => {
    expect(sanitizeHtml('<p onclick="steal()">hi</p>')).toBe('<p>hi</p>');
  });

  it('removes an image with an onerror handler', () => {
    expect(sanitizeHtml('<img src="x" onerror="alert(1)">')).toBe('');
  });

  it('drops a javascript link but keeps the words', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">click</a>')).toBe('click');
  });

  it('removes an iframe', () => {
    expect(sanitizeHtml('<iframe src="https://example.com"></iframe>')).toBe('');
  });

  it('removes style attributes', () => {
    expect(sanitizeHtml('<p style="color:red">hi</p>')).toBe('<p>hi</p>');
  });

  it('leaves empty content alone', () => {
    expect(sanitizeHtml('')).toBe('');
  });
});

describe('toPlainText', () => {
  it('strips the markup', () => {
    expect(toPlainText('<p><strong>Hello</strong> there</p>')).toBe('Hello there');
  });

  // Without a separator the card preview would read "ThingsOneTwo"
  it('keeps a gap between block elements', () => {
    expect(toPlainText('<h2>Things</h2><ul><li>one</li><li>two</li></ul>')).toBe('Things one two');
  });

  it('separates paragraphs and headings of every level', () => {
    expect(toPlainText('<h1>A</h1><h3>B</h3><blockquote>C</blockquote><p>D</p>')).toBe('A B C D');
  });

  it('treats a line break as a gap', () => {
    expect(toPlainText('<p>one<br>two</p>')).toBe('one two');
  });

  it('collapses runs of whitespace', () => {
    expect(toPlainText('<p>lots    of     space</p>')).toBe('lots of space');
  });

  it('returns nothing for empty content', () => {
    expect(toPlainText('')).toBe('');
  });
});

describe('counting', () => {
  it('counts the text rather than the markup', () => {
    expect(countWords('<p>one two three</p>')).toBe(3);
    expect(countCharacters('<p>one two three</p>')).toBe(13);
  });

  it('counts nothing in empty content', () => {
    expect(countWords('')).toBe(0);
    expect(countCharacters('')).toBe(0);
  });

  it('does not count tags as words', () => {
    expect(countWords('<h1>one</h1><p>two</p>')).toBe(2);
  });
});

describe('plural', () => {
  it('only adds an s when it should', () => {
    expect(plural(0, 'note')).toBe('0 notes');
    expect(plural(1, 'note')).toBe('1 note');
    expect(plural(2, 'note')).toBe('2 notes');
  });
});

describe('firstNameOf', () => {
  it('takes the first part of a full name', () => {
    expect(firstNameOf('Aiman Gul Sabir')).toBe('Aiman');
  });

  it('leaves a single name alone', () => {
    expect(firstNameOf('Aiman')).toBe('Aiman');
  });

  it('copes with surrounding spaces', () => {
    expect(firstNameOf('  Aiman Sabir  ')).toBe('Aiman');
  });
});

describe('timeOfDay and greetingFor', () => {
  const at = (hour: number): Date => new Date(2026, 0, 1, hour, 0, 0);

  it('splits the day into four', () => {
    expect(timeOfDay(at(0))).toBe('morning');
    expect(timeOfDay(at(11))).toBe('morning');
    expect(timeOfDay(at(12))).toBe('afternoon');
    expect(timeOfDay(at(16))).toBe('afternoon');
    expect(timeOfDay(at(17))).toBe('evening');
    expect(timeOfDay(at(20))).toBe('evening');
    expect(timeOfDay(at(21))).toBe('night');
    expect(timeOfDay(at(23))).toBe('night');
  });

  // Night still says good evening, saying good night to someone opening the
  // app would be odd
  it('greets by part of day', () => {
    expect(greetingFor('morning')).toBe('Good morning');
    expect(greetingFor('afternoon')).toBe('Good afternoon');
    expect(greetingFor('evening')).toBe('Good evening');
    expect(greetingFor('night')).toBe('Good evening');
  });
});

describe('formatUpdated', () => {
  it('says today with the time for something from today', () => {
    const now = new Date();
    expect(formatUpdated(now.toISOString())).toMatch(/^Today, /);
  });

  it('says yesterday for the day before', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatUpdated(yesterday.toISOString())).toMatch(/^Yesterday, /);
  });

  it('falls back to a date for anything older', () => {
    const older = new Date();
    older.setDate(older.getDate() - 10);
    const result = formatUpdated(older.toISOString());
    expect(result).not.toMatch(/^Today|^Yesterday/);
    expect(result).toContain(',');
  });

  it('returns nothing when the date makes no sense', () => {
    expect(formatUpdated('not a date')).toBe('');
  });
});
