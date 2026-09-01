'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  SystemSettings,
  updateSettings,
  fetchSettings,
  AuditLog,
  fetchAuditLogs,
  fetchAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  fetchAdminSessions,
  revokeAdminSession,
  toggleTwoFactor,
  fetchSecurityHealth
} from '../services/api';

interface AdminSettingsDashboardProps {
  initialSettings?: SystemSettings | null;
}

const DEFAULT_SETTINGS: SystemSettings = {
  allowNewRegistrations: true,
  maintenanceMode: false,
  maxGroupSize: 1024,
  retentionDays: 90,
  verificationBadgePrice: 3.00,
  appDownloadUrl: '',
  appVersion: '1.0.0',
  appName: 'VIBEZ',
  contactEmail: 'support@vibez.chat',
  contactPhone: '+1 (800) 555-0199',
  supportAddress: 'San Francisco, CA, USA',
  phoneAuthAllowedCountries: 'US,GH,NG,GB,CA,KE,ZA,IN,DE,FR,AE,SA,BR,MX,AU'
};

export default function AdminSettingsDashboard({ initialSettings }: AdminSettingsDashboardProps) {
  const router = useRouter();
  const { logout, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'notifications' | 'security' | 'logs' | 'logout'>('profile');
  
  // Settings Tab state with reliable defaults
  const [settings, setSettings] = useState<SystemSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...(initialSettings || {})
  }));
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsToast, setSettingsToast] = useState<{ text: string; isError: boolean } | null>(null);

  // Profile state
  const [profile, setProfile] = useState({
    name: 'System Admin',
    email: 'admin@vibez.app',
    role: 'SuperAdmin',
    photo: '',
  });
  const [profileToast, setProfileToast] = useState<string | null>(null);

  // Security states
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [is2FaEnabled, setIs2FaEnabled] = useState(false);
  const [show2FaSetup, setShow2FaSetup] = useState(false);
  const [securityHealth, setSecurityHealth] = useState<any>(null);
  const [sessions, setSessions] = useState([
    { id: '1', device: 'macOS Chrome', ip: '192.168.1.104', location: 'London, UK', current: true },
    { id: '2', device: 'iOS Safari', ip: '192.168.1.189', location: 'London, UK', current: false },
    { id: '3', device: 'Windows Edge', ip: '84.120.44.11', location: 'Berlin, DE', current: false }
  ]);
  const [securityToast, setSecurityToast] = useState<string | null>(null);

  // Notifications states
  const [notifConfig, setNotifConfig] = useState({
    emailAlerts: true,
    activitySummaries: true,
    criticalErrors: true,
    soundAlerts: false,
  });
  const [notifToast, setNotifToast] = useState<string | null>(null);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  useEffect(() => {
    if (initialSettings) {
      setSettings(prev => ({
        ...DEFAULT_SETTINGS,
        ...prev,
        ...initialSettings
      }));
    }
  }, [initialSettings]);

  useEffect(() => {
    async function loadLiveSettings() {
      try {
        const live = await fetchSettings();
        if (live) {
          setSettings(prev => ({
            ...DEFAULT_SETTINGS,
            ...prev,
            ...live
          }));
        }
      } catch (err) {
        console.error('Error fetching live settings:', err);
      }
    }
    loadLiveSettings();
  }, []);

  useEffect(() => {
    async function loadLogs() {
      try {
        setIsLoadingLogs(true);
        const logs = await fetchAuditLogs();
        setAuditLogs(logs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingLogs(false);
      }
    }

    async function loadProfile() {
      try {
        const data = await fetchAdminProfile();
        if (data) {
          setProfile({
            name: data.name || 'System Admin',
            email: data.email || 'admin@vibez.app',
            role: data.role || 'SuperAdmin',
            photo: data.photo || '',
          });
          setIs2FaEnabled(Boolean(data.twoFactorEnabled));
        }
      } catch (err) {
        console.error('Error loading admin profile:', err);
      }
    }

    async function loadSessions() {
      try {
        const data = await fetchAdminSessions();
        if (data && data.length > 0) {
          setSessions(data);
        }
      } catch (err) {
        console.error('Error loading admin sessions:', err);
      }
    }

    async function loadHealth() {
      try {
        const health = await fetchSecurityHealth();
        if (health) setSecurityHealth(health);
      } catch (err) {
        console.error('Error loading security health:', err);
      }
    }

    if (activeTab === 'logs') {
      loadLogs();
    }
    if (activeTab === 'profile' || activeTab === 'security') {
      loadProfile();
    }
    if (activeTab === 'security') {
      loadSessions();
      loadHealth();
    }
  }, [activeTab]);

  const handleToggle2FA = async (nextState: boolean) => {
    try {
      const res = await toggleTwoFactor(nextState);
      if (res.success) {
        setIs2FaEnabled(Boolean(res.twoFactorEnabled));
        setShow2FaSetup(false);
        setSecurityToast(res.message || '2FA setting updated.');
        const health = await fetchSecurityHealth();
        if (health) setSecurityHealth(health);
        setTimeout(() => setSecurityToast(null), 5000);
      } else {
        setSecurityToast(res.error || 'Failed to update 2FA.');
        setTimeout(() => setSecurityToast(null), 4000);
      }
    } catch (e) {
      setSecurityToast('Failed to update 2FA.');
      setTimeout(() => setSecurityToast(null), 4000);
    }
  };

  const handleToggleMaintenanceMode = async (nextVal: boolean) => {
    // Optimistically update
    setSettings(prev => ({ ...prev, maintenanceMode: nextVal }));
    setSettingsToast({
      text: nextVal 
        ? '🟡 System status set to SCHEDULED SYSTEM MAINTENANCE (Lockout Active)' 
        : '🟢 System status set to ALL SYSTEMS OPERATIONAL (Emerald Normal Traffic)',
      isError: false
    });

    try {
      const res = await updateSettings({ maintenanceMode: nextVal });
      if (res) {
        setSettings(prev => ({ ...prev, ...res }));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('vibez:system_status_changed', { detail: { maintenanceMode: res.maintenanceMode } }));
        }
      }
    } catch (e) {
      console.error('Failed to toggle maintenance mode:', e);
      setSettingsToast({ text: 'Failed to update system maintenance mode.', isError: true });
    }
    setTimeout(() => setSettingsToast(null), 5000);
  };

  const handleToggleRegistrations = async (nextVal: boolean) => {
    setSettings(prev => ({ ...prev, allowNewRegistrations: nextVal }));
    setSettingsToast({
      text: nextVal 
        ? '✓ Citizen registrations enabled globally.' 
        : '⚠️ Citizen registrations paused globally.',
      isError: false
    });

    try {
      const res = await updateSettings({ allowNewRegistrations: nextVal });
      if (res) {
        setSettings(prev => ({ ...prev, ...res }));
      }
    } catch (e) {
      console.error('Failed to toggle registrations:', e);
    }
    setTimeout(() => setSettingsToast(null), 4000);
  };

  const handleTogglePrefixVisibility = async (nextVal: boolean) => {
    setSettings(prev => ({ ...prev, showPhoneCountryPrefixes: nextVal }));
    setSettingsToast({
      text: nextVal 
        ? '✓ Country prefixes set to VISIBLE in mobile authentication.' 
        : '⚠️ Country prefixes set to HIDDEN in mobile authentication.',
      isError: false
    });

    try {
      const res = await updateSettings({ showPhoneCountryPrefixes: nextVal });
      if (res) {
        setSettings(prev => ({ ...prev, ...res }));
      }
    } catch (e) {
      console.error('Failed to toggle prefix visibility:', e);
      setSettingsToast({ text: 'Failed to update country prefix visibility.', isError: true });
    }
    setTimeout(() => setSettingsToast(null), 4000);
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setSettingsToast(null);
    const result = await updateSettings(settings);
    setIsSavingSettings(false);

    if (result) {
      setSettings(prev => ({ ...prev, ...result }));
      const priceStr = typeof result.verificationBadgePrice === 'number'
        ? result.verificationBadgePrice.toFixed(2)
        : (settings.verificationBadgePrice ?? 3.00).toFixed(2);
      setSettingsToast({ 
        text: `System parameters saved: Verification priced at $${priceStr} | Status: ${result.maintenanceMode ? '🟡 Maintenance' : '🟢 Operational'}`, 
        isError: false 
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vibez:system_status_changed', { detail: { maintenanceMode: result.maintenanceMode } }));
      }
      router.refresh();
      setTimeout(() => setSettingsToast(null), 4000);
    } else {
      setSettingsToast({ text: 'System update failed.', isError: true });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileToast(null);
    const result = await updateAdminProfile({
      name: profile.name,
      email: profile.email,
      role: profile.role,
      photo: profile.photo
    });
    if (result) {
      setProfile({
        name: result.name || 'System Admin',
        email: result.email,
        role: result.role,
        photo: result.photo || '',
      });
      await refreshProfile();
      setProfileToast('Profile successfully updated.');
    } else {
      setProfileToast('Failed to update profile.');
    }
    setTimeout(() => setProfileToast(null), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityToast(null);
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      setSecurityToast('Please fill out all password fields.');
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setSecurityToast('New password and confirmation do not match.');
      return;
    }
    const result = await changeAdminPassword(passwordForm.current, passwordForm.new);
    if (result.success) {
      setSecurityToast('Password changed successfully.');
      setPasswordForm({ current: '', new: '', confirm: '' });
    } else {
      setSecurityToast(result.error || 'Password change failed.');
    }
    setTimeout(() => setSecurityToast(null), 4000);
  };

  const handleRevokeSession = async (sessionId: string) => {
    setSecurityToast(null);
    const success = await revokeAdminSession(sessionId);
    if (success) {
      setSessions(sessions.filter(s => s.id !== sessionId));
      setSecurityToast('Session terminated successfully.');
    } else {
      setSecurityToast('Failed to terminate session.');
    }
    setTimeout(() => setSecurityToast(null), 3000);
  };

  const handleSaveNotifications = () => {
    setNotifToast('Notification preferences applied.');
    setTimeout(() => setNotifToast(null), 3000);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-28">
      <div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">System & Account Control</h2>
        <p className="text-slate-500 font-bold mt-1">Manage global system options, administrative credentials, notifications, and audit logging.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 p-4 space-y-1.5 shadow-sm">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all ${
              activeTab === 'profile'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-lg">👤</span>
            <div className="text-left">
              <p className="font-extrabold text-sm">Profile</p>
              <p className="text-[10px] font-bold opacity-60">Admin info & role</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all ${
              activeTab === 'settings'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-lg">⚙️</span>
            <div className="text-left">
              <p className="font-extrabold text-sm">System Settings</p>
              <p className="text-[10px] font-bold opacity-60">Registration, limits & fee</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all ${
              activeTab === 'notifications'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-lg">🔔</span>
            <div className="text-left">
              <p className="font-extrabold text-sm">Notifications</p>
              <p className="text-[10px] font-bold opacity-60">Alert preferences & sounds</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all ${
              activeTab === 'security'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-lg">🔐</span>
            <div className="text-left">
              <p className="font-extrabold text-sm">Security</p>
              <p className="text-[10px] font-bold opacity-60">Password, 2FA & sessions</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all ${
              activeTab === 'logs'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-lg">📋</span>
            <div className="text-left">
              <p className="font-extrabold text-sm">Activity Log</p>
              <p className="text-[10px] font-bold opacity-60">Admin action audit log</p>
            </div>
          </button>

          <hr className="my-2 border-slate-100" />

          <button
            onClick={() => setActiveTab('logout')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all ${
              activeTab === 'logout'
                ? 'bg-red-50 text-red-600 border border-red-100 shadow-sm'
                : 'text-slate-600 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            <span className="text-lg">🚪</span>
            <div className="text-left">
              <p className="font-extrabold text-sm text-inherit">Logout</p>
              <p className="text-[10px] font-bold opacity-60 text-inherit">Sign out securely</p>
            </div>
          </button>
        </div>

        {/* Content Pane */}
        <div className="lg:col-span-9 bg-white rounded-[2.5rem] border border-slate-200 p-8 lg:p-10 shadow-sm min-h-[500px]">
          
          {/* 1. PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Admin Profile</h3>
                <p className="text-sm font-bold text-slate-400 mt-1">Update your administrative credentials and display identity.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-slate-100">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-emerald-500/20">
                      AD
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-white text-xs cursor-pointer shadow-md">
                      ✏️
                    </div>
                  </div>
                  <div className="text-center md:text-left space-y-1">
                    <p className="text-lg font-black text-slate-900">{profile.name}</p>
                    <p className="text-sm font-bold text-slate-400">{profile.email}</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-black uppercase tracking-widest rounded-lg">
                      {profile.role}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Admin Display Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Admin Email Address</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Administrative Role</label>
                    <select
                      value={profile.role}
                      onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                    >
                      <option value="SuperAdmin">SuperAdmin (Full Permissions)</option>
                      <option value="Moderator">Moderator (Community Control)</option>
                      <option value="Support">Support (User Audit Only)</option>
                    </select>
                  </div>
                </div>

                {profileToast && (
                  <div className="px-5 py-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold rounded-2xl animate-fadeIn">
                    ✓ {profileToast}
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="px-8 py-4 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 2. SYSTEM SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Ecosystem Preferences</h3>
                <p className="text-sm font-bold text-slate-400 mt-1">Configure user onboarding restrictions, badge pricing, and cluster limits.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Onboarding */}
                <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Citizen Onboarding</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        settings?.allowNewRegistrations ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {settings?.allowNewRegistrations ? 'Open' : 'Paused'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 mt-1">Allow new user registration globally.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleRegistrations(!settings?.allowNewRegistrations)}
                    className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${
                      settings?.allowNewRegistrations ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-300'
                    }`}
                    title="Toggle User Registrations"
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm ${
                        settings?.allowNewRegistrations ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Maintenance mode */}
                <div className={`flex items-center justify-between p-6 rounded-2xl border transition-all duration-300 ${
                  settings?.maintenanceMode 
                    ? 'bg-amber-50/70 border-amber-200/80 shadow-md shadow-amber-500/10' 
                    : 'bg-emerald-50/40 border-emerald-100'
                }`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Operational Status</h4>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        settings?.maintenanceMode 
                          ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse' 
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${settings?.maintenanceMode ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        {settings?.maintenanceMode ? 'Scheduled Maintenance' : 'All Systems Operational'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 mt-1">
                      {settings?.maintenanceMode 
                        ? '🟡 Lockout active: general APIs return 503 Maintenance' 
                        : '🟢 Live normal traffic routing to all services'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleMaintenanceMode(!settings?.maintenanceMode)}
                    className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${
                      settings?.maintenanceMode ? 'bg-amber-500 shadow-lg shadow-amber-500/30' : 'bg-emerald-500 shadow-lg shadow-emerald-500/20'
                    }`}
                    title={settings?.maintenanceMode ? 'Switch to All Systems Operational' : 'Switch to Scheduled Maintenance'}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm ${
                        settings?.maintenanceMode ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 3: Firebase Phone Auth Prefix Visibility */}
                <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Prefix Visibility</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        settings?.showPhoneCountryPrefixes ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {settings?.showPhoneCountryPrefixes ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 mt-1">
                      Toggle country dial prefixes in picker.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePrefixVisibility(!settings?.showPhoneCountryPrefixes)}
                    className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${
                      settings?.showPhoneCountryPrefixes ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-300'
                    }`}
                    title="Toggle Country Prefix Visibility"
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm ${
                        settings?.showPhoneCountryPrefixes ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Data parameters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Verification Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.50"
                    value={settings?.verificationBadgePrice ?? 3.00}
                    onChange={(e) => setSettings({ ...settings, verificationBadgePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Max Group Size</label>
                  <input
                    type="number"
                    value={settings?.maxGroupSize ?? 1024}
                    onChange={(e) => setSettings({ ...settings, maxGroupSize: parseInt(e.target.value) || 1024 })}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Data Retention (Days)</label>
                  <input
                    type="number"
                    value={settings?.retentionDays ?? 90}
                    onChange={(e) => setSettings({ ...settings, retentionDays: parseInt(e.target.value) || 90 })}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Firebase Phone Auth Restrictions */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div>
                  <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>🔥</span> Firebase Phone Auth Allowed Countries
                  </h4>
                  <p className="text-xs font-bold text-slate-400 mt-1">
                    Comma-separated list of permitted country ISO-2 codes. The mobile client application's country picker and prefix selector dynamically filters based on this whitelisted configuration.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Permitted ISO-2 Country Codes</label>
                  <input
                    type="text"
                    placeholder="e.g. US, GH, NG, GB, CA, KE, ZA"
                    value={settings?.phoneAuthAllowedCountries ?? 'US,GH,NG,GB,CA,KE,ZA,IN,DE,FR,AE,SA,BR,MX,AU'}
                    onChange={(e) => setSettings({ ...settings, phoneAuthAllowedCountries: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                    Current active whitelist: {settings?.phoneAuthAllowedCountries || 'N/A'}
                  </p>
                </div>
              </div>

              {/* App Distribution & Landing Page Synchronization */}
              <div className="pt-6 border-t border-slate-100 space-y-6">
                <div>
                  <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>📱</span> App Release & Landing Page Download Link
                  </h4>
                  <p className="text-xs font-bold text-slate-400 mt-1">
                    Configure the direct APK download URL or store link. The public Landing Page dynamically connects to this link for its "Download APK" buttons.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">App Download URL (Direct APK / Google Drive / S3 Link)</label>
                    <input
                      type="url"
                      placeholder="https://example.com/downloads/vibez-app-release.apk"
                      value={settings.appDownloadUrl || ''}
                      onChange={(e) => setSettings({ ...settings, appDownloadUrl: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                    <p className="text-[11px] text-slate-400 font-medium ml-1">
                      {settings.appDownloadUrl ? (
                        <span className="text-emerald-600 font-bold">✓ Landing page button currently directs to: {settings.appDownloadUrl}</span>
                      ) : (
                        <span>Leave empty to use the default app preview deployment link.</span>
                      )}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Current App Version</label>
                    <input
                      type="text"
                      placeholder="1.0.0"
                      value={settings.appVersion || '1.0.0'}
                      onChange={(e) => setSettings({ ...settings, appVersion: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Official App Brand Name</label>
                    <input
                      type="text"
                      placeholder="VIBEZ"
                      value={settings.appName || 'VIBEZ'}
                      onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Public Contact & Support Information */}
              <div className="pt-6 border-t border-slate-100 space-y-6">
                <div>
                  <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>📫</span> Public Support & Contact Information
                  </h4>
                  <p className="text-xs font-bold text-slate-400 mt-1">
                    Information displayed on the Contact & About pages of the Landing Page.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Support Email</label>
                    <input
                      type="email"
                      placeholder="support@vibez.chat"
                      value={settings.contactEmail || 'support@vibez.chat'}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Support Hotline Phone</label>
                    <input
                      type="text"
                      placeholder="+1 (800) 555-0199"
                      value={settings.contactPhone || '+1 (800) 555-0199'}
                      onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Office / HQ Address</label>
                    <input
                      type="text"
                      placeholder="San Francisco, CA, USA"
                      value={settings.supportAddress || 'San Francisco, CA, USA'}
                      onChange={(e) => setSettings({ ...settings, supportAddress: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {settingsToast && (
                <div className={`px-5 py-3 text-sm font-bold rounded-2xl animate-fadeIn ${
                  settingsToast.isError ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                  {settingsToast.text}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400">
                  Changes take effect immediately across all client applications.
                </p>
                <button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50"
                >
                  {isSavingSettings ? 'Applying...' : 'Apply settings'}
                </button>
              </div>
            </div>
          )}

          {/* 3. NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Alert Preferences</h3>
                <p className="text-sm font-bold text-slate-400 mt-1">Configure email warnings, incident flags, and terminal audio notifications.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Immediate Email Alerts</h4>
                    <p className="text-xs font-bold text-slate-500 mt-1">Receive email instantly when content violation reports are submitted.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifConfig({ ...notifConfig, emailAlerts: !notifConfig.emailAlerts })}
                    className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${
                      notifConfig.emailAlerts ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm ${
                        notifConfig.emailAlerts ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Daily Summary Digest</h4>
                    <p className="text-xs font-bold text-slate-500 mt-1">Get an automated summary of platform growth and active users daily.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifConfig({ ...notifConfig, activitySummaries: !notifConfig.activitySummaries })}
                    className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${
                      notifConfig.activitySummaries ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm ${
                        notifConfig.activitySummaries ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Critical Infrastructure Triggers</h4>
                    <p className="text-xs font-bold text-slate-500 mt-1">Flag alerts if server resources approach capacity limits or fail health checks.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifConfig({ ...notifConfig, criticalErrors: !notifConfig.criticalErrors })}
                    className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${
                      notifConfig.criticalErrors ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm ${
                        notifConfig.criticalErrors ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">System Console Audio</h4>
                    <p className="text-xs font-bold text-slate-500 mt-1">Play an audio beep in the browser terminal on critical alerts.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifConfig({ ...notifConfig, soundAlerts: !notifConfig.soundAlerts })}
                    className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${
                      notifConfig.soundAlerts ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm ${
                        notifConfig.soundAlerts ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {notifToast && (
                <div className="px-5 py-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold rounded-2xl animate-fadeIn">
                  ✓ {notifToast}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveNotifications}
                  className="px-8 py-4 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                >
                  Save Notification Toggles
                </button>
              </div>
            </div>
          )}

          {/* 4. SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-10 animate-fadeIn">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Security & Active Nodes</h3>
                <p className="text-sm font-bold text-slate-400 mt-1">Change master keys, toggle multi-factor protection, and audit connected nodes.</p>
              </div>

              {/* Security Telemetry & System Hardening Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-700">Rate Limiting</span>
                    <span className="text-lg">🛡️</span>
                  </div>
                  <p className="text-lg font-black text-emerald-900">ACTIVE</p>
                  <p className="text-[10px] font-bold text-emerald-700 mt-1">5 attempts / 15m throttle</p>
                </div>

                <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-700">Strict CORS</span>
                    <span className="text-lg">🌐</span>
                  </div>
                  <p className="text-lg font-black text-indigo-900">ENFORCED</p>
                  <p className="text-[10px] font-bold text-indigo-700 mt-1">Domain restricted origins</p>
                </div>

                <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-widest text-cyan-700">Audit Trail</span>
                    <span className="text-lg">📋</span>
                  </div>
                  <p className="text-lg font-black text-cyan-900">{securityHealth?.totalAuditLogs ?? 0} LOGS</p>
                  <p className="text-[10px] font-bold text-cyan-700 mt-1">Real-time IP & UA logging</p>
                </div>

                <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-widest text-purple-700">2FA Protection</span>
                    <span className="text-lg">🔐</span>
                  </div>
                  <p className="text-lg font-black text-purple-900">{is2FaEnabled ? 'ENABLED' : 'OPTIONAL'}</p>
                  <p className="text-[10px] font-bold text-purple-700 mt-1">6-digit TOTP verification</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Change Password */}
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">Change Master Keys</h4>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                  >
                    Change Key
                  </button>
                </form>

                {/* 2FA Panel */}
                <div className="space-y-6 p-6 rounded-3xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">Two-Factor Auth (2FA)</h4>
                      <p className="text-xs font-bold text-slate-500 mt-1">Require 6-digit TOTP code on login.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle2FA(!is2FaEnabled)}
                      className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${
                        is2FaEnabled ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm ${
                          is2FaEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {securityToast && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold rounded-xl animate-fadeIn">
                      ✓ {securityToast}
                    </div>
                  )}

                  <div className="p-4 bg-slate-100/80 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold text-xs">🛡️ Security Status:</span>
                      <span className="text-xs font-black text-slate-900">HARDENED</span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                      Rate limiting (5 attempts/15m), security headers (HSTS, nosniff, frameguard), strict CORS, and audit logs are active on this administration node.
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">Active Admin Nodes</h4>
                
                <div className="overflow-hidden border border-slate-100 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        <th className="px-6 py-4">Terminal / Node</th>
                        <th className="px-6 py-4">IP Address</th>
                        <th className="px-6 py-4">Location</th>
                        <th className="px-6 py-4 text-right">Revocation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                      {sessions.map((sess) => (
                        <tr key={sess.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-2">
                            <span>{sess.device}</span>
                            {sess.current && (
                              <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-black uppercase tracking-wider rounded-md">
                                Current
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-400 font-mono text-xs">{sess.ip}</td>
                          <td className="px-6 py-4 text-slate-400">{sess.location}</td>
                          <td className="px-6 py-4 text-right">
                            {!sess.current ? (
                              <button
                                onClick={() => handleRevokeSession(sess.id)}
                                className="px-3 py-1.5 border border-red-100 text-red-600 hover:bg-red-50 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
                              >
                                Terminate
                              </button>
                            ) : (
                              <span className="text-xs text-slate-300">Unrevokable</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {securityToast && (
                <div className="px-5 py-3 bg-slate-50 border border-slate-100 text-slate-700 text-sm font-bold rounded-2xl animate-fadeIn">
                  {securityToast}
                </div>
              )}
            </div>
          )}

          {/* 5. AUDIT LOGS TAB */}
          {activeTab === 'logs' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Ecosystem Activity Ledger</h3>
                <p className="text-sm font-bold text-slate-400 mt-1">Immutable record of admin logins, setting adjustments, and moderator flags.</p>
              </div>

              {isLoadingLogs ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                  <p className="text-sm font-bold text-slate-400">Retrieving secure log ledger...</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <span className="text-3xl">📋</span>
                  <p className="text-sm font-black text-slate-500 mt-2">No admin actions logged on this server.</p>
                </div>
              ) : (
                <div className="overflow-hidden border border-slate-100 rounded-3xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        <th className="px-6 py-4">Administrator</th>
                        <th className="px-6 py-4">Action Event</th>
                        <th className="px-6 py-4">Target Payload</th>
                        <th className="px-6 py-4 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-slate-900">{log.adminEmail}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-lg">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 truncate max-w-[200px]">{log.target}</td>
                          <td className="px-6 py-4 text-right text-xs text-slate-400 font-mono">{log.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 6. LOGOUT TAB */}
          {activeTab === 'logout' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-8 animate-fadeIn text-center">
              <div className="w-20 h-20 bg-red-50 text-red-600 border border-red-100 rounded-[2rem] flex items-center justify-center text-4xl shadow-md">
                🚪
              </div>
              
              <div className="space-y-2 max-w-md">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Confirm Gateway Checkout</h3>
                <p className="text-sm font-bold text-slate-400">This will safely terminate your administrative session token and return your client to the login gate.</p>
              </div>

              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={() => setActiveTab('profile')}
                  className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95"
                >
                  Stay Connected
                </button>
                <button
                  onClick={handleLogout}
                  className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-red-600/20 active:scale-95"
                >
                  Safely Disconnect
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
