import { render, screen } from '@testing-library/react';

import { AuthContext, type AuthContextValue } from '../context/AuthContext';
import { useAuth } from './useAuth';

function Consumer() {
  const { user } = useAuth();
  return <span>{user ? user.email : 'nobody'}</span>;
}

const value: AuthContextValue = {
  user: { id: 1, name: 'Aiman', email: 'aiman@example.com', createdAt: '2026-01-01T00:00:00Z' },
  token: 'a-token',
  isLoading: false,
  login: async () => undefined,
  signup: async () => undefined,
  logout: async () => undefined,
};

describe('useAuth', () => {
  it('hands back whatever the provider is holding', () => {
    render(
      <AuthContext.Provider value={value}>
        <Consumer />
      </AuthContext.Provider>,
    );

    expect(screen.getByText('aiman@example.com')).toBeInTheDocument();
  });

  // Without this the hook would hand back undefined and every read of it
  // would fail somewhere further away from the real mistake.
  it('complains when it is used outside the provider', () => {
    const quiet = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<Consumer />)).toThrow(/inside AuthProvider/);

    quiet.mockRestore();
  });
});
