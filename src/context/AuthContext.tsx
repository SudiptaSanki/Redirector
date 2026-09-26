import React, { createContext, useContext, useEffect, useState } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  turnstileSiteKey: string;
  loginWithOAuth: (provider: 'github' | 'google') => void;
  devLogin: (role: 'USER' | 'ADMIN') => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('1x00000000000000000000AA');

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.turnstileSiteKey) {
          setTurnstileSiteKey(data.turnstileSiteKey);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn('Could not fetch user session:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const loginWithOAuth = (provider: 'github' | 'google') => {
    window.location.href = `/api/auth/${provider}`;
  };

  const devLogin = async (role: 'USER' | 'ADMIN') => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        await refreshUser();
      }
    } catch (err) {
      console.error('Dev login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, turnstileSiteKey, loginWithOAuth, devLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
