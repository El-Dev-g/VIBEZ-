'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  Key,
  Play,
  Webhook,
  BookOpen,
  ArrowUpRight,
  CheckCircle,
  Clock,
  ShieldCheck,
  Code2,
  Lock,
  Cpu
} from 'lucide-react';
import { useDeveloperAuth } from '../context/DeveloperAuthContext';

export const DashboardOverview: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({ onNavigateTab }) => {
  const { user, keys } = useDeveloperAuth();

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
          <div className="text-2xl font-black text-white tracking-tight">0 <span className="text-xs font-normal text-slate-400">rpm</span></div>
          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
            <span>Waiting for data...</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">System Uptime</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">-- %</div>
          <div className="text-[11px] font-mono text-blue-400">Syncing with Nodes...</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Active API Keys</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Key className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">{keys?.length || 0} <span className="text-xs font-normal text-slate-400">keys</span></div>
          <div className="text-[11px] font-mono text-slate-400">Protected Master Credentials</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Avg Response Latency</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">0 <span className="text-xs font-normal text-slate-400">ms</span></div>
          <div className="text-[11px] font-mono text-slate-500">Global Edge Routing</div>
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
    </div>
  );
};
