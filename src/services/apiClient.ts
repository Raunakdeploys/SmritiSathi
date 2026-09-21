import { auth } from '../firebase';

export const API_BASE_URL: string = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export interface AuthMeResponse {
  authenticated: boolean;
  uid?: string;
  email?: string;
  name?: string;
  picture?: string;
  error?: string;
  code?: string;
}

/**
 * Returns authorization headers with Firebase ID Token if user is authenticated
 */
export async function getAuthHeaders(forceRefresh = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken(forceRefresh);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch (err) {
    console.warn('[apiClient] Failed to obtain Firebase ID token:', err);
  }

  return headers;
}

/**
 * Robust fetch wrapper connecting to backend API (on Render, Vercel, or local)
 */
export async function apiFetch<T = any>(
  endpoint: string,
  init?: RequestInit,
  requireAuth = false
): Promise<T> {
  const normalizedPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const targetUrl = API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;

  const authHeaders = await getAuthHeaders();
  const mergedHeaders = {
    ...authHeaders,
    ...(init?.headers as Record<string, string> || {}),
  };

  if (requireAuth && !mergedHeaders['Authorization']) {
    throw new Error('User is not authenticated. Cannot perform this request.');
  }

  const response = await fetch(targetUrl, {
    ...init,
    headers: mergedHeaders,
  });

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: response.statusText };
    }
    const error = new Error(errorData?.error || `API request failed with status ${response.status}`);
    (error as any).status = response.status;
    (error as any).data = errorData;
    throw error;
  }

  return response.json();
}

/**
 * Verifies the current Firebase ID token against backend Firebase Admin SDK
 */
export async function verifyAuthWithBackend(): Promise<AuthMeResponse> {
  return apiFetch<AuthMeResponse>('/api/auth/me', { method: 'GET' });
}
