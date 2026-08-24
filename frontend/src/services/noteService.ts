import type { Note } from '../types/note';
import { apiRequest } from './apiClient';

export async function listNotes(token: string): Promise<Note[]> {
  const response = await apiRequest<{ notes: Note[] }>('/api/notes', { token });
  return response.data?.notes ?? [];
}

export async function createNote(
  token: string,
  title: string,
  content: string,
  // an imported note brings its own category and star, a new one does not
  extras: { label?: string; isFavourite?: boolean } = {},
): Promise<Note> {
  const response = await apiRequest<{ note: Note }>('/api/notes', {
    method: 'POST',
    body: { title, content, ...extras },
    token,
  });

  if (!response.data) {
    throw new Error('Create response did not include the note');
  }
  return response.data.note;
}

export async function updateNote(
  token: string,
  id: number,
  title: string,
  content: string,
  label?: string,
): Promise<Note> {
  const response = await apiRequest<{ note: Note }>(`/api/notes/${id}`, {
    method: 'PUT',
    // the star is left out on purpose, so saving an edit cannot change it
    body: label === undefined ? { title, content } : { title, content, label },
    token,
  });

  if (!response.data) {
    throw new Error('Update response did not include the note');
  }
  return response.data.note;
}

// Starring a note or recolouring it goes through PATCH rather than PUT, so
// the whole note does not have to be sent back to change one field.
export async function setNoteFlags(
  token: string,
  id: number,
  changes: { isFavourite?: boolean; label?: string },
): Promise<Note> {
  const response = await apiRequest<{ note: Note }>(`/api/notes/${id}`, {
    method: 'PATCH',
    body: changes,
    token,
  });

  if (!response.data) {
    throw new Error('Update response did not include the note');
  }
  return response.data.note;
}

export async function deleteNote(token: string, id: number): Promise<void> {
  await apiRequest(`/api/notes/${id}`, { method: 'DELETE', token });
}
