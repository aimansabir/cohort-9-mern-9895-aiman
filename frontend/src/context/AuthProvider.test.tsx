import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { AuthProvider } from './AuthProvider';
import { useAuth } from '../hooks/useAuth';
import * as authService from '../services/authService';
import * as tokenStorage from '../services/tokenStorage';

jest.mock('../services/authService');
jest.mock('../services/tokenStorage');

const mockedAuth = authService as jest.Mocked<typeof authService>;
const mockedStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;

const aUser = {
  id: 1,
  name: 'Aiman',
  email: 'aiman@example.com',
  createdAt: '2026-01-01T00:00:00Z',
};

// The real pages catch a failed login and show the message, so the harness
// does the same rather than leaving the rejection unhandled.
const ignore = (): undefined => undefined;

function Consumer() {
  const { user, token, isLoading, login, signup, logout } = useAuth();

  return (
    <div>
      <span data-testid="loading">{isLoading ? 'checking' : 'settled'}</span>
      <span data-testid="user">{user ? user.email : 'nobody'}</span>
      <span data-testid="token">{token ?? 'none'}</span>
      <button onClick={() => void login('aiman@example.com', 'GoodPass1').catch(ignore)}>
        log in
      </button>
      <button onClick={() => void signup('Aiman', 'aiman@example.com', 'GoodPass1').catch(ignore)}>
        sign up
      </button>
      <button onClick={() => void logout().catch(ignore)}>log out</button>
    </div>
  );
}

function renderProvider() {
  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
}

const shown = (id: string): string => screen.getByTestId(id).textContent ?? '';

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.getStoredToken.mockReturnValue(null);
  });

  describe('starting up with nothing stored', () => {
    it('settles straight away rather than showing a check', () => {
      renderProvider();

      expect(shown('loading')).toBe('settled');
      expect(shown('user')).toBe('nobody');
    });

    it('does not ask the server who is signed in', () => {
      renderProvider();
      expect(mockedAuth.getCurrentUser).not.toHaveBeenCalled();
    });
  });

  // A stored token could be expired or belong to a deleted account, so it is
  // checked once before the app trusts it.
  describe('starting up with a stored token', () => {
    it('checks it and keeps the session when it is good', async () => {
      mockedStorage.getStoredToken.mockReturnValue('stored-token');
      mockedAuth.getCurrentUser.mockResolvedValue(aUser);

      renderProvider();
      expect(shown('loading')).toBe('checking');

      await waitFor(() => expect(shown('user')).toBe('aiman@example.com'));
      expect(shown('loading')).toBe('settled');
      expect(mockedAuth.getCurrentUser).toHaveBeenCalledWith('stored-token');
    });

    it('throws the token away when the server rejects it', async () => {
      mockedStorage.getStoredToken.mockReturnValue('stale-token');
      mockedAuth.getCurrentUser.mockRejectedValue(new Error('401'));

      renderProvider();

      await waitFor(() => expect(shown('loading')).toBe('settled'));
      expect(mockedStorage.clearStoredToken).toHaveBeenCalled();
      expect(shown('user')).toBe('nobody');
      expect(shown('token')).toBe('none');
    });
  });

  describe('logging in', () => {
    it('remembers the token and the user', async () => {
      mockedAuth.login.mockResolvedValue({ user: aUser, token: 'fresh-token' });

      renderProvider();
      fireEvent.click(screen.getByText('log in'));

      await waitFor(() => expect(shown('user')).toBe('aiman@example.com'));
      expect(mockedStorage.storeToken).toHaveBeenCalledWith('fresh-token');
      expect(shown('token')).toBe('fresh-token');
    });

    // Nothing is stored unless the request succeeded, so a failed login
    // cannot leave a half signed in state behind.
    it('stores nothing when the credentials are wrong', async () => {
      mockedAuth.login.mockRejectedValue(new Error('401'));

      renderProvider();
      fireEvent.click(screen.getByText('log in'));

      await waitFor(() => expect(mockedAuth.login).toHaveBeenCalled());
      expect(mockedStorage.storeToken).not.toHaveBeenCalled();
      expect(shown('user')).toBe('nobody');
    });
  });

  describe('signing up', () => {
    it('signs the new account straight in', async () => {
      mockedAuth.signup.mockResolvedValue({ user: aUser, token: 'new-token' });

      renderProvider();
      fireEvent.click(screen.getByText('sign up'));

      await waitFor(() => expect(shown('user')).toBe('aiman@example.com'));
      expect(mockedStorage.storeToken).toHaveBeenCalledWith('new-token');
    });
  });

  describe('logging out', () => {
    it('clears the session', async () => {
      mockedAuth.login.mockResolvedValue({ user: aUser, token: 'fresh-token' });
      mockedAuth.logout.mockResolvedValue(undefined);

      renderProvider();
      fireEvent.click(screen.getByText('log in'));
      await waitFor(() => expect(shown('user')).toBe('aiman@example.com'));

      fireEvent.click(screen.getByText('log out'));

      await waitFor(() => expect(shown('user')).toBe('nobody'));
      expect(mockedStorage.clearStoredToken).toHaveBeenCalled();
      expect(shown('token')).toBe('none');
    });

    // The token expires on its own, so a failed logout request must not
    // leave someone stuck signed in on this device.
    it('clears the session even when the request fails', async () => {
      mockedAuth.login.mockResolvedValue({ user: aUser, token: 'fresh-token' });
      mockedAuth.logout.mockRejectedValue(new Error('offline'));

      renderProvider();
      fireEvent.click(screen.getByText('log in'));
      await waitFor(() => expect(shown('user')).toBe('aiman@example.com'));

      fireEvent.click(screen.getByText('log out'));

      await waitFor(() => expect(shown('user')).toBe('nobody'));
      expect(mockedStorage.clearStoredToken).toHaveBeenCalled();
    });

    it('does not call the server when there is no token to end', async () => {
      renderProvider();
      fireEvent.click(screen.getByText('log out'));

      await waitFor(() => expect(shown('user')).toBe('nobody'));
      expect(mockedAuth.logout).not.toHaveBeenCalled();
    });
  });
});
