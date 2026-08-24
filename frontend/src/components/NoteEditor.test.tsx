import { fireEvent, render, screen } from '@testing-library/react';

import NoteEditor from './NoteEditor';
import type { Note } from '../types/note';

// jsdom does not implement the modal dialog, so it is stood in for here. The
// editor only needs it to open and to raise close.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(): void {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(): void {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
});

const existing: Note = {
  id: 1,
  title: 'Groceries',
  content: '<p>Milk</p>',
  isFavourite: true,
  label: 'Personal',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

function renderEditor(note: Note | null) {
  const onSave = jest.fn();
  const onClose = jest.fn();
  const onDelete = jest.fn();

  render(
    <NoteEditor
      note={note}
      isSaving={false}
      error={null}
      onSave={onSave}
      onClose={onClose}
      onDelete={onDelete}
    />,
  );

  return { onSave, onClose, onDelete };
}

describe('NoteEditor', () => {
  describe('templates', () => {
    it('offers them on a new note', () => {
      renderEditor(null);
      expect(screen.getByText('Lecture notes')).toBeInTheDocument();
    });

    // Applying one replaces what is there, so it must not be reachable from a
    // note that already has writing in it
    it('does not offer them when editing an existing note', () => {
      renderEditor(existing);
      expect(screen.queryByText('Lecture notes')).not.toBeInTheDocument();
    });

    it('fills in the title when one is picked', () => {
      renderEditor(null);
      fireEvent.click(screen.getByText('Lecture notes'));

      expect(screen.getByLabelText('Note title')).toHaveValue('Lecture: ');
    });

    it('marks the picked one as chosen', () => {
      renderEditor(null);
      fireEvent.click(screen.getByText('To do list'));

      expect(screen.getByText('To do list')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('Blank')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('categories', () => {
    it('starts on the category the note already has', () => {
      renderEditor(existing);
      expect(screen.getByText('Personal')).toHaveAttribute('aria-pressed', 'true');
    });

    it('starts on none for a new note', () => {
      renderEditor(null);
      expect(screen.getByText('None')).toHaveAttribute('aria-pressed', 'true');
    });

    it('reports the category with the note when it is saved', () => {
      const { onSave } = renderEditor(existing);
      fireEvent.click(screen.getByText('Work'));
      fireEvent.click(screen.getByRole('button', { name: 'Save note' }));

      expect(onSave).toHaveBeenCalledWith('Groceries', '<p>Milk</p>', 'Work');
    });
  });

  describe('adding a category of your own', () => {
    it('offers the option', () => {
      renderEditor(null);
      expect(screen.getByText('+ New')).toBeInTheDocument();
    });

    it('asks for a name when it is chosen', () => {
      renderEditor(null);
      fireEvent.click(screen.getByText('+ New'));

      expect(screen.getByLabelText('New category name')).toBeInTheDocument();
    });

    it('files the note under the new name', () => {
      const { onSave } = renderEditor(null);

      fireEvent.click(screen.getByText('+ New'));
      fireEvent.change(screen.getByLabelText('New category name'), {
        target: { value: 'Exam revision' },
      });
      fireEvent.click(screen.getByText('Add'));

      fireEvent.change(screen.getByLabelText('Note title'), { target: { value: 'A' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save note' }));

      expect(onSave).toHaveBeenCalledWith('A', '', 'Exam revision');
    });

    it('will not add a name the server would refuse', () => {
      renderEditor(null);
      fireEvent.click(screen.getByText('+ New'));
      fireEvent.change(screen.getByLabelText('New category name'), {
        target: { value: 'a/b' },
      });

      expect(screen.getByText('Add')).toBeDisabled();
    });

    it('will not add an empty name', () => {
      renderEditor(null);
      fireEvent.click(screen.getByText('+ New'));

      expect(screen.getByText('Add')).toBeDisabled();
    });

    // Enter inside the editor would otherwise save the note instead
    it('adds on Enter without saving the note', () => {
      const { onSave } = renderEditor(null);

      fireEvent.click(screen.getByText('+ New'));
      const input = screen.getByLabelText('New category name');
      fireEvent.change(input, { target: { value: 'Thesis' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByText('Thesis')).toHaveAttribute('aria-pressed', 'true');
    });

    // Otherwise opening an old note would quietly lose the name it was under
    it('offers a category the note already carries', () => {
      renderEditor({ ...existing, label: 'Exam revision' });
      expect(screen.getByText('Exam revision')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('focus mode', () => {
    it('is off to begin with', () => {
      renderEditor(null);
      expect(screen.getByLabelText('Focus mode')).toHaveAttribute('aria-pressed', 'false');
    });

    it('turns on when asked', () => {
      renderEditor(null);
      fireEvent.click(screen.getByLabelText('Focus mode'));

      expect(screen.getByLabelText('Leave focus mode')).toHaveAttribute('aria-pressed', 'true');
    });

    // The chips are chrome, and the point of focus mode is that the chrome
    // goes away
    it('puts the template and category chips away', () => {
      renderEditor(null);
      expect(screen.getByText('Lecture notes')).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Focus mode'));

      expect(document.querySelector('.modal')).toHaveClass('is-focus');
    });

    it('comes back out again', () => {
      renderEditor(null);
      fireEvent.click(screen.getByLabelText('Focus mode'));
      fireEvent.click(screen.getByLabelText('Leave focus mode'));

      expect(document.querySelector('.modal')).not.toHaveClass('is-focus');
    });
  });

  describe('saving', () => {
    it('trims the title', () => {
      const { onSave } = renderEditor(null);

      fireEvent.change(screen.getByLabelText('Note title'), {
        target: { value: '  Spaced  ' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Save note' }));

      expect(onSave).toHaveBeenCalledWith('Spaced', '', '');
    });
  });

  describe('deleting', () => {
    it('is offered on an existing note only', () => {
      renderEditor(existing);
      expect(screen.getByRole('button', { name: /Delete/ })).toBeInTheDocument();
    });

    it('is not offered on a new note', () => {
      renderEditor(null);
      expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument();
    });

    it('asks before deleting', () => {
      const { onDelete } = renderEditor(existing);
      fireEvent.click(screen.getByRole('button', { name: /Delete/ }));

      expect(screen.getByText('Delete this note?')).toBeInTheDocument();
      expect(onDelete).not.toHaveBeenCalled();
    });
  });
});
