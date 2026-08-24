export const MAX_CATEGORY_LENGTH = 20;

// Offered up front in the editor. Anything else the user types is just as
// valid, these are only a starting point.
export const SUGGESTED_CATEGORIES = ['Important', 'Study', 'Work', 'Personal', 'Idea'];

// The five above keep the colours people will have got used to. Everything
// else is coloured from this list.
const PINNED: Record<string, string> = {
  important: '#c0392b',
  study: '#2563eb',
  work: '#d97706',
  personal: '#15803d',
  idea: '#7048e8',
};

const PALETTE = ['#0891b2', '#be185d', '#4d7c0f', '#b45309', '#6d28d9', '#0369a1'];

// A category is not stored anywhere but on the notes that use it, so its
// colour is worked out from the name. That way it is the same every time it
// is drawn, on every device, without needing to be saved.
export function categoryColor(name: string): string {
  if (name.trim() === '') {
    return 'transparent';
  }

  const pinned = PINNED[name.trim().toLowerCase()];
  if (pinned !== undefined) {
    return pinned;
  }

  let total = 0;
  for (const character of name.trim().toLowerCase()) {
    total += character.codePointAt(0) ?? 0;
  }

  return PALETTE[total % PALETTE.length] ?? '#0891b2';
}

// Matches the rule the server enforces, so a name is turned down here rather
// than after a round trip.
export function isValidCategory(name: string): boolean {
  const trimmed = name.trim();

  if (trimmed === '') {
    return true;
  }
  return trimmed.length <= MAX_CATEGORY_LENGTH && /^[\p{L}\p{N} -]+$/u.test(trimmed);
}

// Notes saved before categories were free text hold a lowercase name, so
// "important" and "Important" have to count as the same category or filtering
// would quietly miss half of them.
export function sameCategory(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

// The list in the sidebar is whatever the notes actually use, so a category
// nothing is filed under stops being offered.
export function categoriesInUse(labels: string[]): string[] {
  const seen = new Map<string, string>();

  for (const label of labels) {
    const trimmed = label.trim();
    if (trimmed !== '' && !seen.has(trimmed.toLowerCase())) {
      seen.set(trimmed.toLowerCase(), trimmed);
    }
  }

  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}
