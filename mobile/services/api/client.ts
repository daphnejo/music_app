const DEFAULT_API_BASE_URL = 'https://solfedjio-backend-mlfe.onrender.com';
const REQUEST_TIMEOUT_MS = 30_000;

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

  const controller = new AbortController();
  let timedOut = false;
  const upstreamSignal = options.signal;
  const abortFromUpstream = () => controller.abort();

  if (upstreamSignal?.aborted) {
    controller.abort();
  } else {
    upstreamSignal?.addEventListener('abort', abortFromUpstream, { once: true });
  }

  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  const url = `${API_BASE_URL}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (cause) {
    if (__DEV__) {
      const detail = cause instanceof Error
        ? `${cause.name}: ${cause.message}`
        : String(cause);
      console.warn('[D-Solfedjio API] Network request failed', {
        url,
        method: options.method ?? 'GET',
        detail,
        timedOut,
        aborted: !!upstreamSignal?.aborted,
      });
    }

    if (timedOut) {
      throw new ApiError(0, 'Server javobi kutilganidan uzoq davom etdi. Qayta urinib ko‘ring.', 'timeout');
    }
    if (upstreamSignal?.aborted) {
      throw new ApiError(0, 'So‘rov bekor qilindi.', 'aborted');
    }
    throw new ApiError(0, 'Server bilan aloqa qilib bo‘lmadi. Internetni tekshiring.', 'network');
  } finally {
    clearTimeout(timeout);
    upstreamSignal?.removeEventListener('abort', abortFromUpstream);
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
