'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Server, Cpu, Terminal, Zap, Activity, ArrowUpRight, ShieldCheck, RefreshCw, BarChart2, Radio } from 'lucide-react';

export interface SdkMetric {
  name: 'Kotlin' | 'TypeScript' | 'Python' | 'Go';
  label: string;
  share: number; // percentage 0-100
  rpm: number; // requests per min
  avgLatency: number; // ms
  successRate: number; // percentage
  activeClients: number;
  color: string;
  badgeBg: string;
  icon: any;
  trend: string;
}

export interface LiveRequestLog {
  id: string;
  timestamp: string;
  sdk: 'Kotlin' | 'TypeScript' | 'Python' | 'Go';
  endpoint: string;
  method: 'GET' | 'POST' | 'WS';
  status: number;
  latencyMs: number;
  ipRegion: string;
}

export const SdkDistributionVisualizer: React.FC = () => {
  const [metrics, setMetrics] = useState<SdkMetric[]>([
    {
      name: 'Kotlin',
      label: 'Android Kotlin SDK',
      share: 48,
      rpm: 14280,
      avgLatency: 28,
      successRate: 99.98,
      activeClients: 12450,
      color: '#10b981', // Emerald
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: Smartphone,
      trend: '+14.2%',
    },
    {
      name: 'TypeScript',
      label: 'TypeScript / Node SDK',
      share: 31,
      rpm: 9240,
      avgLatency: 34,
      successRate: 99.95,
      activeClients: 8120,
      color: '#38bdf8', // Sky
      badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      icon: Server,
      trend: '+8.7%',
    },
    {
      name: 'Python',
      label: 'Python Data/AI SDK',
      share: 13,
      rpm: 3870,
      avgLatency: 45,
      successRate: 99.89,
      activeClients: 2980,
      color: '#f59e0b', // Amber
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      icon: Cpu,
      trend: '+22.4%',
    },
    {
      name: 'Go',
      label: 'Go Microservice SDK',
      share: 8,
      rpm: 2380,
      avgLatency: 12,
      successRate: 99.99,
      activeClients: 1450,
      color: '#a855f7', // Purple
      badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      icon: Terminal,
      trend: '+5.1%',
    },
  ]);

  const [liveStream, setLiveStream] = useState<LiveRequestLog[]>([
    { id: '1', timestamp: '13:24:02.102', sdk: 'Kotlin', endpoint: '/api/messages', method: 'POST', status: 200, latencyMs: 24, ipRegion: 'US-East' },
    { id: '2', timestamp: '13:24:01.890', sdk: 'TypeScript', endpoint: '/api/auth/phone/otp', method: 'POST', status: 200, latencyMs: 38, ipRegion: 'EU-West' },
    { id: '3', timestamp: '13:24:01.420', sdk: 'Kotlin', endpoint: '/api/statuses', method: 'POST', status: 200, latencyMs: 31, ipRegion: 'US-West' },
    { id: '4', timestamp: '13:24:00.910', sdk: 'Python', endpoint: '/api/system/status', method: 'GET', status: 200, latencyMs: 42, ipRegion: 'AP-South' },
    { id: '5', timestamp: '13:24:00.340', sdk: 'Go', endpoint: '/api/calls/signaling', method: 'WS', status: 101, latencyMs: 11, ipRegion: 'EU-Central' },
  ]);

  const [isSimulatingBurst, setIsSimulatingBurst] = useState(false);
  const [selectedSdkFilter, setSelectedSdkFilter] = useState<'All' | 'Kotlin' | 'TypeScript' | 'Python' | 'Go'>('All');

  // Real-time fluctuating stream simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const sdks: Array<'Kotlin' | 'TypeScript' | 'Python' | 'Go'> = ['Kotlin', 'Kotlin', 'TypeScript', 'TypeScript', 'Python', 'Go'];
      const randomSdk = sdks[Math.floor(Math.random() * sdks.length)];
      const endpoints = [
        { ep: '/api/messages', method: 'POST' as const },
        { ep: '/api/auth/phone/otp', method: 'POST' as const },
        { ep: '/api/system/status', method: 'GET' as const },
        { ep: '/api/statuses', method: 'POST' as const },
        { ep: '/api/verification/checkout', method: 'POST' as const },
        { ep: '/api/calls/signaling', method: 'WS' as const },
      ];
      const selected = endpoints[Math.floor(Math.random() * endpoints.length)];
      const now = new Date();
      const timeStr = `${now.toTimeString().split(' ')[0]}.${now.getMilliseconds().toString().padStart(3, '0')}`;
      const regions = ['US-East', 'US-West', 'EU-West', 'EU-Central', 'AP-South', 'SA-East'];

      const newLog: LiveRequestLog = {
        id: Math.random().toString(),
        timestamp: timeStr,
        sdk: randomSdk,
        endpoint: selected.ep,
        method: selected.method,
        status: selected.method === 'WS' ? 101 : 200,
        latencyMs: Math.floor(Math.random() * 35) + (randomSdk === 'Go' ? 8 : randomSdk === 'Kotlin' ? 20 : 32),
        ipRegion: regions[Math.floor(Math.random() * regions.length)],
      };

      setLiveStream((prev) => [newLog, ...prev.slice(0, 7)]);
    }, 1600);

    return () => clearInterval(interval);
  }, []);

  const triggerSdkBurst = (target: 'Kotlin' | 'TypeScript' | 'Python' | 'Go') => {
    setIsSimulatingBurst(true);
    setMetrics((prev) =>
      prev.map((m) => {
        if (m.name === target) {
          return { ...m, rpm: m.rpm + 2500, share: Math.min(65, m.share + 8) };
        }
        return { ...m, share: Math.max(4, m.share - 3) };
      })
    );
    setTimeout(() => {
      setIsSimulatingBurst(false);
    }, 2000);
  };

  const filteredLogs = selectedSdkFilter === 'All'
    ? liveStream
    : liveStream.filter((l) => l.sdk === selectedSdkFilter);

  const totalRpm = metrics.reduce((acc, m) => acc + m.rpm, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((sdk) => {
          const Icon = sdk.icon;
          return (
            <div
              key={sdk.name}
              className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 shadow-xl space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl bg-slate-900`} style={{ color: sdk.color }}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">{sdk.name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">SDK Share</span>
                  </div>
                </div>
                <span className="text-xl font-black text-white font-mono">{sdk.share}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${sdk.share}%`, backgroundColor: sdk.color }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono pt-1">
                <div className="text-slate-400">
                  <span className="font-bold text-slate-200">{sdk.rpm.toLocaleString()}</span> req/min
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                  <span>{sdk.avgLatency}ms</span>
                  <span className="text-[10px] text-slate-500">avg</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-Time Distribution Matrix & Live Request Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Multi-SDK Distribution Bar & Burst Simulator */}
        <div className="lg:col-span-7 rounded-2xl bg-[#070b14] border border-slate-800 p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Real-Time SDK Traffic Distribution
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Aggregate throughput: <span className="text-emerald-400 font-mono font-bold">{totalRpm.toLocaleString()} req/min</span> • Powered by <span className="text-emerald-400 font-bold">PRIGID GROUP Global CDN</span>
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>LIVE CLUSTER</span>
            </div>
          </div>

          {/* Unified Visual Distribution Band */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono font-bold text-slate-400">
              <span>Traffic Distribution Band</span>
              <span className="text-slate-300">100% Normalized</span>
            </div>

            <div className="h-6 w-full rounded-xl overflow-hidden flex bg-slate-900 border border-slate-800 p-0.5 gap-0.5 shadow-inner">
              {metrics.map((m) => (
                <div
                  key={m.name}
                  style={{ width: `${m.share}%`, backgroundColor: m.color }}
                  className="h-full first:rounded-l-lg last:rounded-r-lg transition-all duration-500 hover:opacity-90 flex items-center justify-center text-[10px] font-black text-slate-950 truncate px-1"
                  title={`${m.name}: ${m.share}% (${m.rpm} req/min)`}
                >
                  {m.share >= 10 ? `${m.name} ${m.share}%` : ''}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs font-mono">
              {metrics.map((m) => (
                <div key={m.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }}></span>
                  <span className="text-slate-300 font-bold">{m.name}:</span>
                  <span className="text-slate-400">{m.share}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* SDK Comparison Matrix */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-500 uppercase text-[10px]">
                  <th className="pb-2.5 font-bold">SDK Platform</th>
                  <th className="pb-2.5 font-bold">Share</th>
                  <th className="pb-2.5 font-bold">Throughput</th>
                  <th className="pb-2.5 font-bold">Latency</th>
                  <th className="pb-2.5 font-bold">Reliability</th>
                  <th className="pb-2.5 font-bold text-right">Simulate Burst</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {metrics.map((sdk) => (
                  <tr key={sdk.name} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sdk.color }} />
                      <span>{sdk.name}</span>
                    </td>
                    <td className="py-3 text-slate-300 font-bold">{sdk.share}%</td>
                    <td className="py-3 text-slate-300">{sdk.rpm.toLocaleString()} /m</td>
                    <td className="py-3 text-emerald-400">{sdk.avgLatency} ms</td>
                    <td className="py-3 text-emerald-400">{sdk.successRate}%</td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => triggerSdkBurst(sdk.name)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200 hover:text-white transition-colors"
                      >
                        ⚡ Burst +2.5k
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Live Request Stream Feed */}
        <div className="lg:col-span-5 rounded-2xl bg-[#070b14] border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Live SDK Request Stream
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Auto-refresh: 1.6s</span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(['All', 'Kotlin', 'TypeScript', 'Python', 'Go'] as const).map((sdk) => (
              <button
                key={sdk}
                type="button"
                onClick={() => setSelectedSdkFilter(sdk)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                  selectedSdkFilter === sdk
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {sdk}
              </button>
            ))}
          </div>

          {/* Stream Log Items */}
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {filteredLogs.map((log) => {
              const sdkColor =
                log.sdk === 'Kotlin'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : log.sdk === 'TypeScript'
                  ? 'text-sky-400 bg-sky-500/10 border-sky-500/20'
                  : log.sdk === 'Python'
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  : 'text-purple-400 bg-purple-500/10 border-purple-500/20';

              return (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${sdkColor}`}>
                      {log.sdk}
                    </span>
                    <span className="text-slate-300 font-bold truncate">{log.endpoint}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-500">{log.ipRegion}</span>
                    <span className="text-emerald-400 font-bold text-[11px]">{log.latencyMs}ms</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300">
                      {log.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
