'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  Zap,
  ShieldCheck,
  Server,
  Key,
  Play,
  Webhook,
  BookOpen,
  ArrowUpRight,
  RefreshCw,
  Terminal,
  Cpu,
  CheckCircle,
  Clock,
  Globe
} from 'lucide-react';
import { useDeveloperAuth } from '../context/DeveloperAuthContext';

export interface OverviewLog {
  id: string;
  timestamp: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'WS';
  status: number;
  latencyMs: number;
  region: string;
}

export const DashboardOverview: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({ onNavigateTab }) => {
  const { user, keys } = useDeveloperAuth();
  const [liveLogs, setLiveLogs] = useState<OverviewLog[]>([
    { id: '1', timestamp: '15:05:02.102', endpoint: '/api/developer/server/health-check', method: 'GET', status: 200, latencyMs: 12, region: 'US-East' },
    { id: '2', timestamp: '15:05:01.890', endpoint: '/api/developer/server/dispatch-message', method: 'POST', status: 200, latencyMs: 24, region: 'EU-West' },
    { id: '3', timestamp: '15:05:01.420', endpoint: '/api/developer/server/generate-rtc-token', method: 'POST', status: 200, latencyMs: 18, region: 'US-West' },
    { id: '4', timestamp: '15:05:00.910', endpoint: '/api/developer/server/verify-webhook', method: 'POST', status: 200, latencyMs: 29, region: 'AP-South' },
    { id: '5', timestamp: '15:05:00.340', endpoint: '/api/developer/server/issue-oauth-token', method: 'POST', status: 200, latencyMs: 31, region: 'EU-Central' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const endpoints = [
        { ep: '/api/developer/server/health-check', method: 'GET' as const },
        { ep: '/api/developer/server/dispatch-message', method: 'POST' as const },
        { ep: '/api/developer/server/generate-rtc-token', method: 'POST' as const },
        { ep: '/api/developer/server/verify-webhook', method: 'POST' as const },
        { ep: '/api/developer/server/issue-oauth-token', method: 'POST' as const },
        { ep: '/api/developer/server/custom-server-status', method: 'GET' as const },
      ];
      const selected = endpoints[Math.floor(Math.random() * endpoints.length)];
      const now = new Date();
      const timeStr = `${now.toTimeString().split(' ')[0]}.${now.getMilliseconds().toString().padStart(3, '0')}`;
      const regions = ['US-East', 'US-West', 'EU-West', 'EU-Central', 'AP-South', 'SA-East'];

      const newLog: OverviewLog = {
        id: Math.random().toString(),
        timestamp: timeStr,
        endpoint: selected.ep,
        method: selected.method,
        status: 200,
        latencyMs: Math.floor(Math.random() * 25) + 10,
        region: regions[Math.floor(Math.random() * regions.length)],
      };

      setLiveLogs((prev) => [newLog, ...prev.slice(0, 5)]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const systemServices = [
    { name: 'Health Check API', path: '/api/developer/server/health-check', status: 'Operational', latency: '12ms', method: 'GET' },
    { name: 'Cluster Telemetry', path: '/api/developer/server/custom-server-status', status: 'Operational', latency: '15ms', method: 'GET' },
    { name: 'OAuth Token Issuer', path: '/api/developer/server/issue-oauth-token', status: 'Operational', latency: '28ms', method: 'POST' },
    { name: 'Message Dispatcher', path: '/api/developer/server/dispatch-message', status: 'Operational', latency: '24ms', method: 'POST' },
    { name: 'WebRTC Signaling', path: '/api/developer/server/generate-rtc-token', status: 'Operational', latency: '18ms', method: 'POST' },
    { name: 'Webhook Verification', path: '/api/developer/server/verify-webhook', status: 'Operational', latency: '29ms', method: 'POST' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Total API Traffic</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">29.7K <span className="text-xs font-normal text-slate-400">rpm</span></div>
          <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <span>↑ 12.4% vs last hour</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">System Uptime</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">99.99%</div>
          <div className="text-[11px] font-mono text-emerald-400">All Nodes Operational</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Active API Keys</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Key className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">{keys?.length || 1} <span className="text-xs font-normal text-slate-400">keys</span></div>
          <div className="text-[11px] font-mono text-slate-400">Protected Master Credentials</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Avg Response Latency</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">24 <span className="text-xs font-normal text-slate-400">ms</span></div>
          <div className="text-[11px] font-mono text-emerald-400">Sub-30ms Global Edge Routing</div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="p-6 rounded-2xl bg-[#070b14] border border-slate-800 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">
          Developer Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab?.('keys')}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <Key className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
            </div>
            <div className="text-xs font-bold text-white">Manage API Keys</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Generate or revoke sandbox & production keys</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab?.('explorer')}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <Play className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
            </div>
            <div className="text-xs font-bold text-white">API Sandbox Explorer</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Test endpoints with interactive payloads</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab?.('replay')}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <Webhook className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400" />
            </div>
            <div className="text-xs font-bold text-white">Webhooks & Event Streams</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Test event dispatches & HMAC signatures</div>
          </button>

          <Link
            href="/docs"
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
            </div>
            <div className="text-xs font-bold text-white">API Documentation</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Browse REST references & integration guides</div>
          </Link>
        </div>
      </div>

      {/* Grid: System Services Status + Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: System Services Status */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-[#070b14] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Core System Endpoints</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                100% Operational
              </span>
            </div>

            <div className="space-y-2">
              {systemServices.map((srv) => (
                <div key={srv.name} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${
                      srv.method === 'GET' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {srv.method}
                    </span>
                    <div>
                      <span className="text-white font-bold font-sans block">{srv.name}</span>
                      <span className="text-slate-500 text-[10px]">{srv.path}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-[11px]">{srv.latency}</span>
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{srv.status}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Traffic Feed */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-[#070b14] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Live Request Stream</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
                <span>Live Feed</span>
              </span>
            </div>

            <div className="space-y-2">
              {liveLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 font-mono text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{log.timestamp}</span>
                    <span className="text-slate-400">{log.region}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <span className={`px-1 py-0.2 rounded text-[9px] font-bold border ${
                        log.method === 'GET' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {log.method}
                      </span>
                      <span className="text-slate-300 truncate text-[11px]">{log.endpoint}</span>
                    </div>
                    <span className="text-emerald-400 font-bold text-[11px] shrink-0">{log.latencyMs}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
