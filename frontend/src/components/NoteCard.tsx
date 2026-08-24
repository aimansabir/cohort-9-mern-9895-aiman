import { useState } from 'react';
import type { ReactElement } from 'react';

import type { Note } from '../types/note';
import { formatUpdated, toPlainText } from '../utils/noteText';
import { categoryColor } from '../utils/noteCategories';
import { ClockIcon, DownloadIcon, NoteIcon, StarIcon, TrashIcon } from './icons';

interface NoteCardProps {
  note: Note;
  onOpen: () => void;
  onDelete: () => void;
  onExport: () => void;
  onToggleFavourite: () => void;
  // Sorting by when a note was made should show that date, otherwise the two
  // orders look identical for any note that has never been edited.
  showCreated?: boolean;
}

export default function NoteCard({
  note,
  onOpen,
  onDelete,
  onExport,
  onToggleFavourite,
  showCreated = false,
}: NoteCardProps): ReactElement {
  const [isConfirming, setIsConfirming] = useState(false);
  const preview = toPlainText(note.content);

  return (
    <article
      className={`note-card${note.label ? ' has-label' : ''}`}
      style={note.label ? { borderLeftColor: categoryColor(note.label) } : undefined}
    >
      {note.label && (
        <span className="note-label" style={{ color: categoryColor(note.label) }}>
          {note.label}
        </span>
      )}

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
          {showCreated
            ? `Created ${formatUpdated(note.createdAt)}`
            : formatUpdated(note.updatedAt)}
        </span>

        <div className="note-actions">
          <button
            type="button"
            className={`icon-button note-star${note.isFavourite ? ' is-on' : ''}`}
            onClick={onToggleFavourite}
            aria-pressed={note.isFavourite}
            aria-label={
              note.isFavourite ? `Unstar ${note.title}` : `Star ${note.title}`
            }
          >
            <StarIcon filled={note.isFavourite} />
          </button>

          <button
            type="button"
            className="icon-button note-export"
            onClick={onExport}
            aria-label={`Export ${note.title}`}
          >
            <DownloadIcon />
          </button>

          <button
            type="button"
            className="icon-button note-trash"
            onClick={() => setIsConfirming(true)}
            aria-label={`Delete ${note.title}`}
          >
            <TrashIcon />
          </button>
        </div>
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
