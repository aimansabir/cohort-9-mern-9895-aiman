import type { AuthResult, User } from '../types/auth';
import { apiRequest } from './apiClient';

export async function signup(
  name: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  const response = await apiRequest<AuthResult>('/api/auth/signup', {
    method: 'POST',
    body: { name, email, password },
  });

  if (!response.data) {
    throw new Error('Signup response did not include the user');
  }
  return response.data;
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const response = await apiRequest<AuthResult>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });

  if (!response.data) {
    throw new Error('Login response did not include the user');
  }
  return response.data;
}

export async function getCurrentUser(token: string): Promise<User> {
  const response = await apiRequest<{ user: User }>('/api/auth/me', { token });

  if (!response.data) {
    throw new Error('Profile response did not include the user');
  }
  return response.data.user;
}

export async function logout(token: string): Promise<void> {
  await apiRequest('/api/auth/logout', { method: 'POST', token });
}
