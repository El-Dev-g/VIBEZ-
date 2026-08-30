'use client';

import { useState } from 'react';
import { AppUpdate, createUpdateApi } from '../services/api';
import DashboardShell from './DashboardShell';

interface UpdatesManagerProps {
  initialUpdate: AppUpdate | null;
}

export default function UpdatesManager({ initialUpdate }: UpdatesManagerProps) {
  const [latestUpdate, setLatestUpdate] = useState<AppUpdate | null>(initialUpdate);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await createUpdateApi(formData);
      if (result) {
        setLatestUpdate(result);
        setSuccess('App update pushed successfully!');
        setFormData(prev => ({
            ...prev,
            versionCode: result.versionCode + 1,
            versionName: '',
            updateTitle: '',
            updateMessage: ''
        }));
      } else {
        setError('Failed to push update. Please check your credentials.');
      }
    } catch (err) {
      setError('A network error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardShell title="App Updates Management">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Update Form */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
          <h2 className="text-xl font-black text-white mb-6">Push New Update</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Version Code</label>
                <input
                  type="number"
                  value={formData.versionCode}
                  onChange={e => setFormData({ ...formData, versionCode: parseInt(e.target.value) })}
                  className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Version Name</label>
                <input
                  type="text"
                  placeholder="e.g. 1.1.0"
                  value={formData.versionName}
                  onChange={e => setFormData({ ...formData, versionName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Update Title</label>
              <input
                type="text"
                placeholder="e.g. Security & Performance Update"
                value={formData.updateTitle}
                onChange={e => setFormData({ ...formData, updateTitle: e.target.value })}
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Release Notes</label>
              <textarea
                rows={4}
                placeholder="Describe what is new in this version..."
                value={formData.updateMessage}
                onChange={e => setFormData({ ...formData, updateMessage: e.target.value })}
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Download URL (APK Link)</label>
              <input
                type="url"
                value={formData.downloadUrl}
                onChange={e => setFormData({ ...formData, downloadUrl: e.target.value })}
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                required
              />
            </div>

            <div className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                id="isCritical"
                checked={formData.isCritical}
                onChange={e => setFormData({ ...formData, isCritical: e.target.checked })}
                className="w-5 h-5 rounded border-white/10 bg-[#0f172a] text-emerald-500 focus:ring-emerald-500"
              />
              <label htmlFor="isCritical" className="text-sm font-bold text-white">Mark as Critical Update</label>
            </div>

            {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold">{error}</div>}
            {success && <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold">{success}</div>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
            >
              {isLoading ? 'PUSHING UPDATE...' : 'PUSH UPDATE TO ALL USERS'}
            </button>
          </form>
        </div>

        {/* Current Update View */}
        <div className="space-y-6">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
            <h2 className="text-xl font-black text-white mb-6">Current Live Version</h2>
            {latestUpdate ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-xs font-bold text-gray-400 uppercase">Version</span>
                  <span className="text-lg font-black text-emerald-400">v{latestUpdate.versionName}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-xs font-bold text-gray-400 uppercase">Code</span>
                  <span className="text-white font-bold">{latestUpdate.versionCode}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-xs font-bold text-gray-400 uppercase">Released At</span>
                  <span className="text-white font-medium">{new Date(latestUpdate.releasedAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase mb-2">Release Notes</span>
                  <div className="bg-[#0f172a] rounded-xl p-4 text-gray-300 text-sm leading-relaxed border border-white/5">
                    <p className="font-bold text-white mb-1">{latestUpdate.updateTitle}</p>
                    {latestUpdate.updateMessage}
                  </div>
                </div>
                {latestUpdate.isCritical && (
                  <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-xs font-black uppercase tracking-wider">Critical Release</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 font-bold">No update records found.</p>
              </div>
            )}
          </div>

          <div className="bg-emerald-500/10 rounded-2xl p-6 border border-emerald-500/20">
            <h3 className="text-emerald-400 font-black text-sm uppercase tracking-widest mb-2">Admin Tip</h3>
            <p className="text-gray-300 text-xs leading-relaxed">
              When you push a new update, all VIBEZ Android users will receive a notification the next time they open their app settings. Marking an update as <strong>Critical</strong> will highlight it in red for the user.
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
