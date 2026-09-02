'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { fetchSecurityHealth, toggleTwoFactor, setupTwoFactor, confirmTwoFactor, changeAdminPassword } from '../../services/api';

export default function SecurityPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  // 2FA Setup Modal State
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

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

  const handleStart2FASetup = async () => {
    try {
      const res = await setupTwoFactor();
      if (res.success && res.secret && res.otpauthUrl) {
        setSetupData({ secret: res.secret, otpauthUrl: res.otpauthUrl });
        setVerificationCode('');
        setShow2FASetupModal(true);
      } else {
        setToast({ message: res.error || 'Failed to generate 2FA key.', isError: true });
      }
    } catch (err) {
      setToast({ message: 'Error initializing 2FA setup.', isError: true });
    }
  };

  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData || !verificationCode) return;
    try {
      setIsVerifying2FA(true);
      const res = await confirmTwoFactor(setupData.secret, verificationCode.trim());
      if (res.success) {
        setIs2FAEnabled(true);
        setShow2FASetupModal(false);
        setSetupData(null);
        setToast({ message: '✓ Two-Factor Authentication (2FA) successfully activated!' });
        const updatedHealth = await fetchSecurityHealth();
        if (updatedHealth) setHealth(updatedHealth);
      } else {
        setToast({ message: res.error || 'Invalid verification code.', isError: true });
      }
    } catch (err) {
      setToast({ message: 'Failed to verify 2FA code.', isError: true });
    } finally {
      setIsVerifying2FA(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleToggle2FA = async (nextState: boolean) => {
    if (nextState) {
      handleStart2FASetup();
    } else {
      if (confirm('Are you sure you want to disable Two-Factor Authentication (2FA)? Your account will be less secure.')) {
        try {
          const res = await toggleTwoFactor(false);
          if (res.success) {
            setIs2FAEnabled(false);
            setToast({ message: 'Two-Factor Authentication has been disabled.' });
            const updatedHealth = await fetchSecurityHealth();
            if (updatedHealth) setHealth(updatedHealth);
          } else {
            setToast({ message: res.error || 'Failed to disable 2FA.', isError: true });
          }
        } catch (err) {
          setToast({ message: 'Error updating 2FA settings.', isError: true });
        }
        setTimeout(() => setToast(null), 5000);
      }
    }
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
              <p className="text-xs font-bold text-slate-400 mt-1">Require 6-digit TOTP code from Google Authenticator / Authy on login.</p>
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

          {!is2FAEnabled ? (
            <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">Pair Authenticator App</h4>
              <p className="text-xs text-slate-500 font-medium">Link Google Authenticator, Authy, or 1Password to enforce 2FA TOTP verification.</p>
              <button
                onClick={handleStart2FASetup}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>🔑</span> Configure 2FA Authenticator App
              </button>
            </div>
          ) : (
            <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <span>🛡️</span> 2FA Protection Active
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                Your account is protected by TOTP two-factor verification. Login attempts will require your 6-digit code.
              </p>
              <button
                onClick={handleStart2FASetup}
                className="mt-2 text-xs font-bold text-emerald-800 hover:underline inline-block"
              >
                Re-configure Authenticator App Key →
              </button>
            </div>
          )}

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

      {/* 2FA SETUP MODAL */}
      {show2FASetupModal && setupData && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-black text-lg">
                  🔐
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Configure Authenticator App</h3>
                  <p className="text-xs font-bold text-slate-400">Scan QR Code or copy Secret Key</p>
                </div>
              </div>
              <button
                onClick={() => { setShow2FASetupModal(false); setSetupData(null); }}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-2"
              >
                ✕
              </button>
            </div>

            {/* QR Code Container */}
            <div className="text-center space-y-3 bg-slate-50 p-4 border border-slate-100 rounded-2xl">
              <p className="text-xs font-bold text-slate-600">Scan with Google Authenticator, Authy, or Duo:</p>
              <div className="p-3 bg-white inline-block rounded-2xl border border-slate-200 shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setupData.otpauthUrl)}`}
                  alt="2FA QR Code"
                  className="w-44 h-44 mx-auto object-contain"
                />
              </div>
              
              <div className="pt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Manual Entry Secret Key</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="bg-slate-900 text-emerald-400 px-3 py-1.5 rounded-xl font-mono text-xs tracking-wider select-all">
                    {setupData.secret}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(setupData.secret);
                      setCopiedSecret(true);
                      setTimeout(() => setCopiedSecret(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all"
                  >
                    {copiedSecret ? '✓ Copied' : 'Copy Key'}
                  </button>
                </div>
              </div>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleConfirm2FA} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Enter 6-Digit Code from Authenticator App
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="000000"
                  className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center text-xl font-mono font-black tracking-[0.3em] text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShow2FASetupModal(false); setSetupData(null); }}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying2FA || verificationCode.length !== 6}
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isVerifying2FA ? 'Verifying...' : 'Activate 2FA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
