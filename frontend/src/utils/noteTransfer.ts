import type { Note } from '../types/note';
import { isValidCategory } from './noteCategories';
import { sanitizeHtml } from './noteText';

export const EXPORT_FORMAT = 'notes-app-export';
const EXPORT_VERSION = 1;

export interface ImportedNote {
  title: string;
  content: string;
  label: string;
  isFavourite: boolean;
}

export interface ImportResult {
  notes: ImportedNote[];
  skipped: number;
}

const MAX_TITLE_LENGTH = 255;

export function buildExportFile(notes: Note[]): string {
  return JSON.stringify(
    {
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      notes: notes.map((note) => ({
        title: note.title,
        content: note.content,
        label: note.label,
        isFavourite: note.isFavourite,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      })),
    },
    null,
    2,
  );
}

export function exportFileName(now: Date): string {
  const stamp = now.toISOString().slice(0, 10);
  return `notes-${stamp}.json`;
}

// Titles can hold anything, so only letters and numbers are kept and the rest
// becomes a dash. A title of only punctuation would leave nothing behind.
export function noteFileName(title: string, now: Date): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  const stamp = now.toISOString().slice(0, 10);
  return `${slug || 'note'}-${stamp}.json`;
}

// The file comes from outside the app, so nothing in it is trusted. Dates and
// ids are dropped because the server sets its own, and it rejects a body with
// any key it did not ask for.
export function parseImportFile(text: string): ImportResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON');
  }

  const rawNotes = (parsed as { notes?: unknown } | null)?.notes;
  if (!Array.isArray(rawNotes)) {
    throw new Error('That file does not look like a notes export');
  }

  const notes: ImportedNote[] = [];
  let skipped = 0;

  for (const entry of rawNotes) {
    const item = entry as {
      title?: unknown;
      content?: unknown;
      label?: unknown;
      isFavourite?: unknown;
    } | null;
    const title = typeof item?.title === 'string' ? item.title.trim() : '';

    if (title.length === 0 || title.length > MAX_TITLE_LENGTH) {
      skipped += 1;
      continue;
    }

    // The file is untrusted, so a category is dropped unless it looks like
    // one the server would accept.
    const raw = typeof item?.label === 'string' ? item.label.trim() : '';
    const label = isValidCategory(raw) ? raw : '';

    notes.push({
      title,
      content: sanitizeHtml(typeof item?.content === 'string' ? item.content : ''),
      label,
      isFavourite: item?.isFavourite === true,
    });
  }

  return { notes, skipped };
}

export function downloadFile(name: string, contents: string): void {
  const blob = new Blob([contents], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();

  URL.revokeObjectURL(url);
}
