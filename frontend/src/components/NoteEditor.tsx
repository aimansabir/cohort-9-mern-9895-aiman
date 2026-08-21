import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactElement } from 'react';

import type { Note } from '../types/note';
import RichTextEditor from './RichTextEditor';
import { countCharacters, countWords, plural } from '../utils/noteText';
import { CloseIcon, TrashIcon } from './icons';

interface NoteEditorProps {
  // null means this is a new note rather than an existing one
  note: Note | null;
  isSaving: boolean;
  error: string | null;
  onSave: (title: string, content: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function NoteEditor({
  note,
  isSaving,
  error,
  onSave,
  onDelete,
  onClose,
}: NoteEditorProps): ReactElement {
  const [title, setTitle] = useState(note ? note.title : '');
  const [content, setContent] = useState(note ? note.content : '');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
    titleRef.current?.focus();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSave(title.trim(), content);
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-label={note ? 'Edit note' : 'New note'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <header className="modal-head">
          <input
            ref={titleRef}
            className="modal-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Note title"
            aria-label="Note title"
            maxLength={255}
            required
          />

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close editor"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="modal-body">
          <RichTextEditor initialValue={note ? note.content : ''} onChange={setContent} />
          {error && <p className="error">{error}</p>}
        </div>

        <footer className="modal-foot">
          <span className="modal-meta">
            {plural(countWords(content), 'word')}
            <span aria-hidden="true"> &middot; </span>
            {plural(countCharacters(content), 'character')}
          </span>

          {note ? (
            isConfirmingDelete ? (
              <span className="modal-confirm">
                Delete this note?
                <button
                  type="button"
                  className="button button-secondary button-small"
                  onClick={() => setIsConfirmingDelete(false)}
                >
                  Keep
                </button>
                <button
                  type="button"
                  className="button button-small button-danger"
                  onClick={onDelete}
                >
                  Delete
                </button>
              </span>
            ) : (
              <button
                type="button"
                className="button-danger"
                onClick={() => setIsConfirmingDelete(true)}
              >
                <TrashIcon />
                Delete
              </button>
            )
          ) : (
            <span />
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="button button-small" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save note'}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}
