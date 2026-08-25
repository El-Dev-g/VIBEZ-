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
    <div className="space-y-10 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Communities</h2>
          <p className="text-slate-500 font-bold mt-1">Oversee public channels, member limits, and group moderation.</p>
        </div>
        <button 
          onClick={() => showToast('Create Community dialog opened!')}
          className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-black text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Official Community
        </button>
      </div>

      {toast && (
        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-sm font-black border border-emerald-100 animate-fadeIn">
          {toast}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Communities" value={communities.length} icon="🌐" color="bg-blue-500" />
        <StatCard title="Active Channels" value={communities.reduce((acc, c) => acc + (c.channels || 0), 0)} icon="📺" color="bg-purple-500" />
        <StatCard title="Global Members" value={communities.reduce((acc, c) => acc + (c.members || 0), 0).toLocaleString()} icon="👥" color="bg-emerald-500" />
        <StatCard title="Group Limit" value="1,024" icon="🛡️" color="bg-slate-700" />
      </div>

      {/* Filter and Table Container */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 group max-w-xl">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search communities by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 shadow-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Community Name</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Classification</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pop. Size</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Architecture</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Operational Status</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Commands</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((c) => (
                  <tr key={c.id} className="group hover:bg-slate-50/50 transition-all duration-200">
                    <td className="whitespace-nowrap px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-black text-xs border border-slate-200 group-hover:scale-110 transition-transform">
                          {c.name.charAt(0)}
                        </div>
                        <div className="text-sm font-black text-slate-900">{c.name}</div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-8 py-6">
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200">{c.category}</span>
                    </td>
                    <td className="whitespace-nowrap px-8 py-6 text-sm font-black text-slate-900">{c.members.toLocaleString()}</td>
                    <td className="whitespace-nowrap px-8 py-6 text-sm font-bold text-slate-500">{c.channels} Channels</td>
                    <td className="whitespace-nowrap px-8 py-6">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                        c.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        {c.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => showToast(`Managing ${c.name}`)}
                          className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          Manage
                        </button>
                        <button 
                          onClick={() => showToast(`Moderated ${c.name}`)}
                          className="px-4 py-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          Moderate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="relative group overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50">
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white text-xl shadow-lg shadow-current/20 transition-transform group-hover:scale-110`}>
          {icon}
        </div>
      </div>
      <div className="mt-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</h3>
        <p className="mt-1 text-3xl font-black text-slate-900 tracking-tight">
          {value}
        </p>
      </div>
    </div>
  );
}
