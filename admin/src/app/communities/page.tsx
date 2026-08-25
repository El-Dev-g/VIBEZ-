'use client';

import { useState, useEffect } from 'react';
import { fetchAdminCommunities, AdminCommunityItem } from '@/services/api';

export default function CommunitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [communities, setCommunities] = useState<AdminCommunityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const data = await fetchAdminCommunities();
      if (data && data.length > 0) {
        setCommunities(data);
      } else {
        setCommunities([
          { id: 'c1', name: 'VIBEZ Creators Hub', members: 1240, channels: 8, status: 'Active', category: 'General', description: 'Creators Hub' },
          { id: 'c2', name: 'Android Developers Club', members: 890, channels: 5, status: 'Active', category: 'Tech', description: 'Developers Club' },
          { id: 'c3', name: 'Global Music Lounge', members: 3450, channels: 12, status: 'Active', category: 'Entertainment', description: 'Music Lounge' },
          { id: 'c4', name: 'Gaming Community', members: 2100, channels: 6, status: 'Active', category: 'Gaming', description: 'Gaming' },
          { id: 'c5', name: 'Crypto & Fintech Chat', members: 530, channels: 4, status: 'Moderated', category: 'Finance', description: 'Fintech' },
        ]);
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const filtered = communities.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communities & Group Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Oversee VIBEZ public communities, channel structures, member limits, and group moderation.
          </p>
        </div>
        <button 
          onClick={() => showToast('Create Community dialog opened!')}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm self-start md:self-auto"
        >
          + Create Official Community
        </button>
      </div>

      {toast && (
        <div className="p-3 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-medium border-l-4 border-emerald-500">
          {toast}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Total Communities</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">24</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Active Channels</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">112</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Community Members</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">8,210</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Max Group Size Limit</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">1,024</p>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <input
            type="text"
            placeholder="Search communities by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-full max-w-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Community Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Members</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Channels</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.category}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{c.members.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.channels} channels</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      c.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                    <button 
                      onClick={() => showToast(`Managing ${c.name}`)}
                      className="text-emerald-600 hover:text-emerald-800"
                    >
                      Manage
                    </button>
                    <button 
                      onClick={() => showToast(`Moderated ${c.name}`)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Moderate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
