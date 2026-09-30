const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

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

const buildUrl = (path: string, params?: QueryParams) => {
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });
  const qs = query.toString();
  return `${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`;
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
    if (Object.keys(fieldErrors).length) message = "Kiritilgan ma'lumotlarda xatolik bor";
    else if (response.status === 404) message = "Ma'lumot topilmadi";
    else if (response.status === 403 || response.status === 401) message = "Ushbu amal uchun ruxsat yo'q";
    else if (response.status >= 500) message = 'Serverda ichki xatolik yuz berdi';
    else message = `So'rov bajarilmadi (${response.status})`;
  }

  return new ApiError(response.status, message, fieldErrors);
};

export async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  options: { params?: QueryParams; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.params), {
      method,
      signal: options.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, "Server bilan aloqa o'rnatilmadi. Tarmoqni tekshiring.");
  }

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
