import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import NoteCard from '../components/NoteCard';
import NoteEditor from '../components/NoteEditor';
import { LogOutIcon, NoteIcon, PlusIcon } from '../components/icons';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/apiClient';
import * as noteService from '../services/noteService';
import type { Note } from '../types/note';
import { greetingFor, plural, sanitizeHtml } from '../utils/noteText';

function messageFor(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function newestFirst(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export default function NotesPage(): ReactElement {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    noteService
      .listNotes(token)
      .then((list) => {
        if (active) {
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
            <h1>
              {greetingFor(new Date())}
              {user ? `, ${user.name}` : ''}.
            </h1>
            <p className="notes-count">
              {isLoading
                ? 'Loading your notes...'
                : `You have ${plural(notes.length, 'note')}.`}
            </p>
          </header>

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

          <div className="notes-grid">
            {notes.map((note) => (
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
