import type { ReactElement } from 'react';

import type { TimeOfDay } from '../utils/noteText';

const SUN = '#f6b93b';

// Emoji for this rendered with a heavy black outline on Windows and looked
// different again on other systems, so the icon is drawn here instead.
export default function GreetingIcon({ time }: { time: TimeOfDay }): ReactElement {
  if (time === 'night') {
    return (
      <svg className="greeting-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M21.6 15.4A9.6 9.6 0 0 1 9 2.8a9.6 9.6 0 1 0 12.6 12.6Z" fill={SUN} />
      </svg>
    );
  }

  if (time === 'evening') {
    return (
      <svg className="greeting-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="9" cy="7.6" r="5" fill={SUN} />
        <path
          d="M17.6 21H7.4a4.5 4.5 0 0 1 .3-9 6.2 6.2 0 0 1 11.6 2.3A3.6 3.6 0 0 1 17.6 21Z"
          fill="#e3e7f0"
        />
      </svg>
    );
  }

  if (time === 'morning') {
    return (
      <svg className="greeting-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3.4 17.4a8.6 8.6 0 0 1 17.2 0Z" fill={SUN} />
        <path
          d="M1.6 21h20.8"
          stroke="#c4b2f0"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg className="greeting-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="5.6" fill={SUN} />
      <path
        d="M12 0.8v2.6M12 20.6v2.6M0.8 12h2.6M20.6 12h2.6M4.1 4.1l1.9 1.9M18 18l1.9 1.9M19.9 4.1L18 6M6 18l-1.9 1.9"
        stroke={SUN}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
