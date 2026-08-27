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

  // token left in local storage might be expired or maybe belong to a deleted acc so check it with the backend once the app starts
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
      // The token stored in localStorage might be expired or invalid, so we don't care if the logout request fails. We still want to clear the token and user state.
      await authService.logout(token).catch(() => undefined);
    }
    clearStoredToken();
    setToken(null);
    setUser(null);
  }, [token]);

  const value = useMemo(
    () => ({ user, token, isLoading, login, signup, logout }),
    [user, token, isLoading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
