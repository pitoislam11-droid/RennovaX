import { fetch } from 'expo/fetch';

import { authClient } from '@/lib/auth/auth-client';

type ApiEnvelope<T> = { data: T };
type ApiFailure = { error?: { message?: string; code?: string } | string };

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: string | FormData;
};

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = 'REQUEST_FAILED') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  if (!baseUrl) throw new ApiError('The Rennova service is not configured yet.', 0, 'MISSING_BACKEND_URL');

  const cookie = await authClient.getCookie();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const response = await fetch(`${baseUrl}${url}`, {
    method: options.method ?? 'GET',
    body: options.body,
    credentials: 'include',
    headers: {
      ...(options.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
  });

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get('content-type');
  const json = contentType?.includes('application/json')
    ? ((await response.json()) as ApiEnvelope<T> & ApiFailure)
    : null;

  if (!response.ok) {
    const nestedError = json?.error;
    const message = typeof nestedError === 'string'
      ? nestedError
      : nestedError?.message ?? 'Something went wrong. Please try again.';
    const code = typeof nestedError === 'object' ? nestedError?.code : undefined;
    throw new ApiError(message, response.status, code);
  }

  return json?.data as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T, B = unknown>(url: string, body: B) =>
    request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  put: <T, B = unknown>(url: string, body: B) =>
    request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T, B = unknown>(url: string, body: B) =>
    request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
  upload: <T>(url: string, formData: FormData) =>
    request<T>(url, { method: 'POST', body: formData }),
};
