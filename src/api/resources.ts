import { request } from './client';
import type { ListParams, OperationStageChoice, Paginated } from './types';

/** DRF ModelViewSet uchun umumiy CRUD mijoz. */
export const createResource = <T, TPayload = Partial<T>>(endpoint: string) => ({
  list: (params: ListParams = {}, signal?: AbortSignal) =>
    request<Paginated<T>>('GET', `/${endpoint}/`, { params, signal }),
  retrieve: (id: number, signal?: AbortSignal) => request<T>('GET', `/${endpoint}/${id}/`, { signal }),
  create: (payload: TPayload) => request<T>('POST', `/${endpoint}/`, { body: payload }),
  update: (id: number, payload: TPayload) => request<T>('PUT', `/${endpoint}/${id}/`, { body: payload }),
  patch: (id: number, payload: Partial<TPayload>) => request<T>('PATCH', `/${endpoint}/${id}/`, { body: payload }),
  remove: (id: number) => request<void>('DELETE', `/${endpoint}/${id}/`),
});

export type ResourceClient<T = unknown> = ReturnType<typeof createResource<T, Record<string, unknown>>>;

export const operationStagesApi = {
  choices: (signal?: AbortSignal) => request<OperationStageChoice[]>('GET', '/operation-stages/', { signal }),
};
