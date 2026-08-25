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
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-black bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-black">Communities & Group Management</h1>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            Oversee VIBEZ public communities, channel structures, member limits, and group moderation.
          </p>
        </div>
        <button 
          onClick={() => showToast('Create Community dialog opened!')}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-sm transition-colors shadow-sm self-start md:self-auto"
        >
          + Create Official Community
        </button>
      </div>

      {toast && (
        <div className="p-3 bg-emerald-100 text-black rounded-lg text-sm font-bold border-l-4 border-emerald-600">
          {toast}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-gray-300 shadow-sm">
          <p className="text-xs font-black text-black uppercase tracking-wider">Total Communities</p>
          <p className="text-3xl font-black text-black mt-1">{communities.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border-2 border-gray-300 shadow-sm">
          <p className="text-xs font-black text-black uppercase tracking-wider">Active Channels</p>
          <p className="text-3xl font-black text-black mt-1">{communities.reduce((acc, c) => acc + (c.channels || 0), 0)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border-2 border-gray-300 shadow-sm">
          <p className="text-xs font-black text-black uppercase tracking-wider">Community Members</p>
          <p className="text-3xl font-black text-black mt-1">{communities.reduce((acc, c) => acc + (c.members || 0), 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border-2 border-gray-300 shadow-sm">
          <p className="text-xs font-black text-black uppercase tracking-wider">Max Group Size Limit</p>
          <p className="text-3xl font-black text-black mt-1">1,024</p>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-sm overflow-hidden">
        <div className="p-4 border-b-2 border-gray-200 bg-gray-100 flex items-center justify-between">
          <input
            type="text"
            placeholder="Search communities by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm w-full max-w-md focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-black"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y-2 divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-black">Community Name</th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-black">Category</th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-black">Members</th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-black">Channels</th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-black">Status</th>
                <th className="px-6 py-3 text-right text-xs font-black uppercase tracking-wider text-black">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-black text-black">{c.name}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{c.category}</td>
                  <td className="px-6 py-4 text-sm font-black text-black">{c.members.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{c.channels} channels</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                      c.status === 'Active' ? 'bg-emerald-200 text-black border border-emerald-400' : 'bg-amber-200 text-black border border-amber-400'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold space-x-2">
                    <button 
                      onClick={() => showToast(`Managing ${c.name}`)}
                      className="text-emerald-700 hover:text-emerald-900 font-black"
                    >
                      Manage
                    </button>
                    <button 
                      onClick={() => showToast(`Moderated ${c.name}`)}
                      className="text-red-700 hover:text-red-900 font-black"
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
