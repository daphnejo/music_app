const DEFAULT_API_BASE_URL = 'https://solfedjio-backend-mlfe.onrender.com';
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = 'error',
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiOptions = Omit<RequestInit, 'body'> & { body?: unknown };

let accessToken: string | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setApiAccessToken(token: string | null) {
  accessToken = token;
}

export function setApiRefreshHandler(handler: (() => Promise<string | null>) | null) {
  refreshHandler = handler;
}

async function request<T>(path: string, options: ApiOptions = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    accept: 'application/json',
    ...(options.body !== undefined ? { 'content-type': 'application/json' } : {}),
    ...((options.headers ?? {}) as Record<string, string>),
  };
  if (token) headers.authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, 'Server bilan aloqa qilib bo‘lmadi. Internetni tekshiring.', 'network');
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = data?.error ?? {};
    throw new ApiError(response.status, error.message ?? `API xatosi: ${response.status}`, error.code ?? 'error');
  }
  return data as T;
}

export function publicApiRequest<T>(path: string, options?: ApiOptions): Promise<T> {
  return request<T>(path, options);
}

export async function apiRequest<T>(path: string, options?: ApiOptions, retried = false): Promise<T> {
  try {
    return await request<T>(path, options, accessToken);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || retried || !refreshHandler) throw error;

    if (!refreshPromise) {
      refreshPromise = refreshHandler().finally(() => {
        refreshPromise = null;
      });
    }
    const newToken = await refreshPromise;
    if (!newToken) throw error;
    return apiRequest<T>(path, options, true);
  }
}
