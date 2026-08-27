import type { ReactElement } from 'react';

import {
  ArchiveIcon,
  CheckIcon,
  GearIcon,
  NoteIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  TrashIcon,
} from './icons';

const sampleNotes = [
  {
    title: 'Daily journal',
    lines: ['Shipped the auth screens', 'Fixed the token refresh'],
    time: '10:30 AM',
    starred: true,
  },
  {
    title: 'Project ideas',
    lines: ['Habit tracker', 'Reading list', 'Recipe box'],
    time: 'Yesterday',
    starred: false,
  },
  {
    title: 'Books to read',
    lines: ['Atomic Habits', 'Deep Work'],
    time: '2 days ago',
    starred: false,
  },
];

const mainLinks = [
  { icon: <NoteIcon />, label: 'All notes', active: true },
  { icon: <StarIcon />, label: 'Favourites', active: false },
  { icon: <CheckIcon />, label: 'Tasks', active: false },
  { icon: <ArchiveIcon />, label: 'Archive', active: false },
];

const lowerLinks = [
  { icon: <GearIcon />, label: 'Settings' },
  { icon: <TrashIcon />, label: 'Trash' },
];

// A still picture of a notes screen, used only as landing page artwork.
export default function NotePreview(): ReactElement {
  return (
    <div className="preview-wrap" aria-hidden="true">
      <span className="deco-blob" />
      <span className="deco-dots" />
      <span className="deco-lines" />

      <div className="preview">
        <div className="preview-bar">
          <span className="dot dot-red" />
          <span className="dot dot-amber" />
          <span className="dot dot-green" />
        </div>

        <div className="preview-body">
          <div className="preview-side">
            <span className="preview-new">
              <PlusIcon />
              New note
            </span>

            {mainLinks.map((link) => (
              <span
                key={link.label}
                className={link.active ? 'preview-link is-active' : 'preview-link'}
              >
                {link.icon}
                {link.label}
              </span>
            ))}

            <span className="preview-divider" />

            {lowerLinks.map((link) => (
              <span key={link.label} className="preview-link">
                {link.icon}
                {link.label}
              </span>
            ))}
          </div>

          <div className="preview-list">
            <h3>All notes</h3>

            <div className="preview-search">
              <SearchIcon />
              Search notes
            </div>

            {sampleNotes.map((note) => (
              <article key={note.title} className="preview-note">
                <header>
                  <strong>{note.title}</strong>
                  {note.starred && (
                    <span className="preview-star">
                      <StarIcon />
                    </span>
                  )}
                </header>
                <ul>
                  {note.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <span className="preview-time">{note.time}</span>
              </article>
            ))}
          </div>
        </div>
      </div>

      <span className="preview-badge">
        <PencilIcon />
      </span>
    </div>
  );
}
