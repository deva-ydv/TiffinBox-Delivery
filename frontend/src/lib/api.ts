import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
export const AUTH_EXPIRED_EVENT = 'tiffin:auth-expired';

// withCredentials makes the browser send and store the httpOnly auth cookies.
export const api = axios.create({ baseURL: API_URL, withCredentials: true });
// A bare client for the refresh call, so it never triggers the interceptor below.
const bare = axios.create({ baseURL: API_URL, withCredentials: true });

// One refresh at a time: parallel 401s all wait on the same request.
let refreshing: Promise<void> | null = null;

const refreshSession = (): Promise<void> => {
  if (!refreshing) {
    refreshing = bare
      .post('/auth/refresh')
      .then(() => undefined)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
};

const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthCall = AUTH_PATHS.some((p) => original?.url?.includes(p));

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        await refreshSession();
        return api(original);
      } catch {
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      }
    }
    return Promise.reject(error);
  },
);

/** Human-readable message from any thrown error. */
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Can't reach the server. Check that the API is running.";
    const message = (err.response.data as { message?: string } | undefined)?.message;
    if (message) return message;
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Something went wrong. Please try again.';
}

/** Field-level validation errors from the API's Zod middleware, keyed by field. */
export function getFieldErrors(err: unknown): Record<string, string> {
  if (!axios.isAxiosError(err)) return {};
  const errors = (err.response?.data as { errors?: { field: string; message: string }[] } | undefined)?.errors;
  const out: Record<string, string> = {};
  if (Array.isArray(errors)) {
    for (const e of errors) if (e?.field && !out[e.field]) out[e.field] = e.message;
  }
  return out;
}