import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

import * as authService from '../services/authService';
import { clearStoredToken, getStoredToken, storeToken } from '../services/tokenStorage';
import type { User } from '../types/auth';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [isLoading, setIsLoading] = useState(() => getStoredToken() !== null);

  // A token left in localStorage might be expired or belong to a deleted
  // account, so check it with the backend once when the app starts.
  useEffect(() => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      return;
    }

    let active = true;

    authService
      .getCurrentUser(storedToken)
      .then((currentUser) => {
        if (active) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        if (active) {
          clearStoredToken();
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authService.login(email, password);
    storeToken(result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const result = await authService.signup(name, email, password);
    storeToken(result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      // The token stays valid until it expires, so a failed request here
      // should not stop us clearing it on this device.
      await authService.logout(token).catch(() => undefined);
    }

    try {
      clearStoredToken();
    } catch {
      // localStorage is not always available, for example in private mode.
      // Logging out should still work, so keep going and clear the state.
    }

    setToken(null);
    setUser(null);
  }, [token]);

  const value = useMemo(
    () => ({ user, token, isLoading, login, signup, logout }),
    [user, token, isLoading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
