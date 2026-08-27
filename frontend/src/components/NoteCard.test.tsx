import { fireEvent, render, screen } from '@testing-library/react';

import NoteCard from './NoteCard';
import type { Note } from '../types/note';

const note: Note = {
  id: 1,
  title: 'Groceries',
  content: '<p>Milk and <strong>bread</strong></p>',
  isFavourite: false,
  label: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function renderCard(overrides: Partial<Note> = {}): {
  onOpen: jest.Mock;
  onDelete: jest.Mock;
  onExport: jest.Mock;
  onToggleFavourite: jest.Mock;
} {
  const onOpen = jest.fn();
  const onDelete = jest.fn();
  const onExport = jest.fn();
  const onToggleFavourite = jest.fn();

  render(
    <NoteCard
      note={{ ...note, ...overrides }}
      onOpen={onOpen}
      onDelete={onDelete}
      onExport={onExport}
      onToggleFavourite={onToggleFavourite}
    />,
  );
  return { onOpen, onDelete, onExport, onToggleFavourite };
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

  describe('which date it shows', () => {
    it('shows when it was created while sorting by created', () => {
      render(
        <NoteCard
          note={{ ...note, createdAt: '2026-01-05T09:00:00.000Z' }}
          onOpen={jest.fn()}
          onDelete={jest.fn()}
          onExport={jest.fn()}
          onToggleFavourite={jest.fn()}
          showCreated
        />,
      );

      expect(screen.getByText(/^Created /)).toBeInTheDocument();
    });

    // Otherwise the two sort orders look the same on a note nobody has edited
    it('does not say created when sorting by updated', () => {
      renderCard();
      expect(screen.queryByText(/^Created /)).not.toBeInTheDocument();
    });
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

  describe('starring', () => {
    it('offers to star a note that is not starred', () => {
      renderCard({ isFavourite: false });
      expect(screen.getByLabelText('Star Groceries')).toBeInTheDocument();
    });

    it('offers to unstar one that is', () => {
      renderCard({ isFavourite: true });
      expect(screen.getByLabelText('Unstar Groceries')).toBeInTheDocument();
    });

    it('reports the star being turned on', () => {
      const { onToggleFavourite } = renderCard({ isFavourite: false });
      fireEvent.click(screen.getByLabelText('Star Groceries'));

      expect(onToggleFavourite).toHaveBeenCalledTimes(1);
    });

    // Screen readers read the pressed state, so it has to say which way it is
    it('says whether it is on', () => {
      renderCard({ isFavourite: true });
      expect(screen.getByLabelText('Unstar Groceries')).toHaveAttribute('aria-pressed', 'true');
    });

    it('does not open the note when the star is clicked', () => {
      const { onOpen } = renderCard({ isFavourite: false });
      fireEvent.click(screen.getByLabelText('Star Groceries'));

      expect(onOpen).not.toHaveBeenCalled();
    });
  });

  describe('its category', () => {
    it('names the category on the card', () => {
      renderCard({ label: 'Study' });
      expect(screen.getByText('Study')).toBeInTheDocument();
    });

    it('shows nothing when a note has no category', () => {
      renderCard({ label: '' });

      expect(screen.queryByText('Study')).not.toBeInTheDocument();
      expect(screen.queryByText('None')).not.toBeInTheDocument();
    });
  });

  describe('exporting one note', () => {
    it('offers a download on the card', () => {
      renderCard();
      expect(screen.getByLabelText('Export Groceries')).toBeInTheDocument();
    });

    it('exports when the download is clicked', () => {
      const { onExport } = renderCard();
      fireEvent.click(screen.getByLabelText('Export Groceries'));

      expect(onExport).toHaveBeenCalledTimes(1);
    });

    // The card opens on click, so a button sitting inside it must not do both
    it('does not open the note as well', () => {
      const { onOpen, onExport } = renderCard();
      fireEvent.click(screen.getByLabelText('Export Groceries'));

      expect(onExport).toHaveBeenCalledTimes(1);
      expect(onOpen).not.toHaveBeenCalled();
    });
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
