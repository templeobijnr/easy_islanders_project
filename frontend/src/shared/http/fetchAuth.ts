import { ready, getAccess, refresh, AuthExpiredError } from '../auth/auth';

export async function fetchJsonWithAuth(url: string, init: RequestInit = {}) {
  await ready();
  let token = await getAccess();
  const headers = new Headers(init.headers || {});
  headers.set('Accept', 'application/json');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res = await fetch(url, { ...init, headers, credentials: (init as any).credentials || 'include' });
  if (res.status === 401) {
    let code: string | undefined;
    try { code = (await res.clone().json())?.code; } catch {}
    if (code === 'token_not_valid' && await refresh()) {
      token = await getAccess();
      const headers2 = new Headers(headers);
      if (token) headers2.set('Authorization', `Bearer ${token}`);
      res = await fetch(url, { ...init, headers: headers2, credentials: (init as any).credentials || 'include' });
    }
  }
  if (!res.ok) {
    if (res.status === 401) throw new AuthExpiredError();
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  const ct = res.headers.get('Content-Type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

