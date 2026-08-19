import type { ReactElement } from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function Layout(): ReactElement {
  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="brand">
          Notes App
        </Link>
        <nav className="nav">
          <Link to="/notes">Notes</Link>
          <Link to="/login">Log in</Link>
          <Link to="/signup">Sign up</Link>
        </nav>
      </header>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
