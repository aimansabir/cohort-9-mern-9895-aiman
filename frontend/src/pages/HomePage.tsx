import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import NotePreview from '../components/NotePreview';
import Scribble from '../components/Scribble';
import {
  ArrowIcon,
  BoltIcon,
  LockIcon,
  PencilIcon,
  ScreenIcon,
  ShieldIcon,
  SparkleIcon,
} from '../components/icons';
import { useAuth } from '../hooks/useAuth';

const features = [
  {
    tone: 'violet',
    icon: <PencilIcon />,
    title: 'Rich text editing',
    description: 'Headings, lists and emphasis, not just plain text.',
  },
  {
    tone: 'pink',
    icon: <LockIcon />,
    title: 'Private to you',
    description: 'Notes are tied to your account and nobody else can open them.',
  },
  {
    tone: 'blue',
    icon: <ScreenIcon />,
    title: 'Works on any screen',
    description: 'The same notes on a laptop or a phone.',
  },
  {
    tone: 'green',
    icon: <BoltIcon />,
    title: 'Create, edit, delete',
    description: 'Keep the list tidy as your notes pile up.',
  },
];

export default function HomePage(): ReactElement {
  const { user } = useAuth();

  return (
    <>
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

      <ul className="features">
        {features.map((feature) => (
          <li key={feature.title}>
            <span className={`feature-icon feature-icon-${feature.tone}`}>{feature.icon}</span>
            <div className="feature-text">
              <h2>{feature.title}</h2>
              <p>{feature.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
