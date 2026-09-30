export type UserRole = 'ADMIN' | 'PRORAB' | 'OPERATOR' | 'DISPATCHER' | 'ENGINEER';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  roleName: string;
  department: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe: boolean;
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
