import type { Note } from '../types/note';
import {
  EXPORT_FORMAT,
  buildExportFile,
  downloadFile,
  exportFileName,
  noteFileName,
  parseImportFile,
} from './noteTransfer';

const aNote: Note = {
  id: 1,
  title: 'Groceries',
  content: '<p>Milk</p>',
  isFavourite: false,
  label: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

describe('buildExportFile', () => {
  it('writes a file that says what it is', () => {
    const parsed = JSON.parse(buildExportFile([aNote])) as Record<string, unknown>;

    expect(parsed['format']).toBe(EXPORT_FORMAT);
    expect(parsed['version']).toBe(1);
  });

  it('keeps the title, content and dates', () => {
    const parsed = JSON.parse(buildExportFile([aNote])) as { notes: Record<string, unknown>[] };

    expect(parsed.notes[0]).toEqual({
      title: 'Groceries',
      content: '<p>Milk</p>',
      label: '',
      isFavourite: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });
  });

  it('copes with having nothing to export', () => {
    const parsed = JSON.parse(buildExportFile([])) as { notes: unknown[] };
    expect(parsed.notes).toEqual([]);
  });
});

describe('exportFileName', () => {
  it('is dated so two exports do not look the same', () => {
    expect(exportFileName(new Date('2026-08-24T10:00:00Z'))).toBe('notes-2026-08-24.json');
  });
});

describe('noteFileName', () => {
  const day = new Date('2026-08-24T10:00:00Z');

  it('names the file after the note', () => {
    expect(noteFileName('Groceries', day)).toBe('groceries-2026-08-24.json');
  });

  it('turns spaces and punctuation into dashes', () => {
    expect(noteFileName('Books to read: 2026!', day)).toBe('books-to-read-2026-2026-08-24.json');
  });

  it('does not leave a dash hanging on either end', () => {
    expect(noteFileName('  Hello  ', day)).toBe('hello-2026-08-24.json');
  });

  // A title can be nothing but punctuation, which would leave no name at all
  it('falls back to a plain name when nothing usable is left', () => {
    expect(noteFileName('!!!', day)).toBe('note-2026-08-24.json');
  });

  it('keeps a long title from becoming the whole file name', () => {
    expect(noteFileName('a'.repeat(200), day)).toBe(`${'a'.repeat(40)}-2026-08-24.json`);
  });
});

describe('exporting a single note', () => {
  // One exported note has to import the same way a whole export does
  it('can be read back like any other export', () => {
    const result = parseImportFile(buildExportFile([aNote]));

    expect(result.notes).toEqual([
      { title: 'Groceries', content: '<p>Milk</p>', label: '', isFavourite: false },
    ]);
    expect(result.skipped).toBe(0);
  });
});

describe('parseImportFile', () => {
  const fileWith = (notes: unknown[]): string => JSON.stringify({ notes });

  it('reads back what was exported', () => {
    const result = parseImportFile(buildExportFile([aNote]));

    expect(result.notes).toHaveLength(1);
    expect(result.notes[0]?.title).toBe('Groceries');
  });

  // The server uses a strict schema and rejects any key it did not ask for,
  // so an exported note cannot be posted back untouched.
  it('drops the id and the dates, keeping only what the server accepts', () => {
    const result = parseImportFile(buildExportFile([aNote]));

    expect(Object.keys(result.notes[0] ?? {}).sort()).toEqual([
      'content',
      'isFavourite',
      'label',
      'title',
    ]);
  });

  it('cleans markup that came from the file', () => {
    const result = parseImportFile(
      fileWith([{ title: 'Bad', content: '<p>hi</p><script>alert(1)</script>' }]),
    );

    expect(result.notes[0]?.content).toBe('<p>hi</p>');
  });

  it('strips an event handler hidden in the file', () => {
    const result = parseImportFile(fileWith([{ title: 'Bad', content: '<img src=x onerror=go()>' }]));
    expect(result.notes[0]?.content).toBe('');
  });

  it('trims the title', () => {
    const result = parseImportFile(fileWith([{ title: '  Spaced  ', content: '' }]));
    expect(result.notes[0]?.title).toBe('Spaced');
  });

  it('treats missing content as empty rather than failing', () => {
    const result = parseImportFile(fileWith([{ title: 'No body' }]));
    expect(result.notes[0]?.content).toBe('');
  });

  // One bad entry should not lose the whole file
  describe('skipping entries the server would reject', () => {
    it('skips an entry with no title', () => {
      const result = parseImportFile(fileWith([{ title: '', content: 'x' }, { title: 'Fine' }]));

      expect(result.notes).toHaveLength(1);
      expect(result.skipped).toBe(1);
    });

    it('skips a title that is only whitespace', () => {
      expect(parseImportFile(fileWith([{ title: '   ' }])).skipped).toBe(1);
    });

    it('skips a title over 255 characters', () => {
      expect(parseImportFile(fileWith([{ title: 'a'.repeat(256) }])).skipped).toBe(1);
    });

    it('skips an entry that is not an object', () => {
      expect(parseImportFile(fileWith(['just a string', null])).skipped).toBe(2);
    });
  });

  describe('when the file is wrong', () => {
    it('says so when it is not JSON', () => {
      expect(() => parseImportFile('not json at all')).toThrow(/not valid JSON/);
    });

    it('says so when there is no notes array', () => {
      expect(() => parseImportFile('{"something": "else"}')).toThrow(/does not look like/);
    });

    it('says so when notes is not an array', () => {
      expect(() => parseImportFile('{"notes": "nope"}')).toThrow(/does not look like/);
    });
  });
});

// jsdom has no real download, so this checks the link that gets handed to the
// browser rather than the file that comes out the other side.
describe('downloadFile', () => {
  it('gives the browser a named file to save, then releases it', () => {
    const createObjectURL = jest.fn(() => 'blob:a-fake-url');
    const revokeObjectURL = jest.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });

    const link = document.createElement('a');
    link.click = jest.fn();
    const createElement = jest.spyOn(document, 'createElement').mockReturnValue(link);

    downloadFile('notes-2026-08-24.json', '{"notes":[]}');

    expect(link.download).toBe('notes-2026-08-24.json');
    expect(link.href).toBe('blob:a-fake-url');
    expect(link.click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:a-fake-url');

    createElement.mockRestore();
  });

  it('saves it as JSON', () => {
    const saved: Blob[] = [];
    Object.assign(URL, {
      createObjectURL: jest.fn((blob: Blob) => {
        saved.push(blob);
        return 'blob:a-fake-url';
      }),
      revokeObjectURL: jest.fn(),
    });

    const link = document.createElement('a');
    link.click = jest.fn();
    const createElement = jest.spyOn(document, 'createElement').mockReturnValue(link);

    downloadFile('notes.json', '{"notes":[]}');

    expect(saved[0]?.type).toBe('application/json');

    createElement.mockRestore();
  });
});

describe('carrying categories and stars through a backup', () => {
  const starred: Note = { ...aNote, label: 'study', isFavourite: true };

  it('keeps the category and the star in the file', () => {
    const parsed = JSON.parse(buildExportFile([starred])) as {
      notes: Record<string, unknown>[];
    };

    expect(parsed.notes[0]?.['label']).toBe('study');
    expect(parsed.notes[0]?.['isFavourite']).toBe(true);
  });

  it('reads them back on import', () => {
    const result = parseImportFile(buildExportFile([starred]));

    expect(result.notes[0]?.label).toBe('study');
    expect(result.notes[0]?.isFavourite).toBe(true);
  });

  // Any name is a valid category now, so a made up one is kept
  it('keeps a category the file made up', () => {
    const file = JSON.stringify({ notes: [{ title: 'A', label: 'Exam revision' }] });
    expect(parseImportFile(file).notes[0]?.label).toBe('Exam revision');
  });

  // The server would turn these down, so they are dropped before it is asked
  it('drops a category the server would refuse', () => {
    const tooLong = JSON.stringify({ notes: [{ title: 'A', label: 'a'.repeat(21) }] });
    expect(parseImportFile(tooLong).notes[0]?.label).toBe('');

    const punctuation = JSON.stringify({ notes: [{ title: 'A', label: '<script>' }] });
    expect(parseImportFile(punctuation).notes[0]?.label).toBe('');
  });

  it('treats a missing star as not starred', () => {
    const file = JSON.stringify({ notes: [{ title: 'A' }] });
    expect(parseImportFile(file).notes[0]?.isFavourite).toBe(false);
  });

  it('does not take a star that is not a real boolean', () => {
    const file = JSON.stringify({ notes: [{ title: 'A', isFavourite: 'yes' }] });
    expect(parseImportFile(file).notes[0]?.isFavourite).toBe(false);
  });
});
