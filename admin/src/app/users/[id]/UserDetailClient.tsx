'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserDetails, updateUser, toggleUserVerificationBadge, banUser, unbanUser, deleteUser } from '../../../services/api';

export default function UserDetailClient({ initialUser }: { initialUser: UserDetails }) {
  const router = useRouter();
  const [user, setUser] = useState<UserDetails>(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    phoneNumber: user.phoneNumber || '',
    googleEmail: user.googleEmail || '',
    about: user.bio || user.about || '',
  });
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoadingAction(true);
      const updated = await updateUser(user.id, {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        googleEmail: formData.googleEmail,
        about: formData.about
      });
      if (updated) {
        setUser(prev => ({
          ...prev,
          name: updated.name,
          phoneNumber: updated.phoneNumber,
          googleEmail: updated.googleEmail,
          bio: updated.about || '',
          about: updated.about || ''
        }));
        setIsEditing(false);
        showToast('User profile updated successfully');
      } else {
        showToast('Failed to update profile', true);
      }
    } catch (err) {
      showToast('Network error updating user', true);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleToggleBadge = async () => {
    try {
      setLoadingAction(true);
      const nextState = !user.isVerified;
      const ok = await toggleUserVerificationBadge(user.id, nextState);
      if (ok) {
        setUser(prev => ({
          ...prev,
          isVerified: nextState,
          verifiedAt: nextState ? new Date().toLocaleDateString() : undefined
        }));
        showToast(nextState ? 'Green checkmark badge granted' : 'Verification badge revoked');
      } else {
        showToast('Failed to update verification badge', true);
      }
    } catch (err) {
      showToast('Network error updating badge', true);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleToggleBan = async () => {
    try {
      setLoadingAction(true);
      const isBanning = user.status === 'Active';
      const ok = isBanning ? await banUser(user.id) : await unbanUser(user.id);
      if (ok) {
        setUser(prev => ({
          ...prev,
          status: isBanning ? 'Banned' : 'Active'
        }));
        showToast(isBanning ? 'User access suspended/banned' : 'User unbanned and restored');
      } else {
        showToast('Failed to update ban status', true);
      }
    } catch (err) {
      showToast('Network error updating ban status', true);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm(`Are you sure you want to permanently delete user "${user.name}"? This removes all messages, chat memberships, and profile records.`)) {
      return;
    }
    try {
      setLoadingAction(true);
      const ok = await deleteUser(user.id);
      if (ok) {
        alert('User account deleted successfully.');
        router.push('/users');
      } else {
        showToast('Failed to delete user', true);
      }
    } catch (err) {
      showToast('Network error deleting user', true);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/users"
          className="inline-flex items-center gap-2 text-sm font-black text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <span>&larr;</span>
          <span>Back to Citizens Directory</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-black uppercase tracking-wider ${
            user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {user.status}
          </span>
          {user.isVerified && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black">
              <span>✅</span>
              <span>Verified Citizen</span>
            </span>
          )}
        </div>
      </div>

      {toast && (
        <div className={`p-4 rounded-2xl font-bold text-sm border animate-fadeIn ${
          toast.isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {toast.isError ? '⚠️' : '✓'} {toast.message}
        </div>
      )}

      {/* Main User Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-8">
        
        {/* User Identity Header & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-100 pb-6">
          <div className="flex items-center space-x-5">
            <div className="h-20 w-20 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-black text-3xl border border-emerald-200/60 shadow-inner">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">{user.name}</h1>
                {user.isVerified && <span className="text-emerald-500 text-lg">✅</span>}
              </div>
              <p className="text-slate-500 font-bold text-sm font-mono">{user.phoneNumber}</p>
              {user.googleEmail && (
                <p className="text-xs text-slate-400 font-medium">{user.googleEmail}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[11px] text-slate-400 font-mono">ID: {user.id}</span>
                <span className="inline-flex items-center gap-1 text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold border border-slate-200" title="Name, phone, handle, and bio are locked to protect user privacy and identity security">
                  <span>🔒</span>
                  <span>Profile fields locked by Admin Protocol</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleToggleBadge}
              disabled={loadingAction}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                user.isVerified
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border-slate-200'
              }`}
            >
              {user.isVerified ? 'Revoke Badge' : 'Grant Badge'}
            </button>
            <button
              onClick={handleToggleBan}
              disabled={loadingAction}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                user.status === 'Active'
                  ? 'bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-800 border-amber-200'
                  : 'bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-800 border-emerald-200'
              }`}
            >
              {user.status === 'Active' ? 'Suspend / Ban' : 'Unban'}
            </button>
            <button
              onClick={handleDeleteUser}
              disabled={loadingAction}
              className="p-2.5 rounded-xl bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 transition-all"
              title="Permanently Delete Citizen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Account Joined</span>
            <p className="text-xl font-black text-slate-800">{user.createdAt}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Messages Dispatched</span>
            <p className="text-xl font-black text-slate-800">{user.sentMessagesCount ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Conversations</span>
            <p className="text-xl font-black text-slate-800">{user.chatsCount ?? 0}</p>
          </div>
        </div>

        {/* Detailed User Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Citizen Telemetry & Status</h3>
          <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 text-sm overflow-hidden">
            <div className="flex justify-between p-4 bg-white">
              <span className="text-slate-500 font-bold">Last Active Signal</span>
              <span className="font-bold text-slate-800 font-mono text-xs">{user.lastSeen || 'Never recorded'}</span>
            </div>
            <div className="flex justify-between p-4 bg-white">
              <span className="text-slate-500 font-bold">Reports Received Against User</span>
              <span className={`font-black ${user.reportsReceivedCount ? 'text-red-600' : 'text-slate-800'}`}>
                {user.reportsReceivedCount || 0}
              </span>
            </div>
            <div className="flex justify-between p-4 bg-white">
              <span className="text-slate-500 font-bold">Verification Timestamp</span>
              <span className="font-medium text-slate-800">{user.verifiedAt || 'Not Verified'}</span>
            </div>
            <div className="flex justify-between p-4 bg-white">
              <span className="text-slate-500 font-bold">Bio / About Phrase</span>
              <span className="font-medium text-slate-800 max-w-sm text-right">{user.bio || 'None provided'}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
