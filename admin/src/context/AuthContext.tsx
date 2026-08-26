'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { fetchAdminProfile, AdminProfile } from '@/services/api';

export interface AdminUserData {
  id: string;
  email: string;
  name: string;
  role: string;
  photo?: string;
  token?: string;
}

interface AuthContextType {
  user: AdminUserData | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (adminData: { id: string; email: string; role: string; token?: string; name?: string }) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Helper to extract cookie
  const getCookieToken = useCallback(() => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/(?:^|;\s*)admin_token=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
  }, []);

  // Helper to sync cookies and storage
  const syncSession = useCallback((newToken: string | null, userData: AdminUserData | null) => {
    if (typeof window === 'undefined') return;
    if (newToken) {
      document.cookie = `admin_token=${newToken}; path=/; max-age=86400; SameSite=Strict`;
      localStorage.setItem('vibez_admin_token', newToken);
      if (userData) {
        localStorage.setItem('vibez_admin_user', JSON.stringify(userData));
      }
    } else {
      document.cookie = 'admin_token=; path=/; max-age=0; SameSite=Strict';
      localStorage.removeItem('vibez_admin_token');
      localStorage.removeItem('vibez_admin_user');
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await fetchAdminProfile();
      if (profile) {
        setUser((prev) => {
          const updated: AdminUserData = {
            id: profile.id,
            email: profile.email,
            name: profile.name || 'System Admin',
            role: profile.role || 'SuperAdmin',
            photo: profile.photo || '',
            token: prev?.token || token || undefined,
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem('vibez_admin_user', JSON.stringify(updated));
          }
          return updated;
        });
      }
    } catch (err) {
      console.error('Failed to refresh admin profile:', err);
    }
  }, [token]);

  // Initial auth verification on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        let storedToken = localStorage.getItem('vibez_admin_token');
        if (!storedToken) {
          storedToken = getCookieToken();
        }

        if (storedToken) {
          // Verify with backend that this token belongs to an actual Administrator
          try {
            const profile = await fetchAdminProfile();
            if (profile && profile.id && profile.email) {
              const verifiedUser: AdminUserData = {
                id: profile.id,
                email: profile.email,
                name: profile.name || (profile.email.split('@')[0].toUpperCase() === 'ADMIN' ? 'System Administrator' : profile.email.split('@')[0]),
                role: profile.role || 'SuperAdmin',
                photo: profile.photo || '',
                token: storedToken,
              };
              setToken(storedToken);
              setUser(verifiedUser);
              syncSession(storedToken, verifiedUser);
            } else {
              // Token invalid or belongs to a regular/non-admin user
              setToken(null);
              setUser(null);
              syncSession(null, null);
            }
          } catch (error) {
            // Failed verification -> invalidate session
            setToken(null);
            setUser(null);
            syncSession(null, null);
          }
        } else {
          setToken(null);
          setUser(null);
          syncSession(null, null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setToken(null);
        setUser(null);
        syncSession(null, null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [getCookieToken, syncSession]);

  // Route protection guard
  useEffect(() => {
    if (isLoading) return;

    const isLoginRoute = pathname === '/login';

    if (!token && !isLoginRoute) {
      // Unauthenticated user trying to access protected route
      router.push('/login');
    } else if (token && isLoginRoute) {
      // Authenticated user trying to access login page
      router.push('/');
    }
  }, [token, isLoading, pathname, router]);

  const login = (adminData: { id: string; email: string; role: string; token?: string; name?: string }) => {
    const adminToken = adminData.token || 'vibez_valid_admin_token';
    const completeUser: AdminUserData = {
      id: adminData.id,
      email: adminData.email,
      name: adminData.name || (adminData.email.split('@')[0].toUpperCase() === 'ADMIN' ? 'System Administrator' : adminData.email.split('@')[0]),
      role: adminData.role || 'SuperAdmin',
      token: adminToken,
    };

    setToken(adminToken);
    setUser(completeUser);
    syncSession(adminToken, completeUser);
    router.push('/');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    syncSession(null, null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
