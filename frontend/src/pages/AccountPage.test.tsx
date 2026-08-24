import { render, screen, waitFor } from '@testing-library/react';

import AccountPage from './AccountPage';
import { useAuth } from '../hooks/useAuth';
import * as noteService from '../services/noteService';
import type { Note } from '../types/note';

jest.mock('../hooks/useAuth');
jest.mock('../services/noteService');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedNotes = noteService as jest.Mocked<typeof noteService>;

const aUser = {
  id: 1,
  name: 'Aiman Gul Sabir',
  email: 'aiman@example.com',
  createdAt: '2026-03-12T09:30:00.000Z',
};

const notes: Note[] = [
  {
    id: 1,
    title: 'One',
    content: '<p>three words here</p>',
    isFavourite: false,
    label: '',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 2,
    title: 'Two',
    content: '<p>two words</p>',
    isFavourite: false,
    label: '',
    createdAt: '2026-08-02T10:00:00.000Z',
    updatedAt: '2026-08-02T10:00:00.000Z',
  },
];

function renderPage(signedIn = true): void {
  mockedUseAuth.mockReturnValue({
    user: signedIn ? aUser : null,
    token: signedIn ? 'a-token' : null,
    isLoading: false,
    login: async () => undefined,
    signup: async () => undefined,
    logout: async () => undefined,
  });

  render(<AccountPage />);
}

describe('AccountPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNotes.listNotes.mockResolvedValue(notes);
  });

  it('shows who is signed in', async () => {
    renderPage();

    expect(await screen.findByText('Aiman Gul Sabir')).toBeInTheDocument();
    expect(screen.getByText('aiman@example.com')).toBeInTheDocument();
  });

  it('shows the join date as a full date', async () => {
    renderPage();
    expect(await screen.findByText(/March.*2026/)).toBeInTheDocument();
  });

  it('counts the notes', async () => {
    renderPage();

    const notesStat = await screen.findByText('Notes');
    expect(notesStat.parentElement).toHaveTextContent('2');
  });

  it('adds up the words across every note', async () => {
    renderPage();

    const wordStat = await screen.findByText('Words written');
    expect(wordStat.parentElement).toHaveTextContent('5');
  });

  it('shows when the most recent note was written', async () => {
    renderPage();

    const lastStat = await screen.findByText('Last written');
    await waitFor(() => expect(lastStat.parentElement).not.toHaveTextContent('—'));
  });

  // Showing a confident zero would be a lie about someone's own notes
  describe('when the notes cannot be counted', () => {
    it('shows a dash rather than a zero', async () => {
      mockedNotes.listNotes.mockRejectedValue(new Error('offline'));

      renderPage();

      const notesStat = await screen.findByText('Notes');
      await waitFor(() => expect(notesStat.parentElement).toHaveTextContent('—'));
      expect(notesStat.parentElement).not.toHaveTextContent('0');
    });

    it('says that it could not load them', async () => {
      mockedNotes.listNotes.mockRejectedValue(new Error('offline'));

      renderPage();

      expect(
        await screen.findByText('Could not load your notes just now'),
      ).toBeInTheDocument();
    });
  });

  it('does not ask for notes when nobody is signed in', () => {
    renderPage(false);
    expect(mockedNotes.listNotes).not.toHaveBeenCalled();
  });
});
