'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Lead Site Reliability Engineer' | 'Infrastructure Platform Admin' | 'Observability Analyst';
  avatar: string;
  organization: string;
  region: string;
}

export const DEMO_USERS: Record<string, UserProfile> = {
  sre: {
    id: 'usr_sre_01',
    name: 'Alex Rivera',
    email: 'a.rivera@acme-infra.internal',
    role: 'Lead Site Reliability Engineer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    organization: 'Acme Cloud Infrastructure',
    region: 'AWS us-east-1a (Primary Cluster)',
  },
  admin: {
    id: 'usr_adm_02',
    name: 'Sarah Chen',
    email: 's.chen@acme-infra.internal',
    role: 'Infrastructure Platform Admin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    organization: 'Acme Cloud Infrastructure',
    region: 'AWS us-east-1a (Primary Cluster)',
  },
};

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  demoLogin: (roleKey: 'sre' | 'admin') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(DEMO_USERS.sre); // Default authenticated for frictionless preview
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Restore stored session if exists
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pulse60_auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setIsAuthenticated(true);
      }
    } catch (_) {}
  }, []);

  const login = useCallback(
    async (email: string): Promise<boolean> => {
      const matched = email.includes('admin') ? DEMO_USERS.admin : DEMO_USERS.sre;
      setUser(matched);
      setIsAuthenticated(true);
      try {
        localStorage.setItem('pulse60_auth_user', JSON.stringify(matched));
      } catch (_) {}
      router.push('/dashboard');
      return true;
    },
    [router]
  );

  const demoLogin = useCallback(
    (roleKey: 'sre' | 'admin') => {
      const selected = DEMO_USERS[roleKey];
      setUser(selected);
      setIsAuthenticated(true);
      try {
        localStorage.setItem('pulse60_auth_user', JSON.stringify(selected));
      } catch (_) {}
      router.push('/dashboard');
    },
    [router]
  );

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('pulse60_auth_user');
    } catch (_) {}
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        demoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
