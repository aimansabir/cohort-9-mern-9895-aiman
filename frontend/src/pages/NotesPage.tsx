import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import NoteCard from '../components/NoteCard';
import NoteEditor from '../components/NoteEditor';
import GreetingIcon from '../components/GreetingIcon';
import HeaderScene from '../components/HeaderScene';
import {
  CalendarIcon,
  ClockIcon,
  LogOutIcon,
  NoteIcon,
  PlusIcon,
  SearchIcon,
  SortAzIcon,
} from '../components/icons';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/apiClient';
import * as noteService from '../services/noteService';
import type { Note } from '../types/note';
import {
  firstNameOf,
  greetingFor,
  plural,
  sanitizeHtml,
  timeOfDay,
  toPlainText,
} from '../utils/noteText';

function messageFor(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

type SortOrder = 'updated' | 'created' | 'title';

function newestFirst(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function sortNotes(notes: Note[], order: SortOrder): Note[] {
  const sorted = [...notes];

  if (order === 'title') {
    return sorted.sort((a, b) => a.title.localeCompare(b.title));
  }
  if (order === 'created') {
    return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

const sortOptions: { value: SortOrder; label: string; icon: ReactElement }[] = [
  { value: 'updated', label: 'Updated', icon: <ClockIcon /> },
  { value: 'created', label: 'Created', icon: <CalendarIcon /> },
  { value: 'title', label: 'Title', icon: <SortAzIcon /> },
];

// The list endpoint returns every note the user owns, so searching is done
// here rather than asking the server for it.
function matchesQuery(note: Note, term: string): boolean {
  return (
    note.title.toLowerCase().includes(term) ||
    toPlainText(note.content).toLowerCase().includes(term)
  );
}

export default function NotesPage(): ReactElement {
  const { user, token, logout } = useAuth();
  const time = timeOfDay(new Date());
  const navigate = useNavigate();

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // The list request is still in flight while New note already works, so a
  // note added in that window must not be replaced by the older response.
  const hasLocalChanges = useRef(false);

  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('updated');

  const visibleNotes = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matched = term ? notes.filter((note) => matchesQuery(note, term)) : notes;
    return sortNotes(matched, sortOrder);
  }, [notes, query, sortOrder]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    noteService
      .listNotes(token)
      .then((list) => {
        if (active && !hasLocalChanges.current) {
          setNotes(newestFirst(list));
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setListError(messageFor(error, 'Could not load your notes'));
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  async function handleLogout(): Promise<void> {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  }

  function openNew(): void {
    setEditingNote(null);
    setSaveError(null);
    setIsEditorOpen(true);
  }

  function openExisting(note: Note): void {
    setEditingNote(note);
    setSaveError(null);
    setIsEditorOpen(true);
  }

  async function handleSave(title: string, content: string): Promise<void> {
    if (!token) {
      return;
    }

    hasLocalChanges.current = true;
    setIsSaving(true);
    setSaveError(null);

    // clean the markup here as well, so nothing unexpected reaches the database
    const cleaned = sanitizeHtml(content);

    try {
      if (editingNote) {
        const updated = await noteService.updateNote(token, editingNote.id, title, cleaned);
        setNotes((current) =>
          newestFirst(current.map((note) => (note.id === updated.id ? updated : note))),
        );
      } else {
        const created = await noteService.createNote(token, title, cleaned);
        setNotes((current) => newestFirst([created, ...current]));
      }
      setIsEditorOpen(false);
    } catch (error) {
      setSaveError(messageFor(error, 'Could not save the note'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: number): Promise<void> {
    if (!token) {
      return;
    }

    hasLocalChanges.current = true;

    try {
      await noteService.deleteNote(token, id);
      setNotes((current) => current.filter((note) => note.id !== id));
      if (editingNote?.id === id) {
        setIsEditorOpen(false);
      }
    } catch (error) {
      setListError(messageFor(error, 'Could not delete the note'));
    }
  }

  return (
    <section className="notes">
      <div className="notes-layout">
        <aside className="notes-side">
          <button type="button" className="button side-new" onClick={openNew}>
            <PlusIcon />
            New note
          </button>

          <nav className="side-nav">
            <span className="side-link is-active">
              <NoteIcon />
              All notes
              <span className="side-count">{notes.length}</span>
            </span>
          </nav>

          <button type="button" className="side-logout" onClick={() => void handleLogout()}>
            <LogOutIcon />
            Log out
          </button>
        </aside>

        <div className="notes-main">
          <header className="notes-head">
            <HeaderScene time={time} />

            <h1>
              <GreetingIcon time={time} />
              {greetingFor(time)}
              {user ? `, ${firstNameOf(user.name)}` : ''}.
            </h1>
            <p className="notes-count">
              {isLoading
                ? 'Loading your notes...'
                : query.trim()
                  ? `${visibleNotes.length} of ${plural(notes.length, 'note')} match.`
                  : `You have ${plural(notes.length, 'note')}.`}
            </p>
          </header>

          {!isLoading && notes.length > 0 && (
            <div className="notes-tools">
              <div className="notes-search">
                <SearchIcon />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search notes"
                  aria-label="Search notes"
                />
              </div>

              <span className="notes-sort-label" id="sort-label">
                Sort by
              </span>

              <div className="notes-sort" role="group" aria-labelledby="sort-label">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={sortOrder === option.value ? 'is-active' : undefined}
                    aria-pressed={sortOrder === option.value}
                    onClick={() => setSortOrder(option.value)}
                  >
                    {option.icon}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {listError && <p className="error">{listError}</p>}

          {!isLoading && notes.length === 0 && !listError && (
            <div className="notes-empty">
              <h2>No notes yet</h2>
              <p>
                Everything you write will show up here.
                <br />
                Start with your first one.
              </p>
              <button type="button" className="button" onClick={openNew}>
                <PlusIcon />
                Write your first note
              </button>
            </div>
          )}

          {!isLoading && notes.length > 0 && visibleNotes.length === 0 && (
            <div className="notes-empty">
              <h2>No matches</h2>
              <p>Nothing here mentions &ldquo;{query.trim()}&rdquo;.</p>
              <button type="button" className="button" onClick={() => setQuery('')}>
                Clear search
              </button>
            </div>
          )}

          <div className="notes-grid">
            {visibleNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onOpen={() => openExisting(note)}
                onDelete={() => void handleDelete(note.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {isEditorOpen && (
        <NoteEditor
          key={editingNote ? editingNote.id : 'new'}
          note={editingNote}
          isSaving={isSaving}
          error={saveError}
          onSave={(title, content) => void handleSave(title, content)}
          onDelete={() => editingNote && void handleDelete(editingNote.id)}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
    </section>
  );
}
