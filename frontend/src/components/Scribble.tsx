import type { ReactElement } from 'react';

// Underline under the headline. It draws itself once when the page loads
// and a pencil rides along the tip of the stroke. Decorative only.
export default function Scribble(): ReactElement {
  return (
    <span className="scribble" aria-hidden="true">
      <svg viewBox="0 0 320 26" fill="none" preserveAspectRatio="none">
        <path
          d="M6 18C54 6 96 22 148 12s92-14 166 2"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>

      <span className="scribble-pen">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" className="pen-body" />
          <path d="M15 5l3 3" />
        </svg>
      </span>
    </span>
  );
}
