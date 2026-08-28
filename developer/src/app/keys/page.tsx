'use client';

import React, { useState } from 'react';
import { Key, Plus, Trash2, Copy, Check, Shield, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  type: 'sandbox' | 'production';
  createdAt: string;
  scopes: string[];
}

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([
    {
      id: 'key_01',
      name: 'Primary Master Production Key',
      key: 'vbz_live_8819230a817cc91e012',
      type: 'production',
      createdAt: '2026-08-28',
      scopes: ['messages:write', 'messages:read', 'auth:otp', 'calls:signaling', 'system:status']
    }
  ]);

  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyType, setNewKeyType] = useState<'sandbox' | 'production'>('production');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const randomHash = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
    const prefix = newKeyType === 'production' ? 'vbz_live_' : 'vbz_test_';

    const newKey: ApiKeyItem = {
      id: `key_${Date.now()}`,
      name: newKeyName.trim(),
      key: `${prefix}${randomHash}`,
      type: newKeyType,
      createdAt: new Date().toISOString().split('T')[0],
      scopes: ['messages:write', 'auth:otp', 'system:status']
    };

    // Replace with single primary key
    setKeys([newKey]);
    setNewKeyName('');
  };

  const handleDeleteKey = (id: string) => {
    setKeys(keys.filter(k => k.id !== id));
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
            Generate and manage API credentials to integrate VIBEZ services securely • Powered by <span className="text-emerald-400 font-bold">PRIGID GROUP</span>
          </p>
        </div>
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
                placeholder="e.g. Staging Server, Android Client"
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
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Active API Keys ({keys.length})</h3>

          {keys.length === 0 ? (
            <div className="p-8 text-center border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-500 text-sm">
              No API keys configured yet. Create one on the left.
            </div>
          ) : (
            keys.map((k) => {
              const isVisible = Boolean(showSecret[k.id]);
              const maskedKey = isVisible ? k.key : `${k.key.substring(0, 10)}${'•'.repeat(16)}`;

              return (
                <div key={k.id} className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase border ${
                        k.type === 'production'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {k.type}
                      </span>
                      <span className="text-sm font-bold text-white">{k.name}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteKey(k.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-900 transition-colors"
                      title="Revoke Key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Key string box */}
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300">
                    <span className="flex-1 truncate">{maskedKey}</span>
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
                      onClick={() => handleCopyKey(k.id, k.key)}
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
