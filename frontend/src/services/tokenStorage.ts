const TOKEN_KEY = 'notes_token';

// localStorage is not always usable, for example in private browsing or when
// site data is blocked. None of these are allowed to throw, because
// getStoredToken runs while AuthProvider renders and would take the whole app
// down with it.
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // staying signed in next time is best effort
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // the caller clears the in memory state either way
  }
}
