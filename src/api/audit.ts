import { request } from './client';
import type { Paginated } from './types';
import type { AuditLog, AuditLogListParams } from '../types/audit';

export const auditLogsApi = {
  list: (params: AuditLogListParams = {}, signal?: AbortSignal) =>
    request<Paginated<AuditLog>>('GET', '/audit-logs/', { params, signal }),

  retrieve: (id: number, signal?: AbortSignal) =>
    request<AuditLog>('GET', `/audit-logs/${id}/`, { signal }),
};
