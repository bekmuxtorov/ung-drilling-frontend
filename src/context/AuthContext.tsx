import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, LoginCredentials, AuthState } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo Database of valid users matching UNG drilling roles
const MOCK_USERS: Record<string, { pass: string; user: User }> = {
  admin: {
    pass: 'Admin@123',
    user: {
      id: 'usr-001',
      name: 'Aliyev Jasur Shavkatovich',
      username: 'admin',
      role: 'ADMIN',
      roleName: 'Tizim Administratori',
      department: 'Axborot-kommunikatsiya texnologiyalari departamenti',
      email: 'j.aliyev@ung.uz',
      phone: '+998 (90) 123-45-67',
    },
  },
  prorab: {
    pass: 'Prorab@123',
    user: {
      id: 'usr-002',
      name: 'Karimov Rustam Baxtiyorovich',
      username: 'prorab',
      role: 'PRORAB',
      roleName: "Burg'ilash bosh prorabi",
      department: "Muborak burg'ilash ishlari boshqarmasi",
      email: 'r.karimov@ung.uz',
      phone: '+998 (97) 234-56-78',
    },
  },
  operator: {
    pass: 'Operator@123',
    user: {
      id: 'usr-003',
      name: 'Saidov Jamshid Akmalovich',
      username: 'operator',
      role: 'OPERATOR',
      roleName: "Burg'ilash uskunasi katta operatori",
      department: "Sho'rtan konlar majmuasi",
      email: 'j.saidov@ung.uz',
      phone: '+998 (99) 345-67-89',
    },
  },
};

const STORAGE_KEY = 'ung_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Restore session
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.token && parsed?.user) {
          setAuthState({
            user: parsed.user,
            token: parsed.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }
    } catch {
      // Ignore parse errors
    }
    setAuthState((prev) => ({ ...prev, isLoading: false }));
  }, []);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    // Simulate enterprise backend network roundtrip latency (800ms)
    await new Promise((r) => setTimeout(r, 850));

    const cleanUsername = credentials.username.trim().toLowerCase();
    const matchedAccount = MOCK_USERS[cleanUsername];

    // Check credentials or allow demo passwords
    if (matchedAccount && matchedAccount.pass === credentials.password) {
      const fakeToken = `ung_jwt_${cleanUsername}_${Date.now()}`;
      const sessionData = {
        user: matchedAccount.user,
        token: fakeToken,
      };

      if (credentials.rememberMe) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
        localStorage.removeItem(STORAGE_KEY);
      }

      setAuthState({
        user: matchedAccount.user,
        token: fakeToken,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true };
    }

    setAuthState((prev) => ({ ...prev, isLoading: false }));
    return { success: false, error: 'INVALID_CREDENTIALS' };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
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
