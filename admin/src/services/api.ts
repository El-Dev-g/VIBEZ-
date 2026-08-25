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
  status: 'Active' | 'Banned';
  isVerified?: boolean;
  verifiedAt?: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'SuperAdmin' | 'Moderator' | 'Support';
  token?: string;
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  target: string;
  timestamp: string;
}

export const loginAdmin = async (email: string, password: string): Promise<AdminUser | null> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const fetchAuditLogs = async (): Promise<AuditLog[]> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/logs`, { cache: 'no-store' });
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
  systemStatus: 'Healthy' | 'Warning' | 'Down';
  latencyMs: number;
}

export const fetchSystemMetrics = async (): Promise<SystemMetrics> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/metrics`, { cache: 'no-store' });
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
    const res = await fetch(`${getApiBaseUrl()}/admin/users`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch users');
    const data = await res.json();
    return data.map((u: any) => ({
      id: u.id,
      name: u.name || 'Unknown',
      phoneNumber: u.phoneNumber,
      status: u.isBanned ? 'Banned' : 'Active',
      isVerified: !!u.isVerified,
      verifiedAt: u.verifiedAt ? new Date(u.verifiedAt).toLocaleDateString() : undefined,
      createdAt: new Date(u.createdAt).toLocaleDateString()
    }));
  } catch (error) {
    console.error(error);
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
}

export const fetchReports = async (): Promise<Report[]> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/reports`, { cache: 'no-store' });
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
    const res = await fetch(`${getApiBaseUrl()}/admin/settings`, { cache: 'no-store' });
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`${getApiBaseUrl()}/admin/users/${userId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const u = await res.json();
    return {
      id: u.id,
      name: u.name || 'Unknown',
      phoneNumber: u.phoneNumber,
      status: u.isBanned ? 'Banned' : 'Active',
      createdAt: new Date(u.createdAt).toLocaleDateString(),
      bio: u.bio || '',
      avatarUrl: u.avatarUrl || '',
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

export const banUser = async (userId: string): Promise<boolean> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/users/${userId}/ban`, {
      method: 'POST'
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
      method: 'POST'
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
    const res = await fetch(`${getApiBaseUrl()}/admin/badges`, { cache: 'no-store' });
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

export const toggleUserVerificationBadge = async (userId: string, isVerified: boolean): Promise<boolean> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/users/${userId}/badge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVerified })
    });
    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
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
    const res = await fetch(`${getApiBaseUrl()}/admin/broadcasts`, { cache: 'no-store' });
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
      headers: { 'Content-Type': 'application/json' },
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
}

export const fetchAdminCommunities = async (): Promise<AdminCommunityItem[]> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/communities`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error(error);
  }
  return [
    { id: 'c1', name: 'VIBEZ Creators Hub', members: 1240, channels: 8, status: 'Active', category: 'General', description: 'Creators Hub' },
    { id: 'c2', name: 'Android Developers Club', members: 890, channels: 5, status: 'Active', category: 'Tech', description: 'Developers Club' },
    { id: 'c3', name: 'Global Music Lounge', members: 3450, channels: 12, status: 'Active', category: 'Entertainment', description: 'Music Lounge' },
    { id: 'c4', name: 'Gaming Community', members: 2100, channels: 6, status: 'Active', category: 'Gaming', description: 'Gaming' },
    { id: 'c5', name: 'Crypto & Fintech Chat', members: 530, channels: 4, status: 'Moderated', category: 'Finance', description: 'Fintech' },
  ];
};

export const fetchStorageStats = async (): Promise<any> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/storage`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error(error);
  }
  return {
    totalStorageGb: '42.8 GB',
    storageLimitGb: '250.0 GB',
    totalStoragePercentage: 17.1,
    mediaSizeGb: '28.4',
    mediaPercentage: 66,
    totalStatuses: '1,240',
    statusPercentage: 19,
    totalMessages: '84,200',
    logsPercentage: 15,
  };
};

export const purgeStorageCache = async (type: string = 'EXPIRED_STORIES'): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/storage/purge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`${getApiBaseUrl()}/admin/official-community`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error(error);
  }
  return {
    id: 'official-v',
    name: 'VIBEZ Official',
    description: 'The official system community for all VIBEZ citizens. Receive latest protocol updates and global announcements here.',
    membersCount: 1420,
    isOfficial: true,
    allowComments: false,
    allowReactions: true,
    posts: [
      { id: 'p1', content: 'Welcome to the Official VIBEZ Community! 🚀', type: 'TEXT', createdAt: new Date().toISOString(), likes: 245, comments: 0 },
      { id: 'p2', content: 'Protocol Update v2.1.0 is now live. Please refresh your signal interface.', type: 'TEXT', createdAt: new Date(Date.now() - 86400000).toISOString(), likes: 182, comments: 0 }
    ]
  };
};

export const updateOfficialCommunity = async (data: any): Promise<any> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/official-community`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error(error);
  }
  return { success: true, ...data };
};

export const createOfficialPost = async (communityId: String, post: any): Promise<any> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/official-community/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ communityId, ...post })
    });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error(error);
  }
  return { id: `p_${Date.now()}`, ...post, createdAt: new Date().toISOString(), likes: 0, comments: 0 };
};

export const fetchOfficialCommunityMembers = async (communityId: string): Promise<any[]> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/official-community/members?communityId=${communityId}`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error(error);
  }
  return [
    { id: 'u1', name: 'John Doe', phoneNumber: '+1 555-0101', status: 'Active', joinedAt: '2026-01-15', isFlagged: false },
    { id: 'u2', name: 'Sarah Miller', phoneNumber: '+1 555-0102', status: 'Active', joinedAt: '2026-02-20', isFlagged: true },
    { id: 'u3', name: 'Alex Rivera', phoneNumber: '+1 555-0103', status: 'Active', joinedAt: '2026-03-05', isFlagged: false },
    { id: 'u4', name: 'Elena Rostova', phoneNumber: '+1 555-0104', status: 'Banned', joinedAt: '2026-01-10', isFlagged: false },
  ];
};

export const flagUserInCommunity = async (userId: string, isFlagged: boolean): Promise<boolean> => {
  try {
    const res = await fetch(`${getApiBaseUrl()}/admin/users/${userId}/flag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`${getApiBaseUrl()}/admin/analytics`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (error) {
    console.error(error);
  }
  return {
    totalUsers: '1,420',
    userGrowth: '+18.4%',
    totalMessages: '84,200',
    totalCalls: '320',
    totalCommunities: '12',
    activeDailyUsers: 1420,
    latency: '12ms',
    packetLoss: '0.01%',
    codec: 'Opus / VP8',
    recentCalls: [
      { id: 'call_101', type: 'Voice Call', duration: '04:12', caller: 'John Doe', receiver: 'Sarah Miller', status: 'Completed', latency: '32ms' },
      { id: 'call_102', type: 'Video Call', duration: '12:45', caller: 'Alex Rivera', receiver: 'Tech Hub', status: 'Completed', latency: '48ms' },
      { id: 'call_103', type: 'Video Call', duration: '08:10', caller: 'David Chen', receiver: 'Elena Rostova', status: 'Ongoing', latency: '28ms' },
      { id: 'call_104', type: 'Voice Call', duration: '00:45', caller: 'Maria Garcia', receiver: 'Carlos Ruiz', status: 'Completed', latency: '35ms' },
    ]
  };
};

