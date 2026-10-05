export type AuditAction = 'create' | 'update' | 'delete';

export interface AuditLogUserShort {
  id: number;
  username: string;
  full_name: string;
}

export interface AuditLogChangeItem {
  old?: unknown;
  new?: unknown;
  [key: string]: unknown;
}

export interface AuditLog {
  id: number;
  user: number | null;
  user_detail: AuditLogUserShort | null;
  username: string;
  user_full_name: string;
  ip_address: string | null;
  mac_address: string;
  user_agent: string;
  action: AuditAction;
  action_display: string;
  app_label: string;
  model_name: string;
  object_id: string;
  object_repr: string;
  changes: Record<string, AuditLogChangeItem | unknown> | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditLogListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  action?: AuditAction;
  app_label?: string;
  model_name?: string;
  object_id?: string;
  user?: number;
  username?: string;
  ip_address?: string;
  mac_address?: string;
  date_from?: string;
  date_to?: string;
  [key: string]: string | number | boolean | null | undefined;
}
