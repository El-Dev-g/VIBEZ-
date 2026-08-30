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
  updateKey: (id: string, data: {
    name?: string;
    scopes?: string[];
    environment?: 'sandbox' | 'production';
    sdkTarget?: 'Kotlin' | 'TypeScript' | 'Python' | 'Go' | 'Universal';
    rotateSecret?: boolean;
  }) => Promise<DeveloperKey | null>;
  revokeKey: (id: string) => Promise<void>;
  inviteMember: (email: string, name: string, role: 'Admin' | 'Developer' | 'Viewer' | 'Billing') => void;
  updateMember: (id: string, data: { name?: string; role?: 'Admin' | 'Developer' | 'Viewer' | 'Billing'; status?: 'active' | 'pending' }) => void;
  removeMember: (id: string) => void;
}

const DeveloperAuthContext = createContext<DeveloperAuthContextType | undefined>(undefined);

const DEFAULT_MEMBERS: TeamMember[] = [
  {
    id: 'mem_1',
    name: 'Sarah Chen',
    email: 'sarah.c@prigid.com',
    role: 'Admin',
    status: 'active',
    joinedAt: '2026-07-15',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'mem_2',
    name: 'Alex Rivera',
    email: 'a.rivera@prigid.com',
    role: 'Developer',
    status: 'active',
    joinedAt: '2026-08-01',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'mem_3',
    name: 'Elena Rostova',
    email: 'elena@partner.io',
    role: 'Viewer',
    status: 'pending',
    joinedAt: '2026-08-20',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
];

const DEFAULT_KEYS: DeveloperKey[] = [
  {
    id: 'key_prod_master',
    name: 'Production Master API Key',
    keyType: 'api_key',
    keyPrefix: 'vbz_live_ko_',
    maskedKey: 'vbz_live_ko_••••••••••••••••••••7a8b',
    rawKey: 'vbz_live_ko_9824fbc001824a77e092471829a7b',
    environment: 'production',
    sdkTarget: 'Kotlin',
    scopes: ['openid', 'profile', 'email', 'messages:write', 'messages:read', 'auth:otp', 'calls:signaling', 'system:telemetry'],
    createdAt: '2026-08-01',
    lastUsedAt: '2 mins ago',
    requestsCount: 142850,
  },
  {
    id: 'key_sandbox_client',
    name: 'Client Credentials Testing Key',
    keyType: 'client_secret',
    keyPrefix: 'vbz_clt_ts_',
    maskedKey: 'vbz_clt_ts_••••••••••••••••••••99c1',
    rawKey: 'vbz_clt_ts_87834190bcae2847ff11048299c1',
    clientId: 'vbz_client_sbx_90248f',
    clientSecret: 'vbz_secret_a1b2c3d4e5f60718293a4b5c6d',
    environment: 'sandbox',
    sdkTarget: 'TypeScript',
    scopes: ['openid', 'profile', 'email', 'phone', 'offline_access', 'messages:write', 'calls:signaling'],
    createdAt: '2026-08-10',
    lastUsedAt: '1 hour ago',
    requestsCount: 4210,
  },
];

export const DeveloperAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<DeveloperUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [keys, setKeys] = useState<DeveloperKey[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restore authenticated session from storage & fetch keys
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
            const parsed = JSON.parse(savedKeys);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setKeys(parsed);
            } else {
              setKeys(DEFAULT_KEYS);
            }
          } catch {
            setKeys(DEFAULT_KEYS);
          }
        } else {
          setKeys(DEFAULT_KEYS);
        }

        if (savedMembers) {
          try {
            const parsedMembers = JSON.parse(savedMembers);
            if (Array.isArray(parsedMembers) && parsedMembers.length > 0) {
              setMembers(parsedMembers);
            } else {
              setMembers(DEFAULT_MEMBERS);
            }
          } catch {
            setMembers(DEFAULT_MEMBERS);
          }
        } else {
          setMembers(DEFAULT_MEMBERS);
        }

        // Try backend key fetch
        try {
          const res = await fetch('/api/developer/auth/keys');
          if (res.ok) {
            const data = await res.json();
            if (data.data && Array.isArray(data.data) && data.data.length > 0) {
              setKeys(data.data);
              localStorage.setItem('vibez_dev_keys', JSON.stringify(data.data));
            }
          }
        } catch {
          // Fallback to local
        }
      } catch (err: any) {
        console.error('Error initializing developer auth context:', err);
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
    localStorage.removeItem('vibez_dev_token');
    localStorage.removeItem('vibez_dev_user');
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
          scopes: ['openid', 'profile', 'email', 'messages:write', 'rtc:signaling', 'system:telemetry']
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          const updatedKeys = [data.data, ...keys.filter(k => k.id !== data.data.id)];
          setKeys(updatedKeys);
          localStorage.setItem('vibez_dev_keys', JSON.stringify(updatedKeys));
          return;
        }
      }
    } catch (e) {
      console.warn('Backend key generation fallback:', e);
    }
  }, [user, token, keys]);

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

  const updateKey = useCallback(async (id: string, data: {
    name?: string;
    scopes?: string[];
    environment?: 'sandbox' | 'production';
    sdkTarget?: 'Kotlin' | 'TypeScript' | 'Python' | 'Go' | 'Universal';
    rotateSecret?: boolean;
  }): Promise<DeveloperKey | null> => {
    try {
      const res = await fetch('/api/developer/auth/keys', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ id, ...data }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          const updatedKey = result.data;
          const updated = keys.map((k) => (k.id === id ? updatedKey : k));
          setKeys(updated);
          localStorage.setItem('vibez_dev_keys', JSON.stringify(updated));
          return updatedKey;
        }
      }
    } catch (err) {
      console.warn('Error updating key:', err);
    }

    // Local fallback update
    const updated = keys.map((k) => {
      if (k.id !== id) return k;
      let newRawKey = k.rawKey;
      let newMaskedKey = k.maskedKey;
      let newClientSecret = k.clientSecret;

      if (data.rotateSecret) {
        const rand = Math.random().toString(36).substring(2, 14) + Math.random().toString(36).substring(2, 14);
        newRawKey = `${k.keyPrefix}${rand}`;
        newMaskedKey = `${k.keyPrefix}••••••••••••••••••••${rand.slice(-4)}`;
        if (k.keyType === 'client_secret') {
          newClientSecret = `vbz_secret_${Math.random().toString(36).substring(2, 18)}`;
        }
      }

      return {
        ...k,
        name: data.name !== undefined ? data.name : k.name,
        scopes: data.scopes !== undefined ? data.scopes : k.scopes,
        environment: data.environment !== undefined ? data.environment : k.environment,
        sdkTarget: data.sdkTarget !== undefined ? data.sdkTarget : k.sdkTarget,
        rawKey: newRawKey,
        maskedKey: newMaskedKey,
        clientSecret: newClientSecret,
      };
    });

    setKeys(updated);
    localStorage.setItem('vibez_dev_keys', JSON.stringify(updated));
    return updated.find((k) => k.id === id) || null;
  }, [keys, token]);

  const revokeKey = useCallback(async (id: string) => {
    try {
      await fetch(`/api/developer/auth/keys?id=${id}`, {
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
    const updated = [newMember, ...members];
    setMembers(updated);
    localStorage.setItem('vibez_dev_members', JSON.stringify(updated));
  }, [members]);

  const updateMember = useCallback((id: string, data: { name?: string; role?: 'Admin' | 'Developer' | 'Viewer' | 'Billing'; status?: 'active' | 'pending' }) => {
    const updated = members.map((m) => {
      if (m.id !== id) return m;
      return {
        ...m,
        name: data.name !== undefined ? data.name : m.name,
        role: data.role !== undefined ? data.role : m.role,
        status: data.status !== undefined ? data.status : m.status,
      };
    });
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
        updateKey,
        revokeKey,
        inviteMember,
        updateMember,
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
