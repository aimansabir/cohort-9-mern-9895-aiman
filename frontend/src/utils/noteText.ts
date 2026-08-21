import DOMPurify from 'dompurify';

// The editor saves HTML, so anything going back into the page is cleaned
// first. Only the tags the toolbar can produce are allowed through.
const ALLOWED_TAGS = [
  'p',
  'br',
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'strike',
  'blockquote',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: [] });
}

// Card previews show text rather than markup.
export function toPlainText(html: string): string {
  const holder = document.createElement('div');
  // headings, paragraphs and list items would otherwise run together
  // into one word once the tags are gone
  holder.innerHTML = sanitizeHtml(html).replace(
    /<\/(p|h1|h2|h3|li|blockquote)>|<br\s*\/?>/gi,
    ' $&',
  );
  return (holder.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function formatUpdated(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  // numeric hour so a 12 hour clock reads 4:19 PM rather than 04:19 PM
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const today = new Date();

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return `Today, ${time}`;
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${time}`;
  }

  // the year is only worth showing once it is not this one
  const day = date.toLocaleDateString(
    undefined,
    date.getFullYear() === today.getFullYear()
      ? { day: 'numeric', month: 'short' }
      : { day: 'numeric', month: 'short', year: 'numeric' },
  );
  return `${day}, ${time}`;
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export function timeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours();

  if (hour < 12) {
    return 'morning';
  }
  if (hour < 17) {
    return 'afternoon';
  }
  if (hour < 21) {
    return 'evening';
  }
  return 'night';
}

// "Aiman Gul Sabir" is a mouthful in a greeting, so only the first part
// is used. Falls back to the whole thing if there is no space in it.
export function firstNameOf(name: string): string {
  return name.trim().split(' ')[0] ?? name;
}

export function greetingFor(time: TimeOfDay): string {
  if (time === 'morning') {
    return 'Good morning';
  }
  if (time === 'afternoon') {
    return 'Good afternoon';
  }
  return 'Good evening';
}

export function countWords(html: string): number {
  const plain = toPlainText(html);
  return plain ? plain.split(/\s+/).length : 0;
}

export function countCharacters(html: string): number {
  return toPlainText(html).length;
}

export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}
