'use client';

import { useState } from 'react';

export default function StoragePage() {
  const [toast, setToast] = useState<string | null>(null);

  const storageStats = [
    { title: 'Total Storage Used', value: '42.8 GB', limit: '250.0 GB', percentage: 17.1, color: 'bg-emerald-500' },
    { title: 'Chat Images & Media', value: '28.4 GB', limit: 'Photos, videos & voice notes', percentage: 66, color: 'bg-blue-500' },
    { title: 'Active Status Stories', value: '8.2 GB', limit: 'Auto-purged after 24 hours', percentage: 19, color: 'bg-purple-500' },
    { title: 'System Backups & Logs', value: '6.2 GB', limit: 'Database snapshots & audits', percentage: 15, color: 'bg-amber-500' },
  ];

  const handleCleanupStatus = () => {
    setToast('Cleaned up 1.4 GB of expired status stories older than 24 hours!');
    setTimeout(() => setToast(null), 4000);
  };

  const handlePurgeTemp = () => {
    setToast('Purged temporary uploads and unreferenced media files!');
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media & Cloud Storage Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor media storage usage, configure media retention policies, and clean up expired story media.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCleanupStatus}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
          >
            🧹 Purge Expired Stories
          </button>
          <button
            onClick={handlePurgeTemp}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
          >
            ⚡ Cleanup Temp Cache
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-4 bg-emerald-100 text-emerald-800 rounded-xl text-sm font-semibold border-l-4 border-emerald-500">
          {toast}
        </div>
      )}

      {/* Storage Visual Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {storageStats.map((item) => (
          <div key={item.title} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900 text-sm">{item.title}</span>
              <span className="text-sm font-extrabold text-gray-900">{item.value}</span>
            </div>
            <p className="text-xs text-gray-500">{item.limit}</p>
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
              <div 
                className={`h-full ${item.color} transition-all duration-500 rounded-full`} 
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Media Retention Settings Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
          ⚙️ Media Retention & Quality Policies
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-gray-600">Status Story Lifespan</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="24">24 Hours (Standard)</option>
              <option value="48">48 Hours</option>
              <option value="12">12 Hours</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-gray-600">Max Upload File Size</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="100">100 MB per file</option>
              <option value="50">50 MB per file</option>
              <option value="200">200 MB per file</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-gray-600">HD Image Compression</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white">
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
