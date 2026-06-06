export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: HeadersInit;
  next?: unknown;
  skipAuthRefresh?: boolean;
};

export class ApiError extends Error {
  status: number;
  body?: string;

  constructor(message: string, status: number, body?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, '');

export const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8100/api');
export const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

let pendingRefreshRequest: Promise<boolean> | null = null;

// Backward-compatible no-op helpers. Auth now uses httpOnly cookies, not localStorage.
export function getAccessToken() {
  return null;
}

export function setAccessToken(_token: string) {
  // Token is set by the backend as an httpOnly cookie on /auth/login/ and /auth/refresh/.
}

export function clearAccessToken() {
  // Cookies are cleared by the backend on /auth/logout/.
}

async function refreshAuthCookie(): Promise<boolean> {
  if (!pendingRefreshRequest) {
    pendingRefreshRequest = fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        pendingRefreshRequest = null;
      });
  }
  return pendingRefreshRequest;
}

function shouldTryRefresh(endpoint: string, status: number, options: ApiRequestOptions) {
  if (status !== 401 || options.skipAuthRefresh) return false;
  if (typeof window === 'undefined') return false;
  return !endpoint.startsWith('/auth/login')
    && !endpoint.startsWith('/auth/register')
    && !endpoint.startsWith('/auth/refresh')
    && !endpoint.startsWith('/auth/logout');
}

function redirectToLogin() {
  if (typeof window === 'undefined') return;
  if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
    window.location.href = '/login';
  }
}

async function rawApiFetch(endpoint: string, options: ApiRequestOptions = {}) {
  const { method = 'GET', body, headers, next } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const hasJsonBody = body !== undefined && !isFormData;
  const requestBody = hasJsonBody ? JSON.stringify(body) : body;
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  return fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
    method,
    headers: {
      ...(hasJsonBody ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: requestBody as BodyInit | undefined,
    credentials: 'include',
    next,
  } as RequestInit & { next?: unknown });
}

export async function apiFetch<TResponse>(endpoint: string, options: ApiRequestOptions = {}): Promise<TResponse> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let response = await rawApiFetch(normalizedEndpoint, options);

  if (!response.ok && shouldTryRefresh(normalizedEndpoint, response.status, options)) {
    const refreshed = await refreshAuthCookie();
    if (refreshed) {
      response = await rawApiFetch(normalizedEndpoint, { ...options, skipAuthRefresh: true });
    }
  }

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 401) {
      redirectToLogin();
    }
    throw new ApiError(text || 'API request failed', response.status, text);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}
