import { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { firstNameOf } from '../utils/noteText';
import { ChevronDownIcon, LogOutIcon, UserIcon } from './icons';

export default function Layout(): ReactElement {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handleAway(event: MouseEvent): void {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleAway);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleAway);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isMenuOpen]);

  async function handleLogout(): Promise<void> {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
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
            <div className="nav-menu" ref={menuRef}>
              <button
                type="button"
                className="nav-user"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
              >
                <span className="nav-avatar">{firstNameOf(user.name).slice(0, 1).toUpperCase()}</span>
                <span className="nav-name">{firstNameOf(user.name)}</span>
                <ChevronDownIcon />
              </button>

              {isMenuOpen && (
                <div className="nav-dropdown" role="menu">
                  <span className="nav-dropdown-email">{user.email}</span>

                  <Link
                    to="/account"
                    role="menuitem"
                    className="nav-dropdown-item"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserIcon />
                    Account
                  </Link>

                  <button
                    type="button"
                    role="menuitem"
                    className="nav-dropdown-item nav-dropdown-logout"
                    onClick={() => void handleLogout()}
                  >
                    <LogOutIcon />
                    Log out
                  </button>
                </div>
              )}
            </div>
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
