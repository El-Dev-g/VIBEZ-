'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, ShieldCheck, ArrowRight, Sparkles, Key, Zap } from 'lucide-react';
import { useDeveloperAuth } from '../../context/DeveloperAuthContext';
import { ApiExplorerSandbox } from '../../components/ApiExplorerSandbox';

export default function ApiExplorerPage() {
  const { user } = useDeveloperAuth();

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[#070b14] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Protected Console Resource</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              API Sandbox Explorer
            </h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              The API Request Explorer Sandbox is restricted to authenticated developer accounts. Please sign in to test live HTTP payloads and manage API keys.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>Sign In to Access Sandbox</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/register"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <span>Create Account</span>
            </Link>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono flex items-center justify-center gap-1">
            <span>Powered by</span>
            <span className="text-emerald-400 font-bold">PRIGID GROUP Developer Infrastructure</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Developer Console Sandbox</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Protected API Sandbox Explorer</h1>
          <p className="text-slate-400 text-xs mt-1">
            Construct, execute, and inspect live request payloads against VIBEZ APIs • Logged in as <span className="text-emerald-400 font-bold">{user.email}</span>
          </p>
        </div>

        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs hover:text-white transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>Return to Dashboard</span>
        </Link>
      </div>

      <ApiExplorerSandbox />
    </div>
  );
}
