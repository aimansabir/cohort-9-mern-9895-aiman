import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import NotePreview from '../components/NotePreview';
import Scribble from '../components/Scribble';
import { ArrowIcon, ShieldIcon, SparkleIcon } from '../components/icons';
import { useAuth } from '../hooks/useAuth';

export default function HomePage(): ReactElement {
  const { user } = useAuth();

  return (
    <section className="landing">
      <div className="landing-copy">
        <span className="badge">
          <SparkleIcon />
          Your thoughts, organised
        </span>

        <h1 className="landing-title">
          Write it down.
          <br />
          <span className="title-line">
            <span className="accent">Never</span> forget.
            <Scribble />
          </span>
        </h1>

        <p className="landing-lead">
          A simple note-taking app that keeps your ideas in one place and brings them back
          wherever you sign in.
        </p>

        <div className="hero-actions">
          {user ? (
            <Link to="/notes" className="button">
              Go to your notes
              <ArrowIcon />
            </Link>
          ) : (
            <>
              <Link to="/signup" className="button">
                Create an account
                <ArrowIcon />
              </Link>
              <Link to="/login" className="button button-secondary">
                Log in
              </Link>
            </>
          )}
        </div>

        <p className="landing-note">
          <ShieldIcon />
          Your notes are private to your account.
        </p>
      </div>

      <NotePreview />
    </section>
  );
}
