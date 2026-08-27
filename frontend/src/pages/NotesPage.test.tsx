import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import NotesPage from './NotesPage';
import { useAuth } from '../hooks/useAuth';
import * as noteService from '../services/noteService';
import type { Note } from '../types/note';

jest.mock('../hooks/useAuth');
jest.mock('../services/noteService');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedNotes = noteService as jest.Mocked<typeof noteService>;

function aNote(over: Partial<Note>): Note {
  return {
    id: 1,
    title: 'A note',
    content: '<p>text</p>',
    isFavourite: false,
    label: '',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    ...over,
  };
}

function renderPage(): void {
  mockedUseAuth.mockReturnValue({
    user: { id: 1, name: 'Aiman', email: 'a@example.com', createdAt: '2026-01-01T00:00:00Z' },
    token: 'a-token',
    isLoading: false,
    login: async () => undefined,
    signup: async () => undefined,
    logout: async () => undefined,
  });

  render(<NotesPage />);
}

describe('NotesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // A category can be called anything, and "favourites" used to be the
  // sentinel the filter compared against
  describe('a category that happens to be called Favourites', () => {
    const starred = aNote({ id: 1, title: 'Starred note', isFavourite: true });
    const filed = aNote({ id: 2, title: 'Filed note', label: 'Favourites' });

    beforeEach(() => {
      mockedNotes.listNotes.mockResolvedValue([starred, filed]);
    });

    it('shows the notes filed under it, not the starred ones', async () => {
      renderPage();
      await screen.findByText('Filed note');

      fireEvent.click(screen.getByRole('button', { name: /Categories/ }));
      fireEvent.click(await screen.findByRole('menuitem', { name: /Favourites/ }));

      expect(screen.getByText('Filed note')).toBeInTheDocument();
      expect(screen.queryByText('Starred note')).not.toBeInTheDocument();
    });

    it('still has a separate Favourites filter for the starred ones', async () => {
      renderPage();
      await screen.findByText('Starred note');

      fireEvent.click(screen.getByRole('button', { name: /^Favourites/ }));

      expect(screen.getByText('Starred note')).toBeInTheDocument();
      expect(screen.queryByText('Filed note')).not.toBeInTheDocument();
    });
  });

  describe('starring', () => {
    // Both clicks used to read the same starting value and send the same
    // request, so two toggles left the note starred
    it('sends one request when the star is clicked twice quickly', async () => {
      mockedNotes.listNotes.mockResolvedValue([aNote({ id: 1, title: 'Groceries' })]);
      let settle: (note: Note) => void = () => undefined;
      mockedNotes.setNoteFlags.mockReturnValue(
        new Promise<Note>((resolve) => {
          settle = resolve;
        }),
      );

      renderPage();
      const star = await screen.findByLabelText('Star Groceries');

      fireEvent.click(star);
      fireEvent.click(star);

      expect(mockedNotes.setNoteFlags).toHaveBeenCalledTimes(1);
      settle(aNote({ id: 1, title: 'Groceries', isFavourite: true }));
    });

    it('turns the star off again once the first one has finished', async () => {
      mockedNotes.listNotes.mockResolvedValue([aNote({ id: 1, title: 'Groceries' })]);
      mockedNotes.setNoteFlags.mockResolvedValue(
        aNote({ id: 1, title: 'Groceries', isFavourite: true }),
      );

      renderPage();
      fireEvent.click(await screen.findByLabelText('Star Groceries'));

      expect(await screen.findByLabelText('Unstar Groceries')).not.toBeDisabled();
    });
  });

  describe('importing', () => {
    function pickFile(contents: string): void {
      const file = new File([contents], 'notes.json', { type: 'application/json' });
      // jsdom does not give a File a text method
      Object.defineProperty(file, 'text', { value: () => Promise.resolve(contents) });

      const input = document.querySelector('.side-file') as HTMLInputElement;
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      fireEvent.change(input);
    }

    const file = JSON.stringify({
      notes: [{ title: 'Imported one', content: '<p>hi</p>', label: 'Study' }],
    });

    it('puts the imported notes straight into the list', async () => {
      mockedNotes.listNotes.mockResolvedValue([]);
      mockedNotes.createNote.mockResolvedValue(aNote({ id: 9, title: 'Imported one' }));

      renderPage();
      await waitFor(() => expect(mockedNotes.listNotes).toHaveBeenCalled());
      pickFile(file);

      expect(await screen.findByText('Imported one')).toBeInTheDocument();
    });

    // The notes that came back are used directly, so there is no second
    // request whose failure could hide an import that actually worked
    it('does not read the whole list back afterwards', async () => {
      mockedNotes.listNotes.mockResolvedValue([]);
      mockedNotes.createNote.mockResolvedValue(aNote({ id: 9, title: 'Imported one' }));

      renderPage();
      await waitFor(() => expect(mockedNotes.listNotes).toHaveBeenCalledTimes(1));
      pickFile(file);

      await screen.findByText('Imported one');
      expect(mockedNotes.listNotes).toHaveBeenCalledTimes(1);
    });

    it('says how many came in', async () => {
      mockedNotes.listNotes.mockResolvedValue([]);
      mockedNotes.createNote.mockResolvedValue(aNote({ id: 9, title: 'Imported one' }));

      renderPage();
      await waitFor(() => expect(mockedNotes.listNotes).toHaveBeenCalled());
      pickFile(file);

      expect(await screen.findByText('Imported 1 note')).toBeInTheDocument();
    });

    it('reports the ones the server turned down', async () => {
      mockedNotes.listNotes.mockResolvedValue([]);
      mockedNotes.createNote.mockRejectedValue(new Error('nope'));

      renderPage();
      await waitFor(() => expect(mockedNotes.listNotes).toHaveBeenCalled());
      pickFile(file);

      expect(await screen.findByText(/could not be read/)).toBeInTheDocument();
    });
  });
});
