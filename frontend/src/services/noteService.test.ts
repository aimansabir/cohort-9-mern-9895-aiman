import { createNote, deleteNote, listNotes, updateNote } from './noteService';
import type { Note } from '../types/note';

const aNote: Note = {
  id: 1,
  title: 'Groceries',
  content: '<p>milk</p>',
  isFavourite: false,
  label: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;

function lastCall(): { url: string; options: Record<string, unknown> } {
  const call = fetchMock.mock.calls.at(-1);
  return { url: String(call?.[0]), options: call?.[1] as Record<string, unknown> };
}

describe('noteService', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  describe('listNotes', () => {
    it('asks for the notes with the token', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: { notes: [aNote] } }));
      const notes = await listNotes('tok');

      expect(notes).toHaveLength(1);
      expect(lastCall().url).toContain('/api/notes');
      expect((lastCall().options.headers as Record<string, string>).Authorization).toBe(
        'Bearer tok',
      );
    });

    // A new account has no notes, and that is not an error
    it('gives back an empty list when there are none', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: { notes: [] } }));
      expect(await listNotes('tok')).toEqual([]);
    });

    it('gives back an empty list when the body has no data', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: true }));
      expect(await listNotes('tok')).toEqual([]);
    });
  });

  describe('createNote', () => {
    it('posts the title and content', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: { note: aNote } }, 201));
      await createNote('tok', 'Groceries', '<p>milk</p>');

      const { url, options } = lastCall();
      expect(url).toContain('/api/notes');
      expect(options.method).toBe('POST');
      expect(options.body).toBe(JSON.stringify({ title: 'Groceries', content: '<p>milk</p>' }));
    });

    // The user id comes from the token on the server, never from here
    it('sends nothing but the title and content', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: { note: aNote } }, 201));
      await createNote('tok', 'Groceries', '');

      expect(Object.keys(JSON.parse(String(lastCall().options.body)))).toEqual([
        'title',
        'content',
      ]);
    });

    it('returns the note the server made', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: { note: aNote } }, 201));
      expect((await createNote('tok', 'Groceries', '')).id).toBe(1);
    });

    it('complains if the server did not send the note back', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: true }, 201));
      await expect(createNote('tok', 'Groceries', '')).rejects.toThrow(
        /did not include the note/,
      );
    });
  });

  describe('updateNote', () => {
    it('puts to the note id', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: { note: aNote } }));
      await updateNote('tok', 7, 'New title', 'body');

      const { url, options } = lastCall();
      expect(url).toContain('/api/notes/7');
      expect(options.method).toBe('PUT');
    });
  });

  describe('deleteNote', () => {
    it('deletes by id', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: true }));
      await deleteNote('tok', 7);

      const { url, options } = lastCall();
      expect(url).toContain('/api/notes/7');
      expect(options.method).toBe('DELETE');
    });

    it('passes a failure on to the caller', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ message: 'Note not found' }, 404));
      await expect(deleteNote('tok', 7)).rejects.toMatchObject({ status: 404 });
    });
  });
});
