'use client';

import { useState, useEffect } from 'react';
import { fetchStorageStats, purgeStorageCache } from '@/services/api';

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
      setToast(res.message || 'Cleaned up expired status stories older than 24 hours!');
      loadData();
    } else {
      setToast('Failed to purge status story cache.');
    }
    setTimeout(() => setToast(null), 4000);
  };

  const handlePurgeTemp = async () => {
    const res = await purgeStorageCache('TEMP_UPLOADS');
    if (res.success) {
      setToast(res.message || 'Purged temporary uploads and unreferenced media files!');
      loadData();
    } else {
      setToast('Failed to purge temporary uploads.');
    }
    setTimeout(() => setToast(null), 4000);
  };

  const defaultBreakdown = [
    { title: 'Total Storage Used', value: stats?.totalStorageGb || '42.8 GB', limit: stats?.storageLimitGb ? `Limit: ${stats.storageLimitGb}` : 'Limit: 250.0 GB', percentage: 17.1, color: 'bg-emerald-500' },
    { title: 'Chat Images & Media', value: stats?.mediaSizeMb ? `${stats.mediaSizeMb} MB` : '28.4 GB', limit: 'Photos, videos & voice notes', percentage: 66, color: 'bg-blue-500' },
    { title: 'Active Status Stories', value: stats?.totalStatuses ? `${stats.totalStatuses} active stories` : '8.2 GB', limit: 'Auto-purged after 24 hours', percentage: 19, color: 'bg-purple-500' },
    { title: 'System Backups & Logs', value: stats?.totalMessages ? `${stats.totalMessages} message logs` : '6.2 GB', limit: 'Database snapshots & audits', percentage: 15, color: 'bg-amber-500' },
  ];

  const storageStats = stats?.breakdown || defaultBreakdown;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-black">Media & Cloud Storage Management</h1>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            Monitor media storage usage, configure media retention policies, and clean up expired story media.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCleanupStatus}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm rounded-lg transition-colors shadow-sm"
          >
            🧹 Purge Expired Stories
          </button>
          <button
            onClick={handlePurgeTemp}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-lg transition-colors shadow-sm"
          >
            ⚡ Cleanup Temp Cache
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-4 bg-emerald-100 text-black rounded-xl text-sm font-bold border-l-4 border-emerald-600">
          {toast}
        </div>
      )}

      {/* Storage Visual Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {storageStats.map((item: any) => (
          <div key={item.title} className="bg-white p-6 rounded-2xl border-2 border-gray-300 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-extrabold text-black text-base">{item.title}</span>
              <span className="text-lg font-black text-black">{item.value}</span>
            </div>
            <p className="text-xs font-bold text-gray-800">{item.limit}</p>
            <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden border border-gray-300">
              <div 
                className={`h-full ${item.color} transition-all duration-500 rounded-full`} 
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Media Retention Settings Card */}
      <div className="bg-white p-6 rounded-2xl border-2 border-gray-300 shadow-sm space-y-4">
        <h2 className="text-lg font-black text-black border-b-2 border-gray-200 pb-3">
          ⚙️ Media Retention & Quality Policies
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-wider text-black">Status Story Lifespan</label>
            <select className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white font-bold text-black">
              <option value="24">24 Hours (Standard)</option>
              <option value="48">48 Hours</option>
              <option value="12">12 Hours</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-wider text-black">Max Upload File Size</label>
            <select className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white font-bold text-black">
              <option value="100">100 MB per file</option>
              <option value="50">50 MB per file</option>
              <option value="200">200 MB per file</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-wider text-black">HD Image Compression</label>
            <select className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white font-bold text-black">
              <option value="HD">High Quality (HD WebP)</option>
              <option value="BALANCED">Balanced Compression</option>
              <option value="MAX_SAVINGS">Maximum Data Saver</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

