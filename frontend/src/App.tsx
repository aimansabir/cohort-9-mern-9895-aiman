import type { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from './context/AuthProvider';
import AppRoutes from './routes/AppRoutes';

export default function App(): ReactElement {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
