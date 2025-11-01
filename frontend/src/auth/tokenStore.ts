/**
 * Token Storage Utility
 *
 * Single source of truth for access token storage.
 * This abstraction allows us to switch storage mechanisms
 * (localStorage → HttpOnly cookies) without changing call sites.
 *
 * Usage:
 *   setAccessToken(token) - Store token
 *   getAccessToken()      - Retrieve current token
 *   clearAccessToken()    - Remove token (logout)
 */

let inMemoryToken: string | null = null;

type AuthListener = (token: string | null) => void;
const listeners = new Set<AuthListener>();

export function onAccessTokenChange(listener: AuthListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setAccessToken(token: string | null): void {
  inMemoryToken = token;
  if (token) {
    localStorage.setItem('access_token', token);
    // Legacy support - some code still checks 'token'
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
  }
  // Notify subscribers
  try {
    listeners.forEach((fn) => fn(token));
  } catch {}
}

export function getAccessToken(): string | null {
  // Prioritize in-memory token (survives refresh)
  if (inMemoryToken) return inMemoryToken;

  // Fallback to localStorage for page refresh
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  if (token) {
    inMemoryToken = token; // Hydrate in-memory cache
  }
  return token;
}

export function clearAccessToken(): void {
  inMemoryToken = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('token');
  localStorage.removeItem('threadId');
  localStorage.removeItem('x_request_id');
  localStorage.removeItem('traceparent');
}

/**
 * Future: Switch to HttpOnly cookies
 *
 * When backend sets cookies, update as follows:
 *
 * 1. Backend adds Set-Cookie header:
 *    Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Lax
 *
 * 2. Frontend enables credentials:
 *    axios.defaults.withCredentials = true;
 *
 * 3. Replace this module:
 *    - setAccessToken() → no-op (cookie set by backend)
 *    - getAccessToken() → null (no need to read, sent automatically)
 *    - clearAccessToken() → POST /api/auth/logout/ (backend clears cookie)
 */
