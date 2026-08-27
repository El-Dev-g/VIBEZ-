const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    return '/api';
  }
  const port = process.env.PORT || '8000';
  return `http://127.0.0.1:${port}/api`;
};

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  googleEmail?: string;
  avatarUrl?: string;
  authProvider?: string;
  about?: string;
  status: 'Active' | 'Banned';
  isVerified?: boolean;
  verifiedAt?: string;
  createdAt: string;
  lastSeen?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'SuperAdmin' | 'Moderator' | 'Support' | 'SUPERADMIN';
  name?: string;
  token?: string;
}

export interface LoginResponse {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  token?: string;
  twoFactorEnabled?: boolean;
  requires2FA?: boolean;
  error?: string;
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  target: string;
  timestamp: string;
}

export const getAdminHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    let token = localStorage.getItem('vibez_admin_token');
    if (!token) {
      try {
        const storedUser = localStorage.getItem('vibez_admin_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed?.token) token = parsed.token;
        }
      } catch (e) {}
    }
    if (!token && typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)admin_token=([^;]*)/);
      if (match) token = decodeURIComponent(match[1]);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

export const loginAdmin = async (email: string, password: string, twoFactorCode?: string): Promise<LoginResponse | null> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, twoFactorCode })
    });
    const data = await res.json();
    if (!res.ok) {
      return { 
        error: data.error || 'Access Denied: You do not have administrator permissions.',
        requires2FA: data.requires2FA || false
      };
    }
    return data;
  } catch (error) {
    console.error(error);
    return { error: 'Unable to connect to authorization server. Please try again.' };
  }
};

export const toggleTwoFactor = async (enabled: boolean): Promise<{ success?: boolean; twoFactorEnabled?: boolean; message?: string; error?: string }> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/2fa/toggle`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ enabled })
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || 'Failed to update 2FA status' };
    return data;
  } catch (e: any) {
    return { error: 'Failed to update 2FA status' };
  }
};

export const fetchSecurityHealth = async (): Promise<any> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/security/health`, {
      headers: getAdminHeaders()
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
};

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  photo: string;
  role: string;
  twoFactorEnabled: boolean;
}

export interface AdminSession {
  id: string;
  device: string;
  ip: string;
  location: string;
  current: boolean;
}

export const fetchAdminProfile = async (): Promise<AdminProfile | null> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/profile`, {
      headers: getAdminHeaders(),
      cache: 'no-store'
    });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error(error);
  }
  return null;
};

export const updateAdminProfile = async (data: { name: string; email: string; role?: string; photo?: string }): Promise<AdminProfile | null> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/profile`, {
      method: 'PUT',
      headers: getAdminHeaders(),
      body: JSON.stringify(data)
    });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error(error);
  }
  return null;
};

export const changeAdminPassword = async (current: string, newKey: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/change-password`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ current, new: newKey })
    });
    if (res.ok) return await res.json();
    const data = await res.json();
    return { success: false, error: data.error || 'Password change failed' };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Network error changing password' };
  }
};

export const fetchAdminSessions = async (): Promise<AdminSession[]> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/sessions`, {
      headers: getAdminHeaders(),
      cache: 'no-store'
    });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error(error);
  }
  return [];
};

export const revokeAdminSession = async (sessionId: string): Promise<boolean> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: getAdminHeaders()
    });
    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const fetchAuditLogs = async (): Promise<AuditLog[]> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/logs`, { 
      headers: getAdminHeaders(),
      cache: 'no-store' 
    });
    if (!res.ok) throw new Error('Failed to fetch logs');
    const data = await res.json();
    return data.map((l: any) => ({
      id: l.id,
      adminEmail: l.adminEmail,
      action: l.action,
      target: l.target,
      timestamp: new Date(l.timestamp).toLocaleString()
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};

export interface SystemMetrics {
  activeUsers: number;
  totalChats: number;
  totalMessages: number;
  pendingReports: number;
  totalCommunities?: number;
  totalCalls?: number;
  totalRevenue?: number;
  verifiedUsers?: number;
  systemStatus: 'Healthy' | 'Warning' | 'Down';
  latencyMs: number;
}

export const fetchSystemMetrics = async (): Promise<SystemMetrics> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/metrics`, { 
      headers: getAdminHeaders(),
      cache: 'no-store' 
    });
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return await res.json();
  } catch (error) {
    console.error(error);
    return {
      activeUsers: 0,
      totalChats: 0,
      totalMessages: 0,
      pendingReports: 0,
      systemStatus: 'Down',
      latencyMs: 0
    };
  }
};

export const fetchUsers = async (): Promise<User[]> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/users`, { 
      headers: getAdminHeaders(),
      cache: 'no-store' 
    });
    if (!res.ok) {
      console.warn(`fetchUsers failed with status ${res.status}`);
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((u: any) => ({
      id: u.id,
      name: u.name || (u.googleEmail ? u.googleEmail.split('@')[0] : 'Citizen'),
      phoneNumber: u.phoneNumber || u.googleEmail || 'No Signal Info',
      googleEmail: u.googleEmail || undefined,
      avatarUrl: u.avatarUrl || undefined,
      authProvider: u.authProvider || (u.googleEmail ? 'GOOGLE' : 'PHONE'),
      about: u.about || undefined,
      status: u.isBanned ? 'Banned' : 'Active',
      isVerified: Boolean(u.isVerified),
      verifiedAt: u.verifiedAt ? new Date(u.verifiedAt).toLocaleDateString() : undefined,
      createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recent',
      lastSeen: u.lastSeen ? new Date(u.lastSeen).toLocaleString() : undefined
    }));
  } catch (error) {
    console.error('Error in fetchUsers:', error);
    return [];
  }
};

export interface Report {
  id: string;
  reporterName: string;
  reportedUserName: string;
  reason: string;
  status: 'Pending' | 'Resolved' | 'Dismissed';
  timestamp: string;
}

export interface SystemSettings {
  id?: string;
  allowNewRegistrations: boolean;
  maintenanceMode: boolean;
  maxGroupSize: number;
  retentionDays: number;
  verificationBadgePrice: number;
  appDownloadUrl?: string;
  appVersion?: string;
  appName?: string;
  contactEmail?: string;
  contactPhone?: string;
  supportAddress?: string;
}

export const fetchReports = async (): Promise<Report[]> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/reports`, { 
      headers: getAdminHeaders(),
      cache: 'no-store' 
    });
    if (!res.ok) throw new Error('Failed to fetch reports');
    const data = await res.json();
    return data.map((r: any) => ({
      id: r.id,
      reporterName: r.reporterName || 'Unknown',
      reportedUserName: r.reportedUserName || 'Unknown',
      reason: r.reason,
      status: r.status.charAt(0) + r.status.slice(1).toLowerCase(),
      timestamp: new Date(r.createdAt).toLocaleString()
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const fetchSettings = async (): Promise<SystemSettings> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/settings`, { 
      headers: getAdminHeaders(),
      cache: 'no-store' 
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof window !== 'undefined') {
        localStorage.setItem('vibez_system_settings', JSON.stringify(data));
      }
      return data;
    }
  } catch (error) {
    console.error('fetchSettings error:', error);
  }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('vibez_system_settings');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
  }

  return {
    allowNewRegistrations: true,
    maintenanceMode: false,
    maxGroupSize: 1024,
    retentionDays: 90,
    verificationBadgePrice: 3.00
  };
};

export const updateSettings = async (settings: Partial<SystemSettings>): Promise<SystemSettings | null> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/settings`, {
      method: 'PATCH',
      headers: getAdminHeaders(),
      body: JSON.stringify(settings),
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof window !== 'undefined') {
        localStorage.setItem('vibez_system_settings', JSON.stringify(data));
      }
      return data;
    }
  } catch (error) {
    console.error('updateSettings PATCH error:', error);
  }

  try {
    const resPost = await fetch(`${getApiBaseUrl()}/admin/settings`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(settings),
      cache: 'no-store'
    });
    if (resPost.ok) {
      const data = await resPost.json();
      if (typeof window !== 'undefined') {
        localStorage.setItem('vibez_system_settings', JSON.stringify(data));
      }
      return data;
    }
  } catch (error) {
    console.error('updateSettings POST error:', error);
  }

  if (typeof window !== 'undefined') {
    const current = await fetchSettings();
    const merged = { ...current, ...settings } as SystemSettings;
    localStorage.setItem('vibez_system_settings', JSON.stringify(merged));
    return merged;
  }

  return null;
};

export interface UserDetails extends User {
  bio?: string;
  avatarUrl?: string;
  lastSeen?: string;
  sentMessagesCount?: number;
  chatsCount?: number;
  reportsReceivedCount?: number;
}

export const fetchUserById = async (userId: string): Promise<UserDetails | null> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/users/${userId}`, { 
      headers: getAdminHeaders(),
      cache: 'no-store' 
    });
    if (!res.ok) return null;
    const u = await res.json();
    return {
      id: u.id,
      name: u.name || (u.googleEmail ? u.googleEmail.split('@')[0] : 'Citizen'),
      phoneNumber: u.phoneNumber || u.googleEmail || 'No Signal Info',
      googleEmail: u.googleEmail || undefined,
      avatarUrl: u.avatarUrl || undefined,
      authProvider: u.authProvider || (u.googleEmail ? 'GOOGLE' : 'PHONE'),
      about: u.about || '',
      status: u.isBanned ? 'Banned' : 'Active',
      isVerified: Boolean(u.isVerified),
      verifiedAt: u.verifiedAt ? new Date(u.verifiedAt).toLocaleDateString() : undefined,
      createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recent',
      bio: u.about || '',
      lastSeen: u.lastSeen ? new Date(u.lastSeen).toLocaleString() : 'Never',
      sentMessagesCount: u._count?.sentMessages || 0,
      chatsCount: u._count?.chats || 0,
      reportsReceivedCount: u._count?.reportsReceived || 0,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const toggleUserVerificationBadge = async (userId: string, isVerified: boolean): Promise<boolean> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/users/${userId}/badge`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ isVerified })
    });
    return res.ok;
  } catch (error) {
    console.error('toggleUserVerificationBadge error:', error);
    return false;
  }
};

export const banUser = async (userId: string): Promise<boolean> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/users/${userId}/ban`, {
      method: 'POST',
      headers: getAdminHeaders()
    });
    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const unbanUser = async (userId: string): Promise<boolean> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/users/${userId}/unban`, {
      method: 'POST',
      headers: getAdminHeaders()
    });
    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAdminHeaders()
    });
    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export interface BadgePaymentRecord {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  paymentProvider: string;
  transactionId: string;
  rawReceipt?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    phoneNumber: string;
    isVerified: boolean;
    avatarUrl?: string;
  };
}

export interface BadgeSummary {
  payments: BadgePaymentRecord[];
  totalRevenue: number;
  totalPurchases: number;
  verifiedUsersCount: number;
  verificationBadgePrice: number;
}

export const fetchBadgePayments = async (): Promise<BadgeSummary> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/badges`, { 
      headers: getAdminHeaders(),
      cache: 'no-store' 
    });
    if (!res.ok) throw new Error('Failed to fetch badge payments');
    const data = await res.json();
    return {
      payments: data.payments.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt).toLocaleString()
      })),
      totalRevenue: data.totalRevenue || 0,
      totalPurchases: data.totalPurchases || 0,
      verifiedUsersCount: data.verifiedUsersCount || 0,
      verificationBadgePrice: data.verificationBadgePrice ?? 3.00
    };
  } catch (error) {
    console.error(error);
    return { payments: [], totalRevenue: 0, totalPurchases: 0, verifiedUsersCount: 0, verificationBadgePrice: 3.00 };
  }
};


export interface BroadcastItem {
  id: string;
  title: string;
  message: string;
  targetAudience: string;
  sentBy: string;
  sentAt: string;
}

export const fetchBroadcasts = async (): Promise<BroadcastItem[]> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/broadcasts`, { 
      headers: getAdminHeaders(),
      cache: 'no-store' 
    });
    if (!res.ok) throw new Error('Failed to fetch broadcasts');
    const data = await res.json();
    return data.map((item: any) => ({
      ...item,
      sentAt: new Date(item.sentAt).toLocaleString()
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const sendBroadcastApi = async (title: string, message: string, targetAudience: string): Promise<{ success: boolean; recipientCount?: number; message?: string }> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/broadcasts`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ title, message, targetAudience })
    });
    if (!res.ok) return { success: false };
    return await res.json();
  } catch (error) {
    console.error(error);
    return { success: false };
  }
};

export interface AdminCommunityItem {
  id: string;
  name: string;
  description: string;
  category: string;
  members: number;
  channels: number;
  status: string;
  isOfficial?: boolean;
}

export const fetchAdminCommunities = async (): Promise<AdminCommunityItem[]> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/communities`, { 
      headers: getAdminHeaders(),
      cache: 'no-store' 
    });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error(error);
  }
  return [];
};

export const createOfficialCommunity = async (name: string, description: string): Promise<any> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/communities/official`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ name, description })
    });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error(error);
  }
  return null;
};

export const fetchOfficialCommunities = async (): Promise<AdminCommunityItem[]> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/official-communities`, { 
      headers: getAdminHeaders(),
      cache: 'no-store' 
    });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error(error);
  }
  return [];
};

export const toggleOfficialStatus = async (communityId: string, isOfficial: boolean): Promise<boolean> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/communities/${communityId}/official`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ isOfficial })
    });
    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const deleteCommunity = async (communityId: string): Promise<boolean> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/communities/${communityId}`, {
      method: 'DELETE',
      headers: getAdminHeaders()
    });
    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const fetchStorageStats = async (): Promise<any> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/storage`, { 
      headers: getAdminHeaders(),
      cache: 'no-store' 
    });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error(error);
  }
  return {
    totalStorageGb: '0.0 GB',
    storageLimitGb: '250.0 GB',
    totalStoragePercentage: 0,
    mediaSizeGb: '0.0',
    mediaPercentage: 0,
    totalStatuses: '0',
    statusPercentage: 0,
    totalMessages: '0',
    logsPercentage: 0,
  };
};

export const purgeStorageCache = async (type: string = 'EXPIRED_STORIES'): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/storage/purge`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ type })
    });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error(error);
  }
  return { success: true, message: 'Simulation: Cache purged successfully.' };
};

export const fetchOfficialCommunity = async (): Promise<any> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/official-community`, { 
      headers: getAdminHeaders(),
      cache: 'no-store' 
    });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error(error);
  }
  return null;
};

export const updateOfficialCommunity = async (data: any): Promise<any> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/official-community`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(data)
    });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error(error);
  }
  return null;
};

export const createOfficialPost = async (communityId: string, postData: any): Promise<any> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/communities/${communityId}/posts`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(postData)
    });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error(error);
  }
  return null;
};

export const fetchOfficialCommunityMembers = async (communityId: string): Promise<any[]> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/communities/${communityId}/members`, { 
      headers: getAdminHeaders(),
      cache: 'no-store' 
    });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error(error);
  }
  return [];
};

export const updateCommunityMemberRole = async (communityId: string, userId: string, role: string): Promise<boolean> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/communities/${communityId}/members/${userId}/role`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ role })
    });
    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const addCommunityMember = async (communityId: string, userId: string, role: string = 'MEMBER'): Promise<boolean> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/communities/${communityId}/members`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ userId, role })
    });
    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const flagUserInCommunity = async (userId: string, isFlagged: boolean): Promise<boolean> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/users/${userId}/flag`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ isFlagged })
    });
    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const fetchAnalytics = async (): Promise<any> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/analytics`, { 
      headers: getAdminHeaders(),
      cache: 'no-store' 
    });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error(error);
  }
  return null;
};

export interface PaymentProvider {
  id: string;
  name: string;
  isEnabled: boolean;
  config: any;
  isConfigured?: boolean;
  isTested?: boolean;
  testStatus?: 'SUCCESS' | 'FAILED' | 'UNTESTED' | 'NOT_CONFIGURED';
  lastTestedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  providerRef: string;
  metadata: any;
  createdAt: string;
  user?: {
    name: string;
    phoneNumber: string;
  };
}

export const fetchPaymentProviders = async (): Promise<PaymentProvider[]> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/payments/providers`, { headers: getAdminHeaders() });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error(error);
  }
  return [];
};

export const updatePaymentProvider = async (id: string, data: any): Promise<{ provider?: PaymentProvider; error?: string }> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/payments/providers/${id}`, {
      method: 'PATCH',
      headers: getAdminHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (res.ok) return { provider: result };
    return { error: result.error || 'Failed to update payment provider' };
  } catch (error: any) {
    console.error(error);
    return { error: error?.message || 'Network error updating provider' };
  }
};

export const testPaymentCredentials = async (id: string, name?: string, config?: any): Promise<{ success: boolean; message?: string; error?: string; livemode?: boolean }> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/payments/providers/${id}/test`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ name, config })
    });
    const data = await res.json();
    return data;
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error?.message || 'Connection timeout while testing credentials' };
  }
};

export const fetchPaymentTransactions = async (): Promise<PaymentTransaction[]> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/payments/transactions`, { headers: getAdminHeaders() });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error(error);
  }
  return [];
};

