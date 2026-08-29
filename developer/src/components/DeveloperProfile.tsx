'use client';

import React, { useState } from 'react';
import {
  User,
  Mail,
  Building,
  Shield,
  Key,
  Calendar,
  CheckCircle,
  Copy,
  Check,
  LogOut,
  Edit3,
  Save,
  Lock,
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { useDeveloperAuth } from '../context/DeveloperAuthContext';

export const DeveloperProfile: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const { user, logout } = useDeveloperAuth();
  const [copiedId, setCopiedId] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || 'Developer');
  const [organization, setOrganization] = useState(user?.organization || 'Acme Labs');
  const [avatar, setAvatar] = useState(user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const devId = `dev_usr_${user?.email?.split('@')[0] || '89a4x2'}_${user?.id?.slice(0, 8) || 'v9b2c1'}`;

  const handleCopyId = () => {
    navigator.clipboard.writeText(devId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Profile Header Banner Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#070b14] border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10 bg-slate-900">
                <img
                  src={avatar}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-emerald-500 text-slate-950 font-bold">
                <CheckCircle className="w-4 h-4" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{name}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {user?.role || 'Owner'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{user?.email || 'developer@vibez.io'}</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{organization}</span>
                </span>
                <span className="text-slate-700">•</span>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Enterprise Tier</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition-all flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4 text-emerald-400" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogoutClick}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold text-rose-400 transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Profile information updated successfully.</span>
        </div>
      )}

      {/* Profile Details or Edit Form */}
      {isEditing ? (
        <form onSubmit={handleSave} className="p-6 rounded-2xl bg-[#070b14] border border-slate-800 space-y-6">
          <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-emerald-400" />
            <span>Update Profile Details</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400">Organization Name</label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-mono text-slate-400">Avatar Image URL</label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Metadata */}
          <div className="p-6 rounded-2xl bg-[#070b14] border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              <span>Developer Identity</span>
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <span className="text-slate-500 text-[10px]">Unique Developer ID</span>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold truncate">{devId}</span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all shrink-0 ml-2"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">Account Status</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Verified Master Developer</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">Joined Platform</span>
                <span className="text-slate-300 font-bold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>August 2026</span>
                </span>
              </div>
            </div>
          </div>

          {/* Security & Access Overview */}
          <div className="p-6 rounded-2xl bg-[#070b14] border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Security & Credentials</span>
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">Two-Factor Auth (2FA)</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                  ENABLED (TOTP)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">Active API Keys</span>
                <span className="text-slate-200 font-bold">1 Master Key</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">Current Session</span>
                <span className="text-emerald-400 text-[11px] font-bold">Encrypted Web Session</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
