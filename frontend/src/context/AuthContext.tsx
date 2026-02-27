import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi } from '../api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  setUserId: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await authApi.status();
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
        localStorage.removeItem('userId');
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, [checkAuth]);

  const login = async () => {
    const { data } = await authApi.login();
    window.location.href = data.authUrl;
  };

  const logout = async () => {
    await authApi.logout();
    localStorage.removeItem('userId');
    setUser(null);
  };

  const setUserId = (id: string) => {
    localStorage.setItem('userId', id);
    checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        setUserId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
