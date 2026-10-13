const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';
const ACCESS_TOKEN_KEY = 'indus_reserve_access_token';

function buildHeaders(init?: RequestInit) {
  const headers = new Headers(init?.headers ?? {});
  headers.set('Content-Type', 'application/json');

  if (typeof window !== 'undefined') {
    const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
    if (accessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  return headers;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: buildHeaders(init)
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const payload = await response.json() as {
        message?: string;
        issues?: Array<{ path?: string; message?: string }>;
      };
      const firstIssue = payload.issues?.[0];
      const issueMessage = firstIssue?.message
        ? firstIssue.path ? `${firstIssue.path}: ${firstIssue.message}` : firstIssue.message
        : '';
      throw new Error(issueMessage || payload.message || `Request failed with ${response.status}`);
    }

    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}
