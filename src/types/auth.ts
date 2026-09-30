export type UserRole = 'ADMIN' | 'PRORAB' | 'OPERATOR' | 'DISPATCHER' | 'ENGINEER' | string;

export interface BackendRoleShort {
  id: number;
  name: string;
}

export interface BackendEmployeeShort {
  id: number;
  name: string;
  phone_number?: string;
  position?: number | null;
  position_name?: string | null;
}

export interface User {
  id: string | number;
  name: string;
  username: string;
  role: UserRole;
  roleName: string;
  department: string;
  email?: string;
  phone?: string;
  avatar?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  role_detail?: BackendRoleShort | null;
  employee_detail?: BackendEmployeeShort | null;
  permissions?: string[];
  created_at?: string;
  updated_at?: string;
  last_login?: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_superuser: boolean;
    is_staff: boolean;
    role: BackendRoleShort | null;
    employee: BackendEmployeeShort | null;
    permissions: string[];
    created_at: string;
    updated_at: string;
  };
}

export interface RefreshResponse {
  access: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type SupportedLanguage = 'uz' | 'oz' | 'ru' | 'en';

export interface QuickPreset {
  label: string;
  role: UserRole;
  username: string;
  password: string;
  description: string;
}

// ============================================================================
// Rollar va Foydalanuvchilar spravochnigi turlari (Accounts API)
// ============================================================================

export interface PermissionItem {
  id: number;
  name: string;
  codename: string;
  app_label: string;
  model: string;
}

export interface RoleItem {
  id: number;
  name: string;
  permissions: number[];
  permissions_detail?: PermissionItem[];
  created_at?: string;
  updated_at?: string;
}

export interface RolePayload {
  name: string;
  permissions: number[];
}

export interface UserItem {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  employee: number | null;
  employee_name?: string | null;
  employee_detail?: BackendEmployeeShort | null;
  role: number | null;
  role_name?: string | null;
  role_detail?: BackendRoleShort | null;
  permissions?: string[];
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface UserCreatePayload {
  username: string;
  password: string;
  password_confirm: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  employee?: number | null;
  role?: number | null;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
}

export interface UserUpdatePayload {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  employee?: number | null;
  role?: number | null;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
}

export interface AdminSetPasswordPayload {
  new_password: string;
  new_password_confirm: string;
}
