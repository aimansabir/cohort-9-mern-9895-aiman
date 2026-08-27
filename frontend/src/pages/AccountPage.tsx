import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';

import { useAuth } from '../hooks/useAuth';
import * as noteService from '../services/noteService';
import type { Note } from '../types/note';
import { countWords, firstNameOf, formatJoined, formatUpdated } from '../utils/noteText';

// The counts are worked out from the notes themselves, so an unfinished or
// failed request must not quietly show a confident zero.
const UNKNOWN = '—';

export default function AccountPage(): ReactElement {
  const { user, token } = useAuth();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    noteService
      .listNotes(token)
      .then((list) => {
        if (active) {
          setNotes(list);
        }
      })
      .catch(() => {
        if (active) {
          setHasFailed(true);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  // ProtectedRoute keeps this page behind a signed in user
  if (!user) {
    return <p>Loading...</p>;
  }

  const noteCount = notes ? String(notes.length) : UNKNOWN;
  const wordCount = notes
    ? String(notes.reduce((total, note) => total + countWords(note.content), 0))
    : UNKNOWN;

  const newest = notes?.map((note) => note.updatedAt).sort().at(-1);
  const lastWritten = newest ? formatUpdated(newest) : UNKNOWN;

  return (
    <section className="account">
      <header className="account-head">
        <span className="account-avatar">
          {firstNameOf(user.name).slice(0, 1).toUpperCase()}
        </span>

        <div>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
      </header>

      {hasFailed && <p className="form-error">Could not load your notes just now</p>}

      <dl className="account-stats">
        <div>
          <dt>Notes</dt>
          <dd>{noteCount}</dd>
        </div>
        <div>
          <dt>Words written</dt>
          <dd>{wordCount}</dd>
        </div>
        <div>
          <dt>Last written</dt>
          <dd>{lastWritten}</dd>
        </div>
        <div>
          <dt>Member since</dt>
          <dd>{formatJoined(user.createdAt)}</dd>
        </div>
      </dl>
    </section>
  );
}
