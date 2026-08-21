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
  holder.innerHTML = sanitizeHtml(html).replace(/<\/(p|h2|h3|li)>/gi, ' $&');
  return (holder.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function formatUpdated(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return '';
  }

  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? `1 hour ago` : `${hours} hours ago`;
  }

  const days = Math.round(hours / 24);
  if (days === 1) {
    return 'Yesterday';
  }
  if (days < 7) {
    return `${days} days ago`;
  }

  return new Date(then).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 18) {
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
