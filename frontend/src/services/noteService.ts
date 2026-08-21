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
): Promise<Note> {
  const response = await apiRequest<{ note: Note }>('/api/notes', {
    method: 'POST',
    body: { title, content },
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
): Promise<Note> {
  const response = await apiRequest<{ note: Note }>(`/api/notes/${id}`, {
    method: 'PUT',
    body: { title, content },
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
