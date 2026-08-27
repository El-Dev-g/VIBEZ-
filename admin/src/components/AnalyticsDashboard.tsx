'use client';

import { useState, useEffect } from 'react';
import { fetchAnalytics } from '../services/api';

export default function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchAnalytics();
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Platform Analytics</h2>
          <p className="text-slate-500 font-bold mt-1">Real-time engagement telemetry and growth signals.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Daily Active Users" value={data?.dau || 0} icon="📈" color="bg-blue-500" />
        <StatCard title="Total Messages" value={data?.totalMessages || 0} icon="💬" color="bg-emerald-500" />
        <StatCard title="New Signups" value={data?.newSignups || 0} icon="✨" color="bg-purple-500" />
        <StatCard title="Engagement Rate" value={`${data?.engagementRate || 0}%`} icon="🔥" color="bg-amber-500" />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white text-xl`}>
          {icon}
        </div>
      </div>
      <div className="mt-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
        <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );
}
