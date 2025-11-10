// Lightweight token store with change notifications.
// Keeps backward compatibility with existing 'token' key
// while exposing getAccessToken/setAccessToken expected by imports.

let inMemory = null;
const listeners = new Set();

export const onAccessTokenChange = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const setAccessToken = (t) => {
  inMemory = t;
  if (t) {
    try { localStorage.setItem('access_token', t); } catch (_) {}
    try { localStorage.setItem('token', t); } catch (_) {}
  } else {
    try { localStorage.removeItem('access_token'); } catch (_) {}
    try { localStorage.removeItem('token'); } catch (_) {}
  }
  listeners.forEach((cb) => { try { cb(t); } catch (_) {} });
};

export const getAccessToken = () => {
  if (inMemory) return inMemory;
  const t = localStorage.getItem('access_token') || localStorage.getItem('token');
  if (t) inMemory = t;
  return t;
};

export const clearAccessToken = () => setAccessToken(null);

/**
 * Refresh the access token using the refresh token from cookies.
 * This is used by WebSocket to get a fresh token before connecting.
 *
 * @returns {Promise<string|null>} Fresh access token or null if refresh failed
 */
export const refreshAccessToken = async () => {
  try {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
    const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
      method: 'POST',
      credentials: 'include', // Send refresh cookie
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('[TokenStore] Token refresh failed:', response.status);
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.access || data.access_token;

    if (newAccessToken) {
      setAccessToken(newAccessToken);
      return newAccessToken;
    }

    return null;
  } catch (err) {
    console.error('[TokenStore] Token refresh error:', err);
    return null;
  }
};

// Backward-compatible aliases
export const getToken = getAccessToken;
export const setToken = setAccessToken;
