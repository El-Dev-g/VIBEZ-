const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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
    const res = await fetch(`${API_BASE_URL}/admin/login`, {
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
    const res = await fetch(`${API_BASE_URL}/admin/logs`);
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
    const res = await fetch(`${API_BASE_URL}/admin/metrics`);
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
    const res = await fetch(`${API_BASE_URL}/admin/users`);
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
  allowNewRegistrations: boolean;
  maintenanceMode: boolean;
  maxGroupSize: number;
  retentionDays: number;
}

export const fetchReports = async (): Promise<Report[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/reports`);
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
    const res = await fetch(`${API_BASE_URL}/admin/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return await res.json();
  } catch (error) {
    console.error(error);
    return {
      allowNewRegistrations: true,
      maintenanceMode: false,
      maxGroupSize: 1024,
      retentionDays: 90
    };
  }
};

export const updateSettings = async (settings: SystemSettings): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
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
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`);
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
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/ban`, {
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
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/unban`, {
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
}

export const fetchBadgePayments = async (): Promise<BadgeSummary> => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/badges`);
    if (!res.ok) throw new Error('Failed to fetch badge payments');
    const data = await res.json();
    return {
      payments: data.payments.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt).toLocaleString()
      })),
      totalRevenue: data.totalRevenue || 0,
      totalPurchases: data.totalPurchases || 0,
      verifiedUsersCount: data.verifiedUsersCount || 0
    };
  } catch (error) {
    console.error(error);
    return { payments: [], totalRevenue: 0, totalPurchases: 0, verifiedUsersCount: 0 };
  }
};

export const toggleUserVerificationBadge = async (userId: string, isVerified: boolean): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/badge`, {
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

