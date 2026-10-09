import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, LoginCredentials, AuthState } from '../types/auth';
import { authApi } from '../api/accounts';
import {
  clearAuthTokens,
  getAccessToken,
  onUnauthorized,
  setAuthTokens,
  ApiError,
} from '../api/client';
import { tr } from '../i18n';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_SESSION_KEY = 'ung_auth_user_data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapBackendUserToUser = (u: any): User => {
  const fullName =
    [u.first_name, u.last_name].filter(Boolean).join(' ').trim() ||
    u.employee?.name ||
    u.employee_name ||
    u.username;

  const roleName =
    u.role?.name ||
    u.role_name ||
    (u.is_superuser ? tr('Super Administrator') : u.is_staff ? tr('Tizim Administratori') : tr('Foydalanuvchi'));

  const department =
    u.employee?.position_name ||
    u.department ||
    tr("O'zbekneftgaz AJ Burg'ilash departamenti");

  return {
    id: u.id,
    name: fullName,
    username: u.username,
    email: u.email || '',
    first_name: u.first_name,
    last_name: u.last_name,
    role: u.role?.name || (u.is_superuser ? 'ADMIN' : 'USER'),
    roleName,
    department,
    is_active: u.is_active ?? true,
    is_staff: u.is_staff ?? false,
    is_superuser: u.is_superuser ?? false,
    role_detail: u.role || u.role_detail || null,
    employee_detail: u.employee || u.employee_detail || null,
    permissions: u.permissions || [],
    created_at: u.created_at,
    updated_at: u.updated_at,
    last_login: u.last_login,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Brauzer xotirasidan tezkor yuklash
    const token = getAccessToken();
    const storedUser = localStorage.getItem(USER_SESSION_KEY) || sessionStorage.getItem(USER_SESSION_KEY);
    let user: User | null = null;
    if (storedUser) {
      try {
        user = JSON.parse(storedUser);
      } catch {
        // Ignore JSON error
      }
    }
    return {
      user,
      token,
      isAuthenticated: !!token && !!user,
      isLoading: true,
    };
  });

  const logout = useCallback(() => {
    clearAuthTokens();
    localStorage.removeItem(USER_SESSION_KEY);
    sessionStorage.removeItem(USER_SESSION_KEY);
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userItem = await authApi.me();
      const mappedUser = mapBackendUserToUser(userItem);
      const isRemember = localStorage.getItem(USER_SESSION_KEY) !== null;
      const targetStorage = isRemember ? localStorage : sessionStorage;
      targetStorage.setItem(USER_SESSION_KEY, JSON.stringify(mappedUser));

      setAuthState((prev) => ({
        ...prev,
        user: mappedUser,
        isAuthenticated: true,
        isLoading: false,
      }));
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        logout();
      }
    }
  }, [logout]);

  // Dastlabki yuklanishda sessiyani tekshirish va yangilash
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setAuthState((prev) => ({ ...prev, isLoading: false, isAuthenticated: false }));
      return;
    }

    refreshUser().finally(() => {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    });
  }, [refreshUser]);

  // Token eskirib qayta tiklanmaganda logout qilish
  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      logout();
    });
    return () => {
      unsubscribe();
    };
  }, [logout]);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      const res = await authApi.login(credentials);
      const { access, refresh, user: rawUser } = res;

      // Tokenlarni saqlash
      setAuthTokens({
        access,
        refresh,
        rememberMe: credentials.rememberMe ?? true,
      });

      const mappedUser = mapBackendUserToUser(rawUser);
      const targetStorage = credentials.rememberMe ? localStorage : sessionStorage;
      targetStorage.setItem(USER_SESSION_KEY, JSON.stringify(mappedUser));

      setAuthState({
        user: mappedUser,
        token: access,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true };
    } catch (err) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      if (err instanceof ApiError) {
        if (err.status === 401) {
          return { success: false, error: tr("Kiritilgan login yoki parol noto'g'ri.") };
        }
        return { success: false, error: err.message };
      }
      return { success: false, error: tr('Serverga ulanishda xatolik yuz berdi.') };
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!authState.user) return false;
    if (authState.user.is_superuser) return true;
    return authState.user.permissions?.includes(permission) ?? false;
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, hasPermission, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
