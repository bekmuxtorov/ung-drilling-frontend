import { tr } from '../i18n';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

const STORAGE_ACCESS_KEY = 'ung_access_token';
const STORAGE_REFRESH_KEY = 'ung_refresh_token';

// Avtorizatsiya bekor bo'lganda (masalan token eskirsa) xabar berish uchun
const unauthorizedListeners = new Set<() => void>();

export const onUnauthorized = (callback: () => void) => {
  unauthorizedListeners.add(callback);
  return () => {
    unauthorizedListeners.delete(callback);
  };
};

const notifyUnauthorized = () => {
  unauthorizedListeners.forEach((cb) => {
    try {
      cb();
    } catch {
      // Ignore listener error
    }
  });
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem(STORAGE_ACCESS_KEY) || sessionStorage.getItem(STORAGE_ACCESS_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(STORAGE_REFRESH_KEY) || sessionStorage.getItem(STORAGE_REFRESH_KEY);
};

export const setAuthTokens = (tokens: { access: string; refresh?: string; rememberMe?: boolean }) => {
  const isRemember = tokens.rememberMe ?? (localStorage.getItem(STORAGE_ACCESS_KEY) !== null || true);
  const targetStorage = isRemember ? localStorage : sessionStorage;
  const otherStorage = isRemember ? sessionStorage : localStorage;

  targetStorage.setItem(STORAGE_ACCESS_KEY, tokens.access);
  if (tokens.refresh) {
    targetStorage.setItem(STORAGE_REFRESH_KEY, tokens.refresh);
  }

  // Boshqa storagedan tozalash (ziddiyat bo'lmasligi uchun)
  otherStorage.removeItem(STORAGE_ACCESS_KEY);
  otherStorage.removeItem(STORAGE_REFRESH_KEY);
};

export const clearAuthTokens = () => {
  localStorage.removeItem(STORAGE_ACCESS_KEY);
  localStorage.removeItem(STORAGE_REFRESH_KEY);
  sessionStorage.removeItem(STORAGE_ACCESS_KEY);
  sessionStorage.removeItem(STORAGE_REFRESH_KEY);
};

/** Backenddan kelgan xatolik. `fieldErrors` DRF validatsiya xatolarini maydonlar bo'yicha saqlaydi. */
export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export const buildUrl = (path: string, params?: QueryParams) => {
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });
  const qs = query.toString();
  return `${cleanBase}${cleanPath}${qs ? `?${qs}` : ''}`;
};

const flattenMessage = (value: unknown): string => {
  if (Array.isArray(value)) return value.map(flattenMessage).join(' ');
  if (value && typeof value === 'object') return Object.values(value).map(flattenMessage).join(' ');
  return String(value ?? '');
};

const parseError = async (response: Response): Promise<ApiError> => {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Javob JSON emas
  }

  const fieldErrors: Record<string, string> = {};
  let message = '';

  if (body && typeof body === 'object' && !Array.isArray(body)) {
    Object.entries(body as Record<string, unknown>).forEach(([key, value]) => {
      if (key === 'detail' || key === 'non_field_errors') {
        message = flattenMessage(value);
      } else {
        fieldErrors[key] = flattenMessage(value);
      }
    });
  }

  if (!message) {
    if (Object.keys(fieldErrors).length) message = tr("Kiritilgan ma'lumotlarda xatolik bor");
    else if (response.status === 404) message = tr("Ma'lumot topilmadi");
    else if (response.status === 403 || response.status === 401) message = tr("Ushbu amal uchun ruxsat yo'q yoki sessiya tugagan");
    else if (response.status >= 500) message = tr('Serverda ichki xatolik yuz berdi');
    else message = tr("So'rov bajarilmadi ({0})", response.status);
  }

  return new ApiError(response.status, message, fieldErrors);
};

// Bir vaqtning o'zida bir nechta so'rov uchun yagona refresh jarayoni
let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(buildUrl('/auth/token/refresh/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refresh }),
      });

      if (!response.ok) {
        clearAuthTokens();
        notifyUnauthorized();
        return null;
      }

      const data = (await response.json()) as { access: string };
      setAuthTokens({ access: data.access });
      return data.access;
    } catch {
      clearAuthTokens();
      notifyUnauthorized();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  options: { params?: QueryParams; body?: unknown; signal?: AbortSignal; retryOnUnauthorized?: boolean } = {},
): Promise<T> {
  const { retryOnUnauthorized = true } = options;
  const token = getAccessToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.params), {
      method,
      signal: options.signal,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, "Server bilan aloqa o'rnatilmadi. Tarmoqni tekshiring.");
  }

  // Token eskirgan bo'lsa (401), avtomatik refresh qilib qayta urinish
  const isAuthEndpoint = path.includes('/auth/login/') || path.includes('/auth/token/refresh/');
  if (response.status === 401 && retryOnUnauthorized && !isAuthEndpoint) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      return request<T>(method, path, { ...options, retryOnUnauthorized: false });
    }
  }

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
