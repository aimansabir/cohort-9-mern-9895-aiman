import { useState } from 'react';
import type { FormEvent, ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import PasswordField from '../components/PasswordField';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/apiClient';

export default function LoginPage(): ReactElement {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/notes');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong, please try again');
      setIsSubmitting(false);
    }
  }

  return (
    <section className="form-page">
      <div className="form-head">
        <h1>Welcome back!</h1>
        <p className="form-sub">Log in to continue to your notes</p>
      </div>

      <form onSubmit={handleSubmit}>
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
          placeholder="Enter your password"
          onChange={setPassword}
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="form-footer">
        Do not have an account? <Link to="/signup">Sign up</Link>
      </p>
    </section>
  );
}
