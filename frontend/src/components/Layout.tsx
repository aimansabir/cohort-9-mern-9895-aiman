import type { ReactElement } from 'react';
import { Link, Outlet } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

export default function Layout(): ReactElement {
  const { user } = useAuth();

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="brand">
          <span className="brand-mark">N</span>
          Notes App
        </Link>

        <nav className="nav">
          {user ? (
            <Link to="/notes" className="nav-user">
              <span className="nav-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
              <span className="nav-name">{user.name}</span>
            </Link>
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
