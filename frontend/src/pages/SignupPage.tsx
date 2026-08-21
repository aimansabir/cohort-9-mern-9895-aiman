import { useState } from 'react';
import type { FormEvent, ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import PasswordField from '../components/PasswordField';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/apiClient';

export default function SignupPage(): ReactElement {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signup(name, email, password);
      navigate('/notes');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong, please try again');
      setIsSubmitting(false);
    }
  }

  return (
    <section className="form-page">
      <div className="form-head">
        <h1>Create your account</h1>
        <p className="form-sub">Start keeping your notes in one place</p>
      </div>

      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <PasswordField
          id="password"
          value={password}
          placeholder="Create a password"
          onChange={setPassword}
          minLength={8}
          pattern="(?=.*[A-Za-z])(?=.*\d).{8,}"
          title="At least 8 characters, with a letter and a number."
        />
        <small>At least 8 characters, with a letter and a number.</small>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Sign up'}
        </button>
      </form>

      <p className="form-footer">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}
