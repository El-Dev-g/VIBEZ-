'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { fetchStorageStats, purgeStorageCache } from '../../services/api';

export default function StoragePage() {
  const [toast, setToast] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchStorageStats();
    if (data) {
      setStats(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCleanupStatus = async () => {
    const res = await purgeStorageCache('EXPIRED_STORIES');
    if (res.success) {
      setToast(res.message || 'Transmission complete: Expired stories purged from core storage.');
      loadData();
    } else {
      setToast('Purge protocol failed.');
    }
    setTimeout(() => setToast(null), 4000);
  };

  const handlePurgeTemp = async () => {
    const res = await purgeStorageCache('TEMP_UPLOADS');
    if (res.success) {
      setToast(res.message || 'System cleanup: Temporary data cache neutralized.');
      loadData();
    } else {
      setToast('Cache purge failed.');
    }
    setTimeout(() => setToast(null), 4000);
  };

  const storageStats = stats?.breakdown || [
    { title: 'Global Storage', value: stats?.totalStorageGb || '0 GB', limit: stats?.storageLimitGb ? `Limit: ${stats.storageLimitGb}` : 'Limit: 0 GB', percentage: stats?.totalStoragePercentage || 0, color: 'bg-slate-900', icon: '🗄️' },
    { title: 'Media Assets', value: stats?.mediaSizeGb ? `${stats.mediaSizeGb} GB` : '0 GB', limit: 'Photos & Voice Notes', percentage: stats?.mediaPercentage || 0, color: 'bg-blue-500', icon: '🖼️' },
    { title: 'Ephemeral Stories', value: stats?.totalStatuses ? `${stats.totalStatuses} units` : '0 GB', limit: '24h Auto-Purge', percentage: stats?.statusPercentage || 0, color: 'bg-emerald-500', icon: '✨' },
    { title: 'Audit Backups', value: stats?.totalMessages ? `${stats.totalMessages} logs` : '0 GB', limit: 'System snapshots', percentage: stats?.logsPercentage || 0, color: 'bg-purple-500', icon: '🛡️' },
  ];

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Storage</h2>
          <p className="text-slate-500 font-bold mt-1">Manage cloud architecture, media retention, and cache protocols.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCleanupStatus}
            className="flex items-center gap-2 rounded-2xl bg-white border-2 border-slate-200 px-6 py-4 text-sm font-black text-slate-900 hover:bg-slate-50 transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Purge Stories
          </button>
          <button
            onClick={handlePurgeTemp}
            className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-black text-white hover:bg-black transition-all shadow-lg shadow-slate-900/20 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Flush Cache
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-sm font-black border border-emerald-100 animate-fadeIn">
          {toast}
        </div>
      )}

      {/* Storage Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {storageStats.map((item: any) => (
          <div key={item.title} className="group p-10 rounded-[2.5rem] bg-white border border-slate-200 shadow-xl shadow-slate-200/50 hover:border-emerald-500/20 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{item.icon} {item.title}</span>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{item.value}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-slate-900">{item.percentage || 0}%</span>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Utilization</p>
              </div>
            </div>
            
            <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div 
                className={`h-full ${item.color} transition-all duration-1000 ease-out rounded-full group-hover:brightness-110`} 
                style={{ width: `${item.percentage || 0}%` }}
              />
            </div>
            <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.limit}</p>
          </div>
        ))}
      </div>

      {/* Retention Policies */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-900/40">
        <div className="flex items-center gap-3 border-b border-white/10 pb-8 mb-8">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-900">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h3 className="text-xl font-black tracking-tight uppercase">System Retention Protocols</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Ephemeral Lifespan</label>
            <select className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-sm font-black text-white focus:outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer">
              <option value="24" className="bg-slate-900">24 Cycles (Standard)</option>
              <option value="48" className="bg-slate-900">48 Cycles</option>
              <option value="12" className="bg-slate-900">12 Cycles</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Max Signal Payload</label>
            <select className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-sm font-black text-white focus:outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer">
              <option value="100" className="bg-slate-900">100 MB Limit</option>
              <option value="50" className="bg-slate-900">50 MB Limit</option>
              <option value="200" className="bg-slate-900">200 MB Limit</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Media Compression</label>
            <select className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-sm font-black text-white focus:outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer">
              <option value="HD" className="bg-slate-900">High Fidelity (WebP)</option>
              <option value="BALANCED" className="bg-slate-900">Balanced Flux</option>
              <option value="MAX_SAVINGS" className="bg-slate-900">Maximum Savings</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

