import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import NoteCard from '../components/NoteCard';
import NoteEditor from '../components/NoteEditor';
import GreetingIcon from '../components/GreetingIcon';
import HeaderScene from '../components/HeaderScene';
import {
  CalendarIcon,
  ChevronDownIcon,
  ClockIcon,
  DownloadIcon,
  LogOutIcon,
  NoteIcon,
  PlusIcon,
  SearchIcon,
  SortAzIcon,
  StarIcon,
  UploadIcon,
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
import { categoriesInUse, categoryColor, sameCategory } from '../utils/noteCategories';
import {
  buildExportFile,
  downloadFile,
  exportFileName,
  noteFileName,
  parseImportFile,
} from '../utils/noteTransfer';

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

  const [transferMessage, setTransferMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('updated');
  // '' is every note, 'favourites' is the starred ones, anything else is a
  // category id
  const [filter, setFilter] = useState('');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  // Categories live on the notes rather than in their own table, so the list
  // is whatever the notes are currently filed under.
  const categories = useMemo(
    () => categoriesInUse(notes.map((note) => note.label)),
    [notes],
  );

  const visibleNotes = useMemo(() => {
    const term = query.trim().toLowerCase();
    const searched = term ? notes.filter((note) => matchesQuery(note, term)) : notes;

    const matched = searched.filter((note) => {
      if (filter === '') {
        return true;
      }
      return filter === 'favourites' ? note.isFavourite : sameCategory(note.label, filter);
    });

    return sortNotes(matched, sortOrder);
  }, [notes, query, sortOrder, filter]);

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

  useEffect(() => {
    if (!isCategoryMenuOpen) {
      return;
    }

    function handleAway(event: MouseEvent): void {
      if (!categoryMenuRef.current?.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setIsCategoryMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleAway);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleAway);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isCategoryMenuOpen]);

  async function handleToggleFavourite(note: Note): Promise<void> {
    if (!token) {
      return;
    }

    try {
      const updated = await noteService.setNoteFlags(token, note.id, {
        isFavourite: !note.isFavourite,
      });
      hasLocalChanges.current = true;
      setNotes((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      setListError(messageFor(error, 'Could not change that note'));
    }
  }

  function exportOne(note: Note): void {
    downloadFile(noteFileName(note.title, new Date()), buildExportFile([note]));
    setTransferMessage(`Exported ${note.title}`);
  }

  function handleExportAll(): void {
    if (notes.length === 0) {
      setTransferMessage('There are no notes to export yet');
      return;
    }

    downloadFile(exportFileName(new Date()), buildExportFile(notes));
    setTransferMessage(`Exported ${plural(notes.length, 'note')}`);
  }

  async function handleImport(file: File): Promise<void> {
    if (!token) {
      return;
    }

    setIsImporting(true);
    setTransferMessage(null);

    try {
      const { notes: incoming, skipped } = parseImportFile(await file.text());

      if (incoming.length === 0) {
        setTransferMessage('There were no notes in that file');
        return;
      }

      // Each note is its own request, so one that the server turns down does
      // not lose the rest of the file.
      let added = 0;
      for (const item of incoming) {
        try {
          await noteService.createNote(token, item.title, item.content, {
            label: item.label,
            isFavourite: item.isFavourite,
          });
          added += 1;
        } catch {
          // counted as skipped below
        }
      }

      hasLocalChanges.current = true;
      setNotes(newestFirst(await noteService.listNotes(token)));

      const missed = incoming.length - added + skipped;
      setTransferMessage(
        missed === 0
          ? `Imported ${plural(added, 'note')}`
          : `Imported ${added} of ${incoming.length + skipped}, ${missed} could not be read`,
      );
    } catch (error) {
      setTransferMessage(messageFor(error, 'That file could not be read'));
    } finally {
      setIsImporting(false);
    }
  }

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

  async function handleSave(title: string, content: string, label: string): Promise<void> {
    if (!token) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    // clean the markup here as well, so nothing unexpected reaches the database
    const cleaned = sanitizeHtml(content);

    try {
      if (editingNote) {
        const updated = await noteService.updateNote(token, editingNote.id, title, cleaned, label);
        hasLocalChanges.current = true;
        setNotes((current) =>
          newestFirst(current.map((note) => (note.id === updated.id ? updated : note))),
        );
      } else {
        const created = await noteService.createNote(token, title, cleaned, { label });
        hasLocalChanges.current = true;
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

    try {
      await noteService.deleteNote(token, id);
      hasLocalChanges.current = true;
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
            <button
              type="button"
              className={`side-link${filter === '' ? ' is-active' : ''}`}
              onClick={() => setFilter('')}
            >
              <NoteIcon />
              All notes
              <span className="side-count">{notes.length}</span>
            </button>

            <button
              type="button"
              className={`side-link${filter === 'favourites' ? ' is-active' : ''}`}
              onClick={() => setFilter('favourites')}
            >
              <StarIcon filled={filter === 'favourites'} />
              Favourites
              <span className="side-count">
                {notes.filter((note) => note.isFavourite).length}
              </span>
            </button>
          </nav>

          <div className="side-dropdown" ref={categoryMenuRef}>
            <button
              type="button"
              className={`side-link${filter !== '' && filter !== 'favourites' ? ' is-active' : ''}`}
              aria-expanded={isCategoryMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
            >
              <span
                className="side-dot"
                style={{
                  backgroundColor:
                    filter !== '' && filter !== 'favourites'
                      ? categoryColor(filter)
                      : 'var(--border)',
                }}
              />
              {filter !== '' && filter !== 'favourites' ? filter : 'Categories'}
              <span className="side-caret">
                <ChevronDownIcon />
              </span>
            </button>

            {isCategoryMenuOpen && (
              <div className="side-menu" role="menu">
                {categories.length === 0 ? (
                  <p className="side-menu-empty">
                    No categories yet. Add one when you write a note.
                  </p>
                ) : (
                  categories.map((name) => (
                    <button
                      key={name}
                      type="button"
                      role="menuitem"
                      className={`side-menu-item${filter === name ? ' is-active' : ''}`}
                      onClick={() => {
                        setFilter(name);
                        setIsCategoryMenuOpen(false);
                      }}
                    >
                      <span
                        className="side-dot"
                        style={{ backgroundColor: categoryColor(name) }}
                      />
                      {name}
                      <span className="side-count">
                        {notes.filter((note) => sameCategory(note.label, name)).length}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="side-transfer">
            <span className="side-heading">Backup</span>

            <button type="button" className="side-action" onClick={handleExportAll}>
              <DownloadIcon />
              Export all
            </button>

            <button
              type="button"
              className="side-action"
              disabled={isImporting}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon />
              {isImporting ? 'Importing...' : 'Import'}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="side-file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                // clearing the value lets the same file be picked again
                event.target.value = '';
                if (file) {
                  void handleImport(file);
                }
              }}
            />

            {transferMessage && (
              <p className="side-note" role="status">
                {transferMessage}
              </p>
            )}
          </div>

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
                onExport={() => exportOne(note)}
                onToggleFavourite={() => void handleToggleFavourite(note)}
                showCreated={sortOrder === 'created'}
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
          onSave={(title, content, label) => void handleSave(title, content, label)}
          onDelete={() => editingNote && void handleDelete(editingNote.id)}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
    </section>
  );
}
