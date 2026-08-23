import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../hooks/useAuth';

jest.mock('../hooks/useAuth');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const aUser = { id: 1, name: 'Aiman', email: 'aiman@example.com', createdAt: '2026-01-01T00:00:00Z' };

function renderAt(state: { user: typeof aUser | null; isLoading: boolean }): void {
  mockedUseAuth.mockReturnValue({
    user: state.user,
    token: state.user ? 'a-token' : null,
    isLoading: state.isLoading,
    login: async () => undefined,
    signup: async () => undefined,
    logout: async () => undefined,
  });

  render(
    <MemoryRouter initialEntries={['/notes']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/notes" element={<p>the notes page</p>} />
        </Route>
        <Route path="/login" element={<p>the login page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lets a signed in user through', () => {
    renderAt({ user: aUser, isLoading: false });
    expect(screen.getByText('the notes page')).toBeInTheDocument();
  });

  it('sends a signed out visitor to the login page', () => {
    renderAt({ user: null, isLoading: false });

    expect(screen.getByText('the login page')).toBeInTheDocument();
    expect(screen.queryByText('the notes page')).not.toBeInTheDocument();
  });

  // The stored token has not been checked yet at this point. Without the
  // wait, refreshing the page would throw a signed in user back to login.
  it('waits instead of redirecting while the token is being checked', () => {
    renderAt({ user: null, isLoading: true });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('the login page')).not.toBeInTheDocument();
    expect(screen.queryByText('the notes page')).not.toBeInTheDocument();
  });
});
