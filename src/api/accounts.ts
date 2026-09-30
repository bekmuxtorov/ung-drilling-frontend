import { request } from './client';
import type {
  AdminSetPasswordPayload,
  LoginCredentials,
  LoginResponse,
  PermissionItem,
  RefreshResponse,
  RoleItem,
  RolePayload,
  UserCreatePayload,
  UserItem,
  UserUpdatePayload,
} from '../types/auth';
import type { ListParams, Paginated } from './types';

export interface UserListParams extends ListParams {
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  role?: number;
  employee?: number;
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    request<LoginResponse>('POST', '/auth/login/', {
      body: {
        username: credentials.username.trim(),
        password: credentials.password,
      },
    }),

  refresh: (refresh: string) =>
    request<RefreshResponse>('POST', '/auth/token/refresh/', {
      body: { refresh },
    }),

  verify: (token: string) =>
    request<void>('POST', '/auth/token/verify/', {
      body: { token },
    }),

  me: (signal?: AbortSignal) =>
    request<UserItem>('GET', '/auth/me/', { signal }),

  updateMe: (payload: Partial<UserUpdatePayload>) =>
    request<UserItem>('PATCH', '/auth/me/', { body: payload }),

  changePassword: (payload: { old_password: string; new_password: string; new_password_confirm: string }) =>
    request<{ detail?: string }>('POST', '/auth/change-password/', { body: payload }),
};

export const usersApi = {
  list: (params: UserListParams = {}, signal?: AbortSignal) =>
    request<Paginated<UserItem>>('GET', '/auth/users/', { params, signal }),

  retrieve: (id: number, signal?: AbortSignal) =>
    request<UserItem>('GET', `/auth/users/${id}/`, { signal }),

  create: (payload: UserCreatePayload) =>
    request<UserItem>('POST', '/auth/users/', { body: payload }),

  update: (id: number, payload: UserUpdatePayload) =>
    request<UserItem>('PUT', `/auth/users/${id}/`, { body: payload }),

  patch: (id: number, payload: Partial<UserUpdatePayload>) =>
    request<UserItem>('PATCH', `/auth/users/${id}/`, { body: payload }),

  remove: (id: number) =>
    request<void>('DELETE', `/auth/users/${id}/`),

  setPassword: (id: number, payload: AdminSetPasswordPayload) =>
    request<{ detail: string }>('POST', `/auth/users/${id}/set-password/`, { body: payload }),
};

export const rolesApi = {
  list: (params: ListParams = {}, signal?: AbortSignal) =>
    request<Paginated<RoleItem>>('GET', '/auth/roles/', { params, signal }),

  retrieve: (id: number, signal?: AbortSignal) =>
    request<RoleItem>('GET', `/auth/roles/${id}/`, { signal }),

  create: (payload: RolePayload) =>
    request<RoleItem>('POST', '/auth/roles/', { body: payload }),

  update: (id: number, payload: RolePayload) =>
    request<RoleItem>('PUT', `/auth/roles/${id}/`, { body: payload }),

  patch: (id: number, payload: Partial<RolePayload>) =>
    request<RoleItem>('PATCH', `/auth/roles/${id}/`, { body: payload }),

  remove: (id: number) =>
    request<void>('DELETE', `/auth/roles/${id}/`),
};

export const permissionsApi = {
  list: (signal?: AbortSignal) =>
    request<PermissionItem[]>('GET', '/auth/permissions/', { signal }),
};
