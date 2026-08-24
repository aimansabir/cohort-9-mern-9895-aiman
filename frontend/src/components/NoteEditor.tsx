import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactElement, SyntheticEvent } from 'react';

import type { Note } from '../types/note';
import RichTextEditor from './RichTextEditor';
import { countCharacters, countWords, plural } from '../utils/noteText';
import {
  MAX_CATEGORY_LENGTH,
  SUGGESTED_CATEGORIES,
  categoryColor,
  isValidCategory,
  sameCategory,
} from '../utils/noteCategories';
import { NOTE_TEMPLATES } from '../utils/noteTemplates';
import type { NoteTemplate } from '../utils/noteTemplates';
import { CloseIcon, FocusIcon, TrashIcon } from './icons';

interface NoteEditorProps {
  // null means this is a new note rather than an existing one
  note: Note | null;
  isSaving: boolean;
  error: string | null;
  onSave: (title: string, content: string, label: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function NoteEditor({
  note,
  isSaving,
  error,
  onSave,
  onDelete,
  onClose,
}: NoteEditorProps): ReactElement {
  const [title, setTitle] = useState(note ? note.title : '');
  const [content, setContent] = useState(note ? note.content : '');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  // The rich text box only reads this when it changes, so picking a template
  // is what pushes new markup into it.
  const [editorValue, setEditorValue] = useState(note ? note.content : '');
  const [templateId, setTemplateId] = useState('blank');
  const [label, setLabel] = useState(note ? note.label : '');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isNaming, setIsNaming] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    // StrictMode runs this twice in development, and older browsers throw if
    // showModal is called on a dialog that is already open.
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    titleRef.current?.focus();
  }, []);

  // Closing the dialog itself lets the browser put focus back on whatever
  // opened it. Unmounting an open dialog skips that.
  function requestClose(): void {
    dialogRef.current?.close();
  }

  function applyTemplate(template: NoteTemplate): void {
    setTemplateId(template.id);
    setTitle(template.title);
    setContent(template.content);
    setEditorValue(template.content);
    titleRef.current?.focus();
  }

  // A category the note already carries is offered alongside the suggestions,
  // so opening an old note does not lose the name it was filed under.
  const offered = SUGGESTED_CATEGORIES.some((name) => sameCategory(name, label))
    ? SUGGESTED_CATEGORIES
    : [...SUGGESTED_CATEGORIES, label].filter((name) => name !== '');

  function addCategory(): void {
    const name = newCategory.trim();
    if (!isValidCategory(name) || name === '') {
      return;
    }

    setLabel(name);
    setNewCategory('');
    setIsNaming(false);
  }

  // Escape is the way out of focus mode before it is the way out of the
  // editor, so a full screen note is not lost by reaching for it.
  function handleCancel(event: SyntheticEvent<HTMLDialogElement>): void {
    if (isFocusMode) {
      event.preventDefault();
      setIsFocusMode(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSave(title.trim(), content, label);
  }

  return (
    <dialog
      ref={dialogRef}
      className={`modal${isFocusMode ? ' is-focus' : ''}`}
      aria-label={note ? 'Edit note' : 'New note'}
      onClose={onClose}
      onCancel={handleCancel}
    >
      <form onSubmit={handleSubmit}>
        <header className="modal-head">
          <input
            ref={titleRef}
            className="modal-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Note title"
            aria-label="Note title"
            maxLength={255}
            required
          />

          <button
            type="button"
            className="icon-button"
            onClick={() => setIsFocusMode(!isFocusMode)}
            aria-pressed={isFocusMode}
            title={isFocusMode ? 'Leave focus mode' : 'Focus mode'}
            aria-label={isFocusMode ? 'Leave focus mode' : 'Focus mode'}
          >
            <FocusIcon on={isFocusMode} />
          </button>

          <button
            type="button"
            className="icon-button"
            onClick={requestClose}
            aria-label="Close editor"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="modal-body">
          {/* only offered on a new note, so a template can never wipe out
              something already written */}
          {!note && (
            <div className="template-row">
              <span className="template-label">Start with</span>

              {NOTE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={`template-chip${templateId === template.id ? ' is-active' : ''}`}
                  title={template.description}
                  aria-pressed={templateId === template.id}
                  onClick={() => applyTemplate(template)}
                >
                  {template.name}
                </button>
              ))}
            </div>
          )}

          <div className="template-row">
            <span className="template-label">Category</span>

            <button
              type="button"
              className={`category-chip${label === '' ? ' is-active' : ''}`}
              aria-pressed={label === ''}
              onClick={() => setLabel('')}
            >
              None
            </button>

            {offered.map((name) => (
              <button
                key={name}
                type="button"
                className={`category-chip${sameCategory(label, name) ? ' is-active' : ''}`}
                aria-pressed={sameCategory(label, name)}
                onClick={() => setLabel(name)}
              >
                <span className="category-dot" style={{ backgroundColor: categoryColor(name) }} />
                {name}
              </button>
            ))}

            {isNaming ? (
              <span className="category-new">
                <input
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  placeholder="Category name"
                  aria-label="New category name"
                  maxLength={MAX_CATEGORY_LENGTH}
                  autoFocus
                  // Enter would otherwise submit the note instead of adding
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addCategory();
                    }
                  }}
                />
                <button
                  type="button"
                  className="category-chip"
                  disabled={newCategory.trim() === '' || !isValidCategory(newCategory)}
                  onClick={addCategory}
                >
                  Add
                </button>
              </span>
            ) : (
              <button
                type="button"
                className="category-chip"
                onClick={() => setIsNaming(true)}
              >
                + New
              </button>
            )}
          </div>

          <RichTextEditor initialValue={editorValue} onChange={setContent} />
          {error && <p className="error">{error}</p>}
        </div>

        <footer className="modal-foot">
          <span className="modal-meta">
            {plural(countWords(content), 'word')}
            <span aria-hidden="true"> &middot; </span>
            {plural(countCharacters(content), 'character')}
          </span>

          {note ? (
            isConfirmingDelete ? (
              <span className="modal-confirm">
                Delete this note?
                <button
                  type="button"
                  className="button button-secondary button-small"
                  onClick={() => setIsConfirmingDelete(false)}
                >
                  Keep
                </button>
                <button
                  type="button"
                  className="button button-small button-danger"
                  onClick={onDelete}
                >
                  Delete
                </button>
              </span>
            ) : (
              <button
                type="button"
                className="button-danger"
                onClick={() => setIsConfirmingDelete(true)}
              >
                <TrashIcon />
                Delete
              </button>
            )
          ) : (
            <span />
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={requestClose}
            >
              Cancel
            </button>
            <button type="submit" className="button button-small" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save note'}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}
