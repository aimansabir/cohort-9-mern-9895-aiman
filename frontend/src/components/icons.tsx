import type { ReactElement } from 'react';

const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function SparkleIcon(): ReactElement {
  return (
    <svg {...base} width={14} height={14} aria-hidden="true">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
    </svg>
  );
}

export function ArrowIcon(): ReactElement {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function ShieldIcon(): ReactElement {
  return (
    <svg {...base} width={14} height={14} aria-hidden="true">
      <path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z" />
    </svg>
  );
}

export function PencilIcon(): ReactElement {
  return (
    <svg {...base} width={17} height={17} aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

/* icons used inside the decorative app mockup */

export function NoteIcon(): ReactElement {
  return (
    <svg {...base} width={13} height={13} aria-hidden="true">
      <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" />
      <path d="M14 3v6h6" />
    </svg>
  );
}

export function StarIcon(): ReactElement {
  return (
    <svg {...base} width={13} height={13} aria-hidden="true">
      <path d="M12 3l2.9 5.9 6.1.9-4.5 4.3 1.1 6.4-5.6-3-5.6 3 1.1-6.4L3 9.8l6.1-.9L12 3z" />
    </svg>
  );
}

export function CheckIcon(): ReactElement {
  return (
    <svg {...base} width={13} height={13} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.2l2.4 2.4 4.6-4.8" />
    </svg>
  );
}

export function ArchiveIcon(): ReactElement {
  return (
    <svg {...base} width={13} height={13} aria-hidden="true">
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8M10 12h4" />
    </svg>
  );
}

export function SearchIcon(): ReactElement {
  return (
    <svg {...base} width={13} height={13} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function PlusIcon(): ReactElement {
  return (
    <svg {...base} width={13} height={13} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function GearIcon(): ReactElement {
  return (
    <svg {...base} width={13} height={13} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1A1.7 1.7 0 008.9 19a1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 8.9a1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
    </svg>
  );
}

export function TrashIcon(): ReactElement {
  return (
    <svg {...base} width={13} height={13} aria-hidden="true">
      <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    </svg>
  );
}

export function EyeIcon(): ReactElement {
  return (
    <svg {...base} width={17} height={17} aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon(): ReactElement {
  return (
    <svg {...base} width={17} height={17} aria-hidden="true">
      <path d="M9.9 5.2A9.5 9.5 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3 3.9" />
      <path d="M6.2 6.2A17 17 0 0 0 2 12s3.6 7 10 7a9.4 9.4 0 0 0 4.2-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

export function BoldIcon(): ReactElement {
  return (
    <svg {...base} width={15} height={15} aria-hidden="true">
      <path d="M7 5h6a3.5 3.5 0 010 7H7z" />
      <path d="M7 12h7a3.5 3.5 0 010 7H7z" />
    </svg>
  );
}

export function ItalicIcon(): ReactElement {
  return (
    <svg {...base} width={15} height={15} aria-hidden="true">
      <path d="M15 5h-5M14 19H9M14 5l-4 14" />
    </svg>
  );
}

export function HeadingIcon(): ReactElement {
  return (
    <svg {...base} width={15} height={15} aria-hidden="true">
      <path d="M6 5v14M18 5v14M6 12h12" />
    </svg>
  );
}

export function BulletListIcon(): ReactElement {
  return (
    <svg {...base} width={15} height={15} aria-hidden="true">
      <path d="M9 6h11M9 12h11M9 18h11" />
      <circle cx="4.5" cy="6" r="1.2" />
      <circle cx="4.5" cy="12" r="1.2" />
      <circle cx="4.5" cy="18" r="1.2" />
    </svg>
  );
}

export function NumberListIcon(): ReactElement {
  return (
    <svg {...base} width={15} height={15} aria-hidden="true">
      <path d="M10 6h10M10 12h10M10 18h10M4 6h1v4M4 16.5h2M4 19h2M4 14h2v2.5H4" />
    </svg>
  );
}

export function CloseIcon(): ReactElement {
  return (
    <svg {...base} width={17} height={17} aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function UnderlineIcon(): ReactElement {
  return (
    <svg {...base} width={15} height={15} aria-hidden="true">
      <path d="M7 4v6a5 5 0 0010 0V4M5 20h14" />
    </svg>
  );
}

export function StrikeIcon(): ReactElement {
  return (
    <svg {...base} width={15} height={15} aria-hidden="true">
      <path d="M4 12h16M7 8a3.5 3.5 0 013.5-3h3A3.5 3.5 0 0117 8M7 16a3.5 3.5 0 003.5 3h3a3.5 3.5 0 003.5-3" />
    </svg>
  );
}

export function QuoteIcon(): ReactElement {
  return (
    <svg {...base} width={15} height={15} aria-hidden="true">
      <path d="M9 7H6a2 2 0 00-2 2v3a2 2 0 002 2h3v-3M20 7h-3a2 2 0 00-2 2v3a2 2 0 002 2h3v-3" />
    </svg>
  );
}

export function UndoIcon(): ReactElement {
  return (
    <svg {...base} width={15} height={15} aria-hidden="true">
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h11a5 5 0 010 10h-4" />
    </svg>
  );
}

export function RedoIcon(): ReactElement {
  return (
    <svg {...base} width={15} height={15} aria-hidden="true">
      <path d="M15 14l5-5-5-5" />
      <path d="M20 9H9a5 5 0 000 10h4" />
    </svg>
  );
}

export function LogOutIcon(): ReactElement {
  return (
    <svg {...base} width={15} height={15} aria-hidden="true">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

export function ClockIcon(): ReactElement {
  return (
    <svg {...base} width={13} height={13} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function CalendarIcon(): ReactElement {
  return (
    <svg {...base} width={14} height={14} aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function SortAzIcon(): ReactElement {
  return (
    <svg {...base} width={14} height={14} aria-hidden="true">
      <path d="M4 7h9M4 12h7M4 17h5" />
      <path d="M17 5v14M17 19l-2.5-2.5M17 19l2.5-2.5" />
    </svg>
  );
}

export function ChevronDownIcon(): ReactElement {
  return (
    <svg {...base} width={14} height={14} aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

