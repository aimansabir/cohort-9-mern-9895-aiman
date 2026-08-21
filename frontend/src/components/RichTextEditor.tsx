import { useEffect, useRef } from 'react';
import type { ReactElement } from 'react';

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

export default function RichTextEditor({
  initialValue,
  onChange,
}: RichTextEditorProps): ReactElement {
  const boxRef = useRef<HTMLDivElement>(null);

  // The box keeps its own markup while you type. NotesPage gives it a key so
  // opening a different note remounts it with that note in place.
  useEffect(() => {
    const box = boxRef.current;
    if (box) {
      box.innerHTML = sanitizeHtml(initialValue);
    }
  }, [initialValue]);

  function runCommand(tool: Tool): void {
    document.execCommand(tool.command, false, tool.argument);

    const box = boxRef.current;
    if (box) {
      box.focus();
      onChange(box.innerHTML);
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
                className={tool.text ? 'editor-text-button' : undefined}
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
      />
    </div>
  );
}
