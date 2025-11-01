import config from '../../config';
import { getAccessToken, setAccessToken } from '../../auth/tokenStore';

export async function ready(): Promise<void> {
  // Current app hydrates token from localStorage on load; nothing async to wait for.
  // Keep placeholder for future cookie-based auth.
  return Promise.resolve();
}

export async function getAccess(): Promise<string | null> {
  return getAccessToken();
}

export async function refresh(): Promise<boolean> {
  try {
    const refreshToken = localStorage.getItem('refresh');
    if (!refreshToken) return false;
    const url = `${config.API_BASE_URL.replace(/\/$/, '')}/api/token/refresh/`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({}));
    const access = data.access || data.token;
    if (!access) return false;
    setAccessToken(access);
    return true;
  } catch {
    return false;
  }
}

export class AuthExpiredError extends Error {
  constructor(message = 'Authentication expired') {
    super(message);
    this.name = 'AuthExpiredError';
  }
}

