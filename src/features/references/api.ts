import { createResource } from '../../api/resources';
import type { AnyRow, ReferenceKey } from './config';
import { REFERENCE_MAP } from './config';

const clients = new Map<ReferenceKey, ReturnType<typeof createResource<AnyRow, Record<string, unknown>>>>();

export const getReferenceApi = (key: ReferenceKey) => {
  let client = clients.get(key);
  if (!client) {
    client = createResource<AnyRow, Record<string, unknown>>(REFERENCE_MAP[key].endpoint);
    clients.set(key, client);
  }
  return client;
};

export interface Option {
  value: string;
  label: string;
}

const optionsCache = new Map<ReferenceKey, Promise<Option[]>>();

/** Select uchun bog'langan ma'lumotnomaning barcha yozuvlarini sahifalab yuklaydi (kesh bilan). */
export const loadOptions = (key: ReferenceKey): Promise<Option[]> => {
  const cached = optionsCache.get(key);
  if (cached) return cached;

  const promise = (async () => {
    const api = getReferenceApi(key);
    const options: Option[] = [];
    for (let page = 1; page <= 50; page += 1) {
      const data = await api.list({ page, page_size: 200, ordering: 'name' });
      options.push(...data.results.map((row) => ({ value: String(row.id), label: row.name })));
      if (!data.next) break;
    }
    return options;
  })();

  optionsCache.set(key, promise);
  promise.catch(() => optionsCache.delete(key));
  return promise;
};

export const invalidateOptions = (key: ReferenceKey) => optionsCache.delete(key);
