'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { fetchSecurityHealth, toggleTwoFactor, changeAdminPassword, fetchAdminSessions } from '../../services/api';

export default function SecurityPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchSecurityHealth();
        if (data) {
          setHealth(data);
          const currentAdmin = data.admins?.find((a: any) => a.twoFactorEnabled);
          if (currentAdmin) setIs2FAEnabled(true);
        }
      } catch (err) {
        console.error('Failed to load security telemetry:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleToggle2FA = async (nextState: boolean) => {
    try {
      const res = await toggleTwoFactor(nextState);
      if (res.success) {
        setIs2FAEnabled(Boolean(res.twoFactorEnabled));
        setToast({ message: res.message || '2FA settings updated successfully.' });
        const updatedHealth = await fetchSecurityHealth();
        if (updatedHealth) setHealth(updatedHealth);
      } else {
        setToast({ message: res.error || 'Failed to update 2FA status.', isError: true });
      }
    } catch (err) {
      setToast({ message: 'Error communicating with security node.', isError: true });
    }
    setTimeout(() => setToast(null), 5000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      setToast({ message: 'New passwords do not match.', isError: true });
      return;
    }
    try {
      setIsChangingPass(true);
      const res = await changeAdminPassword(passwordForm.current, passwordForm.new);
      if (res.success) {
        setToast({ message: 'Admin master password updated successfully.' });
        setPasswordForm({ current: '', new: '', confirm: '' });
      } else {
        setToast({ message: res.error || 'Failed to change password.', isError: true });
      }
    } catch (err) {
      setToast({ message: 'Error updating master credentials.', isError: true });
    } finally {
      setIsChangingPass(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Security & Hardening</h1>
            <p className="text-sm font-bold text-slate-400 mt-1">Production node security layer, rate limiting, and 2FA authentication gate.</p>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`p-4 rounded-2xl font-bold text-sm border animate-fadeIn ${
          toast.isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {toast.isError ? '⚠️' : '✓'} {toast.message}
        </div>
      )}

      {/* Security Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-emerald-400">
            <span>Rate Limiter</span>
            <span>🛡️</span>
          </div>
          <div className="text-2xl font-black tracking-tight">ACTIVE</div>
          <p className="text-xs text-slate-400 font-medium">5 attempts / 15 mins per IP throttling</p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-indigo-400">
            <span>CORS Policy</span>
            <span>🌐</span>
          </div>
          <div className="text-2xl font-black tracking-tight">STRICT</div>
          <p className="text-xs text-slate-400 font-medium">Domain whitelisted origins only</p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-cyan-400">
            <span>Audit Trail</span>
            <span>📋</span>
          </div>
          <div className="text-2xl font-black tracking-tight">{health?.totalAuditLogs ?? 0} LOGS</div>
          <p className="text-xs text-slate-400 font-medium">Client IP & User Agent logged</p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-purple-400">
            <span>2FA Protection</span>
            <span>🔑</span>
          </div>
          <div className="text-2xl font-black tracking-tight">{is2FAEnabled ? 'ENABLED' : 'DISABLED'}</div>
          <p className="text-xs text-slate-400 font-medium">6-digit TOTP authentication</p>
        </div>
      </div>

      {/* Security Controls & Master Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* 2FA Gate Settings */}
        <div className="p-8 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">Multi-Factor Authentication (2FA)</h3>
              <p className="text-xs font-bold text-slate-400 mt-1">Enforce 6-digit passcode verification on admin login.</p>
            </div>
            <button
              onClick={() => handleToggle2FA(!is2FAEnabled)}
              className={`w-16 h-9 rounded-full p-1 transition-all duration-300 ${
                is2FAEnabled ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-300'
              }`}
            >
              <div className={`w-7 h-7 bg-white rounded-full transition-transform duration-300 shadow-md ${
                is2FAEnabled ? 'translate-x-7' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">Security Architecture Status</h4>
            <ul className="text-xs font-bold text-slate-600 space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> High Entropy JWT Secret Check Active
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Input Sanitization & Script Stripping Active
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> Security Headers (HSTS, FrameGuard, NoSniff) Enforced
              </li>
            </ul>
          </div>
        </div>

        {/* Change Master Password */}
        <div className="p-8 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900">Rotate Admin Password</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">Update administrative master password credential.</p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Password</label>
              <input
                type="password"
                required
                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">New Password</label>
              <input
                type="password"
                required
                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Confirm New Password</label>
              <input
                type="password"
                required
                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPass}
              className="w-full py-4 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50"
            >
              {isChangingPass ? 'Updating Credentials...' : 'Rotate Master Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
