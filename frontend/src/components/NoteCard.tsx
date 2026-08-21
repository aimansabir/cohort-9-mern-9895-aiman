import { useState } from 'react';
import type { ReactElement } from 'react';

import type { Note } from '../types/note';
import { formatUpdated, toPlainText } from '../utils/noteText';
import { ClockIcon, NoteIcon, TrashIcon } from './icons';

interface NoteCardProps {
  note: Note;
  onOpen: () => void;
  onDelete: () => void;
}

export default function NoteCard({ note, onOpen, onDelete }: NoteCardProps): ReactElement {
  const [isConfirming, setIsConfirming] = useState(false);
  const preview = toPlainText(note.content);

  return (
    <article className="note-card">
      <button type="button" className="note-open" onClick={onOpen}>
        <span className="note-badge">
          <NoteIcon />
        </span>

        <h2>{note.title}</h2>
        <p>{preview || 'This note is empty'}</p>
      </button>

      <footer className="note-foot">
        <span className="note-time">
          <ClockIcon />
          {formatUpdated(note.updatedAt)}
        </span>

        <button
          type="button"
          className="icon-button note-trash"
          onClick={() => setIsConfirming(true)}
          aria-label={`Delete ${note.title}`}
        >
          <TrashIcon />
        </button>
      </footer>

      {isConfirming && (
        <div className="note-confirm">
          <p>Delete this note?</p>

          <div className="note-confirm-actions">
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={() => setIsConfirming(false)}
            >
              Keep
            </button>
            <button type="button" className="button button-small button-danger" onClick={onDelete}>
              Delete
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
