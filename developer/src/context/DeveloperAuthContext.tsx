'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface DeveloperUser {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: 'Owner' | 'Admin' | 'Developer' | 'Viewer';
  primarySdk: 'Kotlin' | 'TypeScript' | 'Python' | 'Go';
  avatar?: string;
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
  keys: DeveloperKey[];
  members: TeamMember[];
  login: (email: string, name?: string) => void;
  register: (name: string, email: string, org: string, sdk: 'Kotlin' | 'TypeScript' | 'Python' | 'Go') => void;
  logout: () => void;
  completeOnboarding: (org: string, primarySdk: 'Kotlin' | 'TypeScript' | 'Python' | 'Go', projectName: string) => void;
  createKey: (data: {
    name: string;
    keyType: 'api_key' | 'client_secret';
    environment: 'sandbox' | 'production';
    sdkTarget: 'Kotlin' | 'TypeScript' | 'Python' | 'Go' | 'Universal';
    scopes: string[];
  }) => DeveloperKey;
  revokeKey: (id: string) => void;
  inviteMember: (email: string, name: string, role: 'Admin' | 'Developer' | 'Viewer' | 'Billing') => void;
  removeMember: (id: string) => void;
}

const DeveloperAuthContext = createContext<DeveloperAuthContextType | undefined>(undefined);

const DEFAULT_USER: DeveloperUser = {
  id: 'dev_usr_0192a',
  name: 'Developer Account',
  email: 'developer@prigid.com',
  organization: 'Primary Organization',
  role: 'Owner',
  primarySdk: 'Kotlin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  createdAt: new Date().toISOString().split('T')[0],
  hasCompletedOnboarding: true,
};

const INITIAL_KEYS: DeveloperKey[] = [];

const INITIAL_MEMBERS: TeamMember[] = [];

export const DeveloperAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<DeveloperUser | null>(null);
  const [keys, setKeys] = useState<DeveloperKey[]>(INITIAL_KEYS);
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);

  useEffect(() => {
    // Load from local storage
    const savedUser = localStorage.getItem('vibez_dev_user');
    const savedKeys = localStorage.getItem('vibez_dev_keys');
    const savedMembers = localStorage.getItem('vibez_dev_members');

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(DEFAULT_USER);
      }
    } else {
      // Default to standard logged-in user for immediate discovery, or start fresh
      setUser(DEFAULT_USER);
    }

    if (savedKeys) {
      try {
        setKeys(JSON.parse(savedKeys));
      } catch {
        setKeys(INITIAL_KEYS);
      }
    }

    if (savedMembers) {
      try {
        setMembers(JSON.parse(savedMembers));
      } catch {
        setMembers(INITIAL_MEMBERS);
      }
    }
  }, []);

  const login = (email: string, name?: string) => {
    const existing = user && user.email === email ? user : {
      id: `dev_${Date.now()}`,
      name: name || email.split('@')[0].replace('.', ' '),
      email,
      organization: 'PRIGID Developer Org',
      role: 'Admin' as const,
      primarySdk: 'Kotlin' as const,
      createdAt: new Date().toISOString().split('T')[0],
      hasCompletedOnboarding: true,
    };
    setUser(existing);
    localStorage.setItem('vibez_dev_user', JSON.stringify(existing));
  };

  const register = (name: string, email: string, org: string, sdk: 'Kotlin' | 'TypeScript' | 'Python' | 'Go') => {
    const newUser: DeveloperUser = {
      id: `dev_${Date.now()}`,
      name,
      email,
      organization: org,
      role: 'Owner',
      primarySdk: sdk,
      createdAt: new Date().toISOString().split('T')[0],
      hasCompletedOnboarding: false, // will trigger onboarding flow
    };
    setUser(newUser);
    localStorage.setItem('vibez_dev_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vibez_dev_user');
  };

  const completeOnboarding = (org: string, primarySdk: 'Kotlin' | 'TypeScript' | 'Python' | 'Go', projectName: string) => {
    if (!user) return;
    const updated: DeveloperUser = {
      ...user,
      organization: org,
      primarySdk,
      hasCompletedOnboarding: true,
    };
    setUser(updated);
    localStorage.setItem('vibez_dev_user', JSON.stringify(updated));

    // Generate initial single sandbox/live key
    const prefix = `vbz_sbx_${primarySdk.toLowerCase().substring(0, 2)}_`;
    const rand = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
    const initialKey: DeveloperKey = {
      id: `key_${Date.now()}`,
      name: `${projectName} Primary Key`,
      keyType: 'api_key',
      keyPrefix: prefix,
      maskedKey: `${prefix}••••••••••••••••••••${rand.slice(-4)}`,
      rawKey: `${prefix}${rand}`,
      environment: 'sandbox',
      sdkTarget: primarySdk,
      scopes: ['messages:write', 'auth:otp', 'system:telemetry'],
      createdAt: new Date().toISOString().split('T')[0],
      lastUsedAt: 'Never',
      requestsCount: 0,
    };
    const updatedKeys = [initialKey];
    setKeys(updatedKeys);
    localStorage.setItem('vibez_dev_keys', JSON.stringify(updatedKeys));
  };

  const createKey = (data: {
    name: string;
    keyType: 'api_key' | 'client_secret';
    environment: 'sandbox' | 'production';
    sdkTarget: 'Kotlin' | 'TypeScript' | 'Python' | 'Go' | 'Universal';
    scopes: string[];
  }) => {
    const envPrefix = data.environment === 'production' ? 'live' : 'test';
    const sdkPrefix = data.sdkTarget.toLowerCase().substring(0, 2);
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

    // Single API Key Policy across application: replace existing key
    const updated = [newKey];
    setKeys(updated);
    localStorage.setItem('vibez_dev_keys', JSON.stringify(updated));
    return newKey;
  };

  const revokeKey = (id: string) => {
    const updated = keys.filter(k => k.id !== id);
    setKeys(updated);
    localStorage.setItem('vibez_dev_keys', JSON.stringify(updated));
  };

  const inviteMember = (email: string, name: string, role: 'Admin' | 'Developer' | 'Viewer' | 'Billing') => {
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
  };

  const removeMember = (id: string) => {
    const updated = members.filter(m => m.id !== id);
    setMembers(updated);
    localStorage.setItem('vibez_dev_members', JSON.stringify(updated));
  };

  return (
    <DeveloperAuthContext.Provider
      value={{
        user,
        keys,
        members,
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
