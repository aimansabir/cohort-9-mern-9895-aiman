import type { ReactElement } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

export default function Layout(): ReactElement {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout(): Promise<void> {
    await logout();
    navigate('/login');
  }

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="brand">
          <span className="brand-mark">N</span>
          Notes App
        </Link>

        <nav className="nav">
          {user ? (
            <>
              <Link to="/notes">Notes</Link>
              <span className="user-email">{user.email}</span>
              <button type="button" className="link-button" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/signup" className="button button-small">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
