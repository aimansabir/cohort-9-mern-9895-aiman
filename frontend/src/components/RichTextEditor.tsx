import { useEffect, useRef, useState } from 'react';
import type { ClipboardEvent, ReactElement } from 'react';

import { sanitizeHtml } from '../utils/noteText';
import {
  BoldIcon,
  BulletListIcon,
  ItalicIcon,
  NumberListIcon,
  QuoteIcon,
  RedoIcon,
  StrikeIcon,
  UnderlineIcon,
  UndoIcon,
} from './icons';

interface RichTextEditorProps {
  initialValue: string;
  onChange: (html: string) => void;
}

interface Tool {
  command: string;
  argument?: string;
  label: string;
  icon?: ReactElement;
  text?: string;
}

// grouped the way the buttons are separated in the toolbar
const toolGroups: Tool[][] = [
  [
    { command: 'bold', label: 'Bold', icon: <BoldIcon /> },
    { command: 'italic', label: 'Italic', icon: <ItalicIcon /> },
    { command: 'underline', label: 'Underline', icon: <UnderlineIcon /> },
    { command: 'strikeThrough', label: 'Strikethrough', icon: <StrikeIcon /> },
  ],
  [
    { command: 'formatBlock', argument: 'h1', label: 'Heading 1', text: 'H1' },
    { command: 'formatBlock', argument: 'h2', label: 'Heading 2', text: 'H2' },
    { command: 'formatBlock', argument: 'h3', label: 'Heading 3', text: 'H3' },
  ],
  [
    { command: 'insertUnorderedList', label: 'Bullet list', icon: <BulletListIcon /> },
    { command: 'insertOrderedList', label: 'Numbered list', icon: <NumberListIcon /> },
    { command: 'formatBlock', argument: 'blockquote', label: 'Quote', icon: <QuoteIcon /> },
  ],
  [
    { command: 'undo', label: 'Undo', icon: <UndoIcon /> },
    { command: 'redo', label: 'Redo', icon: <RedoIcon /> },
  ],
];

// execCommand throws for anything the browser does not know, and undo and
// redo have no on or off state to report.
function isToolActive(tool: Tool): boolean {
  if (tool.command === 'undo' || tool.command === 'redo') {
    return false;
  }

  try {
    if (tool.command === 'formatBlock') {
      return document.queryCommandValue('formatBlock').toLowerCase() === tool.argument;
    }
    return document.queryCommandState(tool.command);
  } catch {
    return false;
  }
}

export default function RichTextEditor({
  initialValue,
  onChange,
}: RichTextEditorProps): ReactElement {
  const boxRef = useRef<HTMLDivElement>(null);
  const [activeTools, setActiveTools] = useState<string[]>([]);

  // The box keeps its own markup while you type. NotesPage gives it a key so
  // opening a different note remounts it with that note in place.
  useEffect(() => {
    const box = boxRef.current;
    if (box) {
      box.innerHTML = sanitizeHtml(initialValue);
    }
  }, [initialValue]);

  // The buttons light up for whatever the caret is sitting in, which the
  // browser only tells us once the selection has actually moved.
  useEffect(() => {
    function refreshActiveTools(): void {
      const box = boxRef.current;
      const anchor = document.getSelection()?.anchorNode ?? null;
      if (!box || !anchor || !box.contains(anchor)) {
        return;
      }

      setActiveTools(
        toolGroups.flat().filter(isToolActive).map((tool) => tool.label),
      );
    }

    document.addEventListener('selectionchange', refreshActiveTools);
    return () => {
      document.removeEventListener('selectionchange', refreshActiveTools);
    };
  }, []);

  // Pasted markup goes straight into the live DOM, where an onerror
  // attribute would run, so it is cleaned on the way in as well as on save.
  function handlePaste(event: ClipboardEvent<HTMLDivElement>): void {
    event.preventDefault();

    const html = event.clipboardData.getData('text/html');
    if (html) {
      document.execCommand('insertHTML', false, sanitizeHtml(html));
    } else {
      document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
    }

    const box = boxRef.current;
    if (box) {
      onChange(box.innerHTML);
    }
  }

  function runCommand(tool: Tool): void {
    document.execCommand(tool.command, false, tool.argument);

    const box = boxRef.current;
    if (box) {
      box.focus();
      onChange(box.innerHTML);
      setActiveTools(toolGroups.flat().filter(isToolActive).map((item) => item.label));
    }
  }

  return (
    <div className="editor">
      <div className="editor-toolbar">
        {toolGroups.map((group, index) => (
          <div key={group[0]?.label ?? index} className="editor-group">
            {group.map((tool) => (
              <button
                key={tool.label}
                type="button"
                title={tool.label}
                aria-label={tool.label}
                className={[
                  tool.text ? 'editor-text-button' : '',
                  activeTools.includes(tool.label) ? 'is-active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={activeTools.includes(tool.label)}
                // keep the text selection while the button is pressed
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runCommand(tool)}
              >
                {tool.icon ?? tool.text}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div
        ref={boxRef}
        className="editor-box"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Note content"
        data-placeholder="Start writing your note..."
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        onPaste={handlePaste}
        onDrop={(event) => event.preventDefault()}
      />
    </div>
  );
}
