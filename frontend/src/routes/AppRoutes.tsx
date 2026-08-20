import type { ReactElement } from 'react';
import { Route, Routes } from 'react-router-dom';

import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import NotesPage from '../pages/NotesPage';
import SignupPage from '../pages/SignupPage';

export default function AppRoutes(): ReactElement {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/notes" element={<NotesPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
