'use client';

import React, { useState } from 'react';
import { AppUpdate, createUpdateApi, fetchLatestUpdate } from '../services/api';

interface UpdatesManagerProps {
  initialUpdate: AppUpdate | null;
}

export default function UpdatesManager({ initialUpdate }: UpdatesManagerProps) {
  const [latestUpdate, setLatestUpdate] = useState<AppUpdate | null>(initialUpdate);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    versionCode: initialUpdate ? initialUpdate.versionCode + 1 : 1,
    versionName: initialUpdate ? '' : '1.0.0',
    updateTitle: '',
    updateMessage: '',
    downloadUrl: initialUpdate ? initialUpdate.downloadUrl : 'https://vibez.app/download/android/latest',
    isCritical: false
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetchLatestUpdate();
      if (res) {
        setLatestUpdate(res);
      }
    } catch (err) {
      console.error('Failed to refresh updates:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await createUpdateApi(formData);
      if (result) {
        setLatestUpdate(result);
        setSuccess('App update pushed successfully to all VIBEZ users!');
        setFormData(prev => ({
          ...prev,
          versionCode: result.versionCode + 1,
          versionName: '',
          updateTitle: '',
          updateMessage: ''
        }));
      } else {
        setError('Failed to push update. Please verify server connection.');
      }
    } catch (err) {
      setError('A network error occurred while pushing update.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">App Updates Management</h2>
          <p className="text-slate-500 font-bold mt-1">Publish new Android releases, release notes, and mandatory updates.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="self-start flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-700 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-500' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Update Form */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Push New Release</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Version Code</label>
                <input
                  type="number"
                  value={formData.versionCode}
                  onChange={e => setFormData({ ...formData, versionCode: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Version Name</label>
                <input
                  type="text"
                  placeholder="e.g. 1.1.0"
                  value={formData.versionName}
                  onChange={e => setFormData({ ...formData, versionName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Update Title</label>
              <input
                type="text"
                placeholder="e.g. Security & Performance Release"
                value={formData.updateTitle}
                onChange={e => setFormData({ ...formData, updateTitle: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Release Notes / Changelog</label>
              <textarea
                rows={4}
                placeholder="Describe new features, bug fixes, or enhancements..."
                value={formData.updateMessage}
                onChange={e => setFormData({ ...formData, updateMessage: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-medium focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Download URL (Direct APK Link)</label>
              <input
                type="url"
                value={formData.downloadUrl}
                onChange={e => setFormData({ ...formData, downloadUrl: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-medium focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none text-sm font-mono"
                required
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <input
                type="checkbox"
                id="isCritical"
                checked={formData.isCritical}
                onChange={e => setFormData({ ...formData, isCritical: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="isCritical" className="text-xs font-bold text-slate-700 cursor-pointer">
                Mark as Critical Release (Prominently alerts users to update immediately)
              </label>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                {error}
              </div>
            )}
            {success && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <span>✅</span>
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] uppercase tracking-wider text-xs"
            >
              {isLoading ? 'Publishing Release...' : 'Push Release to App Ecosystem'}
            </button>
          </form>
        </div>

        {/* Current Live Release Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-slate-900 rounded-full"></div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Active Live Version</h3>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
                Live on Network
              </span>
            </div>

            {latestUpdate ? (
              <div className="space-y-5">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Version String</span>
                  <span className="text-2xl font-black text-emerald-600 font-mono">v{latestUpdate.versionName}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Internal Code</span>
                  <span className="text-sm font-black text-slate-900 font-mono">#{latestUpdate.versionCode}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Publication Date</span>
                  <span className="text-xs font-bold text-slate-700">{new Date(latestUpdate.releasedAt).toLocaleString()}</span>
                </div>
                
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Changelog Preview</span>
                  <div className="bg-slate-50 rounded-2xl p-4 text-slate-700 text-xs leading-relaxed border border-slate-200">
                    <p className="font-bold text-slate-900 mb-1">{latestUpdate.updateTitle}</p>
                    {latestUpdate.updateMessage}
                  </div>
                </div>

                <div className="pt-2">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Download Target</span>
                  <div className="bg-slate-50 rounded-xl p-3 text-slate-600 text-xs font-mono truncate border border-slate-200">
                    {latestUpdate.downloadUrl}
                  </div>
                </div>

                {latestUpdate.isCritical && (
                  <div className="flex items-center gap-3 text-red-700 bg-red-50 p-4 rounded-2xl border border-red-200">
                    <span className="text-lg">⚠️</span>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider">Critical Release Enforced</p>
                      <p className="text-[11px] text-red-600 font-medium">All mobile clients will be prompted with high priority.</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active releases recorded.</p>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 shadow-xl shadow-slate-900/10 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest">
              <span>⚡</span>
              <span>Live Synchronization</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              When an update is pushed, the Android mobile app automatically queries the backend at <code className="text-emerald-400 bg-black/30 px-1.5 py-0.5 rounded font-mono">/api/app/updates/latest</code> during version checks and reflects new release notes immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
