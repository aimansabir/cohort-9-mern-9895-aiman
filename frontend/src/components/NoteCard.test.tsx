import { fireEvent, render, screen } from '@testing-library/react';

import NoteCard from './NoteCard';
import type { Note } from '../types/note';

const note: Note = {
  id: 1,
  title: 'Groceries',
  content: '<p>Milk and <strong>bread</strong></p>',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function renderCard(overrides: Partial<Note> = {}) {
  const onOpen = jest.fn();
  const onDelete = jest.fn();

  render(<NoteCard note={{ ...note, ...overrides }} onOpen={onOpen} onDelete={onDelete} />);
  return { onOpen, onDelete };
}

describe('NoteCard', () => {
  it('shows the title', () => {
    renderCard();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  // The preview reads the text, not the markup, so no tags show up
  it('previews the content without its tags', () => {
    renderCard();
    expect(screen.getByText('Milk and bread')).toBeInTheDocument();
  });

  it('says so when a note has no content', () => {
    renderCard({ content: '' });
    expect(screen.getByText('This note is empty')).toBeInTheDocument();
  });

  it('shows when it was last updated', () => {
    renderCard();
    expect(screen.getByText(/^Today, /)).toBeInTheDocument();
  });

  it('opens the note when the card is clicked', () => {
    const { onOpen } = renderCard();
    fireEvent.click(screen.getByText('Groceries'));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  // A single click must never destroy a note
  describe('deleting', () => {
    it('asks first instead of deleting straight away', () => {
      const { onDelete } = renderCard();
      fireEvent.click(screen.getByLabelText('Delete Groceries'));

      expect(screen.getByText('Delete this note?')).toBeInTheDocument();
      expect(onDelete).not.toHaveBeenCalled();
    });

    it('backs out on Keep', () => {
      const { onDelete } = renderCard();
      fireEvent.click(screen.getByLabelText('Delete Groceries'));
      fireEvent.click(screen.getByText('Keep'));

      expect(screen.queryByText('Delete this note?')).not.toBeInTheDocument();
      expect(onDelete).not.toHaveBeenCalled();
    });

    it('deletes once it has been confirmed', () => {
      const { onDelete } = renderCard();
      fireEvent.click(screen.getByLabelText('Delete Groceries'));
      fireEvent.click(screen.getByText('Delete'));

      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    // Screen readers announce the label, so it has to say which note
    it('names the note in the delete label', () => {
      renderCard({ title: 'Books to read' });
      expect(screen.getByLabelText('Delete Books to read')).toBeInTheDocument();
    });
  });
});
