import type { ReactElement } from 'react';

import { useAuth } from '../hooks/useAuth';

export default function NotesPage(): ReactElement {
  const { user } = useAuth();

  return (
    <section>
      <h1>Your notes</h1>
      <p>Signed in as {user?.email}.</p>
      <p>The notes list and editor are added in the next phase.</p>
    </section>
  );
}
