import { API_URL } from '../config/env';
import type { ApiResponse } from '../types/api';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { method = 'GET', body } = options;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch only rejects when there was no response at all
    throw new ApiError('Could not reach the server', 0);
  }

  let payload: ApiResponse<T> | null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new ApiError(payload?.message ?? 'Something went wrong', response.status);
  }

  if (payload === null) {
    throw new ApiError('The server sent a response we could not read', response.status);
  }

  return payload;
}
