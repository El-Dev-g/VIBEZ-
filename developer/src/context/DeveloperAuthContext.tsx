'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface DeveloperUser {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: 'Owner' | 'Admin' | 'Developer' | 'Viewer';
  primarySdk: 'Kotlin' | 'TypeScript' | 'Python' | 'Go';
  avatar?: string;
  tier?: string;
  monthlyLimit?: number;
  currentRequests?: number;
  createdAt: string;
  hasCompletedOnboarding: boolean;
}

export interface DeveloperKey {
  id: string;
  name: string;
  keyType: 'api_key' | 'client_secret';
  keyPrefix: string;
  maskedKey: string;
  rawKey: string;
  clientId?: string;
  clientSecret?: string;
  environment: 'sandbox' | 'production';
  sdkTarget: 'Kotlin' | 'TypeScript' | 'Python' | 'Go' | 'Universal';
  scopes: string[];
  createdAt: string;
  lastUsedAt: string;
  requestsCount: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Developer' | 'Viewer' | 'Billing';
  status: 'active' | 'pending';
  joinedAt: string;
  avatar: string;
}

interface DeveloperAuthContextType {
  user: DeveloperUser | null;
  token: string | null;
  keys: DeveloperKey[];
  members: TeamMember[];
  isLoading: boolean;
  error: string | null;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, org: string, sdk: 'Kotlin' | 'TypeScript' | 'Python' | 'Go', password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  completeOnboarding: (org: string, primarySdk: 'Kotlin' | 'TypeScript' | 'Python' | 'Go', projectName: string) => Promise<void>;
  createKey: (data: {
    name: string;
    keyType: 'api_key' | 'client_secret';
    environment: 'sandbox' | 'production';
    sdkTarget: 'Kotlin' | 'TypeScript' | 'Python' | 'Go' | 'Universal';
    scopes: string[];
  }) => Promise<DeveloperKey | null>;
  revokeKey: (id: string) => Promise<void>;
  inviteMember: (email: string, name: string, role: 'Admin' | 'Developer' | 'Viewer' | 'Billing') => void;
  removeMember: (id: string) => void;
}

const DeveloperAuthContext = createContext<DeveloperAuthContextType | undefined>(undefined);

export const DeveloperAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<DeveloperUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [keys, setKeys] = useState<DeveloperKey[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restore authenticated session from storage & verify with backend
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const savedToken = localStorage.getItem('vibez_dev_token');
        const savedUser = localStorage.getItem('vibez_dev_user');
        const savedKeys = localStorage.getItem('vibez_dev_keys');
        const savedMembers = localStorage.getItem('vibez_dev_members');

        if (savedToken) {
          setToken(savedToken);
        }

        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            setUser(null);
          }
        }

        if (savedKeys) {
          try {
            setKeys(JSON.parse(savedKeys));
          } catch {
            setKeys([]);
          }
        }

        if (savedMembers) {
          try {
            setMembers(JSON.parse(savedMembers));
          } catch {
            setMembers([]);
          }
        }

        // Verify session live against server if token exists
        if (savedToken) {
          try {
            const res = await fetch('/api/developer/auth/me', {
              headers: { 'Authorization': `Bearer ${savedToken}` }
            });
            if (res.ok) {
              const data = await res.json();
              if (data.user) {
                setUser(data.user);
                localStorage.setItem('vibez_dev_user', JSON.stringify(data.user));
              }
              if (data.keys && Array.isArray(data.keys)) {
                setKeys(data.keys);
                localStorage.setItem('vibez_dev_keys', JSON.stringify(data.keys));
              }
            }
          } catch (fetchErr) {
            console.warn('Session verification fallback to local state:', fetchErr);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/developer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.error || 'Authentication failed. Please verify your credentials.';
        setError(errorMsg);
        setIsLoading(false);
        return { success: false, error: errorMsg };
      }

      setUser(data.user);
      setToken(data.token);
      if (data.keys && Array.isArray(data.keys)) {
        setKeys(data.keys);
        localStorage.setItem('vibez_dev_keys', JSON.stringify(data.keys));
      }
      localStorage.setItem('vibez_dev_token', data.token);
      localStorage.setItem('vibez_dev_user', JSON.stringify(data.user));

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Network error occurred during login.';
      setError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
    }
  }, []);

  const register = useCallback(async (
    name: string,
    email: string,
    org: string,
    sdk: 'Kotlin' | 'TypeScript' | 'Python' | 'Go',
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/developer/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          organization: org.trim(),
          primarySdk: sdk,
          password
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.error || 'Registration failed. Please check your inputs.';
        setError(errorMsg);
        setIsLoading(false);
        return { success: false, error: errorMsg };
      }

      setUser(data.user);
      setToken(data.token);
      if (data.keys && Array.isArray(data.keys)) {
        setKeys(data.keys);
        localStorage.setItem('vibez_dev_keys', JSON.stringify(data.keys));
      }
      localStorage.setItem('vibez_dev_token', data.token);
      localStorage.setItem('vibez_dev_user', JSON.stringify(data.user));

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Network error during registration.';
      setError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setKeys([]);
    localStorage.removeItem('vibez_dev_token');
    localStorage.removeItem('vibez_dev_user');
    localStorage.removeItem('vibez_dev_keys');
  }, []);

  const completeOnboarding = useCallback(async (
    org: string,
    primarySdk: 'Kotlin' | 'TypeScript' | 'Python' | 'Go',
    projectName: string
  ) => {
    if (!user) return;
    const updated: DeveloperUser = {
      ...user,
      organization: org,
      primarySdk,
      hasCompletedOnboarding: true,
    };
    setUser(updated);
    localStorage.setItem('vibez_dev_user', JSON.stringify(updated));

    // Request new API key from backend or create real key
    try {
      const res = await fetch('/api/developer/auth/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          name: `${projectName} Primary Key`,
          environment: 'sandbox',
          sdkTarget: primarySdk,
          scopes: ['messages:write', 'rtc:signaling', 'system:telemetry']
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          const updatedKeys = [data.data];
          setKeys(updatedKeys);
          localStorage.setItem('vibez_dev_keys', JSON.stringify(updatedKeys));
          return;
        }
      }
    } catch (e) {
      console.warn('Backend key generation fallback:', e);
    }

    // Fallback key creation
    const prefix = `vbz_sbx_${primarySdk.toLowerCase().substring(0, 2)}_`;
    const rand = Math.random().toString(36).substring(2, 14);
    const initialKey: DeveloperKey = {
      id: `key_${Date.now()}`,
      name: `${projectName} Primary Key`,
      keyType: 'api_key',
      keyPrefix: prefix,
      maskedKey: `${prefix}••••••••••••••••••••${rand.slice(-4)}`,
      rawKey: `${prefix}${rand}`,
      environment: 'sandbox',
      sdkTarget: primarySdk,
      scopes: ['messages:write', 'rtc:signaling', 'system:telemetry'],
      createdAt: new Date().toISOString().split('T')[0],
      lastUsedAt: 'Never',
      requestsCount: 0,
    };
    const updatedKeys = [initialKey];
    setKeys(updatedKeys);
    localStorage.setItem('vibez_dev_keys', JSON.stringify(updatedKeys));
  }, [user, token]);

  const createKey = useCallback(async (data: {
    name: string;
    keyType: 'api_key' | 'client_secret';
    environment: 'sandbox' | 'production';
    sdkTarget: 'Kotlin' | 'TypeScript' | 'Python' | 'Go' | 'Universal';
    scopes: string[];
  }): Promise<DeveloperKey | null> => {
    try {
      const res = await fetch('/api/developer/auth/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          const newKey: DeveloperKey = result.data;
          const updated = [newKey, ...keys.filter(k => k.id !== newKey.id)];
          setKeys(updated);
          localStorage.setItem('vibez_dev_keys', JSON.stringify(updated));
          return newKey;
        }
      }
    } catch (err) {
      console.warn('Error calling API key endpoint:', err);
    }

    const envPrefix = data.environment === 'production' ? 'live' : 'test';
    const sdkPrefix = (data.sdkTarget || 'Universal').toLowerCase().substring(0, 2);
    const keyPrefix = data.keyType === 'client_secret' ? `vbz_clt_${sdkPrefix}_` : `vbz_${envPrefix}_${sdkPrefix}_`;
    const randomHash = Math.random().toString(36).substring(2, 14) + Math.random().toString(36).substring(2, 14);
    const rawKey = `${keyPrefix}${randomHash}`;

    const newKey: DeveloperKey = {
      id: `key_${Date.now()}`,
      name: data.name,
      keyType: data.keyType,
      keyPrefix,
      maskedKey: `${keyPrefix}••••••••••••••••••••${randomHash.slice(-4)}`,
      rawKey,
      clientId: data.keyType === 'client_secret' ? `vbz_client_${Math.random().toString(36).substring(2, 10)}` : undefined,
      clientSecret: data.keyType === 'client_secret' ? `vbz_secret_${Math.random().toString(36).substring(2, 18)}` : undefined,
      environment: data.environment,
      sdkTarget: data.sdkTarget,
      scopes: data.scopes,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsedAt: 'Just created',
      requestsCount: 0,
    };

    const updated = [newKey, ...keys.filter(k => k.id !== newKey.id)];
    setKeys(updated);
    localStorage.setItem('vibez_dev_keys', JSON.stringify(updated));
    return newKey;
  }, [keys, token]);

  const revokeKey = useCallback(async (id: string) => {
    try {
      await fetch(`/api/developer/keys/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
    } catch (e) {
      console.warn('Revoke key network request error:', e);
    }
    const updated = keys.filter(k => k.id !== id);
    setKeys(updated);
    localStorage.setItem('vibez_dev_keys', JSON.stringify(updated));
  }, [keys, token]);

  const inviteMember = useCallback((email: string, name: string, role: 'Admin' | 'Developer' | 'Viewer' | 'Billing') => {
    const newMember: TeamMember = {
      id: `mem_${Date.now()}`,
      name: name || email.split('@')[0],
      email,
      role,
      status: 'pending',
      joinedAt: new Date().toISOString().split('T')[0],
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };
    const updated = [...members, newMember];
    setMembers(updated);
    localStorage.setItem('vibez_dev_members', JSON.stringify(updated));
  }, [members]);

  const removeMember = useCallback((id: string) => {
    const updated = members.filter(m => m.id !== id);
    setMembers(updated);
    localStorage.setItem('vibez_dev_members', JSON.stringify(updated));
  }, [members]);

  return (
    <DeveloperAuthContext.Provider
      value={{
        user,
        token,
        keys,
        members,
        isLoading,
        error,
        login,
        register,
        logout,
        completeOnboarding,
        createKey,
        revokeKey,
        inviteMember,
        removeMember,
      }}
    >
      {children}
    </DeveloperAuthContext.Provider>
  );
};

export const useDeveloperAuth = () => {
  const context = useContext(DeveloperAuthContext);
  if (!context) {
    throw new Error('useDeveloperAuth must be used within DeveloperAuthProvider');
  }
  return context;
};
