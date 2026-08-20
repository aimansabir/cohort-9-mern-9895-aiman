import { Navigate, Outlet } from 'react-router-dom';
import type { ReactElement } from 'react';

import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute(): ReactElement {
  const { user, isLoading } = useAuth();

  // Without this the stored token has not been checked yet and we would
  // bounce a logged-in user to the login page on every refresh.
  if (isLoading) {
    return <p className="status">Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
