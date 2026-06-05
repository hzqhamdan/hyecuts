import { API_BASE } from '../config';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions {
  body?: unknown;
  token?: string;
}

async function request<T>(
  method: string,
  path: string,
  options?: RequestOptions
): Promise<T> {
  const headers: Record<string, string> = {};

  if (options?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text || res.statusText);
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return res.json() as Promise<T>;
  }

  return res.text() as unknown as T;
}

export const api = {
  get: <T>(path: string, options?: { token?: string }) =>
    request<T>('GET', path, options),

  post: <T>(path: string, options?: { body?: unknown; token?: string }) =>
    request<T>('POST', path, options),

  put: <T>(path: string, options?: { body?: unknown; token?: string }) =>
    request<T>('PUT', path, options),

  del: <T>(path: string, options?: { token?: string }) =>
    request<T>('DELETE', path, options),
};
