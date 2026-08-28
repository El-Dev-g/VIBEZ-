'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Key, Plus, Trash2, Copy, Check, Lock, ShieldCheck, ArrowRight, Eye, EyeOff, Zap } from 'lucide-react';
import { useDeveloperAuth } from '../../context/DeveloperAuthContext';

export default function KeysPage() {
  const { user, keys: ctxKeys, createKey, revokeKey } = useDeveloperAuth();

  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyType, setNewKeyType] = useState<'sandbox' | 'production'>('production');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

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
              <span>Protected Credentials Manager</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              API Sandbox & Master Keys
            </h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              API Sandbox Keys and Master Production Credentials are protected. Please sign in to your developer account to view, generate, or revoke API keys.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>Sign In to Access Keys</span>
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
            <span className="text-emerald-400 font-bold">PRIGID GROUP Security Core</span>
          </div>
        </div>
      </div>
    );
  }

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    createKey({
      name: newKeyName.trim(),
      keyType: 'api_key',
      environment: newKeyType,
      sdkTarget: 'Universal',
      scopes: ['read', 'write', 'messages:dispatch'],
    });
    setNewKeyName('');
  };

  const handleCopyKey = (id: string, keyValue: string) => {
    navigator.clipboard.writeText(keyValue);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleShowSecret = (id: string) => {
    setShowSecret(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold mb-2">
            <Key className="w-3.5 h-3.5" />
            <span>Credentials Management</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">API Keys & Tokens</h1>
          <p className="text-slate-400 text-sm mt-1">
            Generate and manage API credentials to integrate VIBEZ services securely • Logged in as <span className="text-emerald-400 font-bold">{user.email}</span>
          </p>
        </div>

        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs hover:text-white transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>Dashboard Console</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Create Key Form */}
        <div className="lg:col-span-4">
          <form onSubmit={handleGenerateKey} className="rounded-2xl bg-[#070b14] border border-slate-800 p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Create New API Key</span>
            </h3>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Key Label / Application</label>
              <input
                type="text"
                required
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Sandbox App, Android Client"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Environment Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewKeyType('sandbox')}
                  className={`p-2.5 rounded-xl border text-center text-xs font-mono font-bold transition-all ${
                    newKeyType === 'sandbox'
                      ? 'bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  🧪 Sandbox
                </button>
                <button
                  type="button"
                  onClick={() => setNewKeyType('production')}
                  className={`p-2.5 rounded-xl border text-center text-xs font-mono font-bold transition-all ${
                    newKeyType === 'production'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  ⚡ Production
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:opacity-95 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Key className="w-4 h-4" />
              <span>Generate API Key</span>
            </button>
          </form>
        </div>

        {/* Active Keys List */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Active API Keys ({ctxKeys.length})</h3>

          {ctxKeys.length === 0 ? (
            <div className="p-8 text-center border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-500 text-sm">
              No API keys configured yet. Create one on the left.
            </div>
          ) : (
            ctxKeys.map((k) => {
              const isVisible = Boolean(showSecret[k.id]);
              const raw = k.rawKey || k.maskedKey;
              const displayVal = isVisible ? raw : k.maskedKey;

              return (
                <div key={k.id} className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase border ${
                        k.environment === 'production'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {k.environment}
                      </span>
                      <span className="text-sm font-bold text-white">{k.name}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => revokeKey(k.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-900 transition-colors"
                      title="Revoke Key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Key string box */}
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300">
                    <span className="flex-1 truncate">{displayVal}</span>
                    <button
                      type="button"
                      onClick={() => toggleShowSecret(k.id)}
                      className="p-1 text-slate-400 hover:text-white"
                      title={isVisible ? 'Hide Key' : 'Reveal Key'}
                    >
                      {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyKey(k.id, raw)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 text-[11px] text-slate-300 hover:text-white font-sans font-bold"
                    >
                      {copiedId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === k.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {k.scopes.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono text-[10px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
