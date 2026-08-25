'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { fetchAnalytics } from '@/services/api';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const data = await fetchAnalytics();
      if (data) {
        setAnalytics(data);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const metrics = [
    { label: 'Registered Citizens', value: analytics?.totalUsers ?? '0', change: analytics?.userGrowth ?? '0%', icon: '👥' },
    { label: 'Data Transmitted', value: analytics?.totalMessages ?? '0', change: 'Encrypted traffic', icon: '📡' },
    { label: 'Active Channels', value: analytics?.totalCalls ?? '0', change: 'Real-time WebRTC', icon: '📞' },
    { label: 'Communities', value: analytics?.totalCommunities ?? '0', change: 'Public Groups', icon: '🌐' },
  ];

  const recentCalls = analytics?.recentCalls ?? [];

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Analytics</h2>
          <p className="text-slate-500 font-bold mt-1">Monitor global signal traffic and network health parameters.</p>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m) => (
          <div key={m.label} className="group p-8 rounded-[2rem] bg-white border border-slate-200 shadow-xl shadow-slate-200/50 hover:border-emerald-500/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{m.icon}</span>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{m.change}</span>
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{m.label}</h3>
            <p className="mt-2 text-3xl font-black text-slate-900 tracking-tight">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Infrastructure Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <HealthCard title="Relay Servers" status="Operational" latency={analytics?.latency ?? '0ms'} loss={analytics?.packetLoss ?? '0%'} />
        <HealthCard title="Signaling Node" status="Connected" traffic={`${analytics?.activeDailyUsers ?? 0} units`} />
        <HealthCard title="Media Protocol" status="HD Ready" codec={analytics?.codec ?? 'Opus / VP8'} />
      </div>

      {/* Recent Transmissions Log */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-slate-900 rounded-full"></div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Signal Feed</h3>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Transmission ID</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Type</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Source</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Destination</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Duration</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Latency</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recentCalls.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center">
                      <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No active signal transmissions detected.</p>
                    </td>
                  </tr>
                ) : (
                  recentCalls.map((call: any) => (
                    <tr key={call.id} className="group hover:bg-slate-50/50 transition-all duration-200">
                      <td className="whitespace-nowrap px-8 py-6 font-mono text-[10px] font-bold text-slate-400 uppercase">{call.id}</td>
                      <td className="whitespace-nowrap px-8 py-6">
                        <span className="text-sm font-black text-slate-900">{call.type}</span>
                      </td>
                      <td className="whitespace-nowrap px-8 py-6 text-sm font-bold text-slate-600">{call.caller}</td>
                      <td className="whitespace-nowrap px-8 py-6 text-sm font-bold text-slate-600">{call.receiver}</td>
                      <td className="whitespace-nowrap px-8 py-6 text-sm font-black text-slate-900">{call.duration}</td>
                      <td className="whitespace-nowrap px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          <span className="text-sm font-black text-emerald-600">{call.latency}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-8 py-6 text-right">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          call.status === 'Ongoing' ? 'bg-blue-50 text-blue-700 border border-blue-100 animate-pulse' : 'bg-slate-50 text-slate-600 border border-slate-100'
                        }`}>
                          {call.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthCard({ title, status, latency, loss, traffic, codec }: any) {
  return (
    <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-xl shadow-slate-900/20">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{title}</h4>
        <span className="px-2.5 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">{status}</span>
      </div>
      <div className="space-y-1">
        {latency && <p className="text-2xl font-black tracking-tight">{latency} <span className="text-xs font-bold text-slate-500 uppercase ml-1">Latency</span></p>}
        {traffic && <p className="text-2xl font-black tracking-tight">{traffic}</p>}
        {codec && <p className="text-2xl font-black tracking-tight">{codec}</p>}
        {loss && <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Packet Loss: {loss}</p>}
      </div>
    </div>
  );
}

