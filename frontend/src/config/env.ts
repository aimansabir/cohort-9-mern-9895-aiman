const configuredUrl = import.meta.env.VITE_API_URL;

if (!configuredUrl && import.meta.env.PROD) {
  throw new Error('VITE_API_URL must be set when building for production');
}

export const API_URL = configuredUrl ?? 'http://localhost:5000';
