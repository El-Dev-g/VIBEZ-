'use client';

import React, { useState } from 'react';
import { Key, Plus, Shield, Copy, Check, Eye, EyeOff, Trash2, Smartphone, Server, Cpu, Terminal, Sparkles } from 'lucide-react';
import { useDeveloperAuth, DeveloperKey } from '../context/DeveloperAuthContext';

export const DeveloperKeyGenerator: React.FC = () => {
  const { keys, createKey, revokeKey } = useDeveloperAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [revealedKeyId, setRevealedKeyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [keyType, setKeyType] = useState<'api_key' | 'client_secret'>('api_key');
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('production');
  const [sdkTarget, setSdkTarget] = useState<'Kotlin' | 'TypeScript' | 'Python' | 'Go' | 'Universal'>('Kotlin');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    'messages:write',
    'auth:otp',
    'calls:signaling',
  ]);

  const availableScopes = [
    { id: 'messages:write', label: 'Send Messages', desc: 'Allow sending and updating chat messages' },
    { id: 'messages:read', label: 'Read Messages', desc: 'Fetch conversation history & sync messages' },
    { id: 'auth:otp', label: 'Phone OTP Auth', desc: 'Dispatch SMS/WhatsApp OTP verification codes' },
    { id: 'calls:signaling', label: 'WebRTC Signaling', desc: 'Manage 1-on-1 and group voice/video rooms' },
    { id: 'status:publish', label: 'Publish Stories', desc: 'Create 24hr disappearing media status updates' },
    { id: 'system:telemetry', label: 'System Telemetry', desc: 'Query server health, latency & ping metrics' },
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleScope = (scopeId: string) => {
    if (selectedScopes.includes(scopeId)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scopeId));
    } else {
      setSelectedScopes([...selectedScopes, scopeId]);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createKey({
      name,
      keyType,
      environment,
      sdkTarget,
      scopes: selectedScopes,
    });

    setIsModalOpen(false);
    setName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-black uppercase tracking-wider text-white">
              Primary API Key
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/20">
              Single Key Policy
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Your organization maintains 1 active API Key across all services and platforms.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 flex items-center gap-1.5 transition-all self-start sm:self-auto shadow-lg shadow-emerald-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>{keys.length > 0 ? 'Rotate / Replace Key' : 'Generate API Key'}</span>
        </button>
      </div>

      {/* Generation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#050811]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-base font-black text-white uppercase tracking-tight">
                Generate API Key / Client Secret
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 font-bold mb-1">Key Description / Name</label>
                <input
                  type="text"
                  placeholder="e.g. Android Kotlin Production Client"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 font-bold mb-1">Credential Type</label>
                  <select
                    value={keyType}
                    onChange={(e) => setKeyType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="api_key">API Key (Bearer)</option>
                    <option value="client_secret">Client ID + Secret</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 font-bold mb-1">Environment</label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="production">Production (Live)</option>
                    <option value="sandbox">Sandbox (Testing)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 font-bold mb-1">Target SDK Platform</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Kotlin', 'TypeScript', 'Python', 'Go'] as const).map((sdk) => (
                    <button
                      key={sdk}
                      type="button"
                      onClick={() => setSdkTarget(sdk)}
                      className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                        sdkTarget === sdk
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {sdk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scopes */}
              <div>
                <label className="block text-xs font-mono text-slate-300 font-bold mb-2">Permission Scopes</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableScopes.map((scope) => {
                    const isChecked = selectedScopes.includes(scope.id);
                    return (
                      <button
                        key={scope.id}
                        type="button"
                        onClick={() => toggleScope(scope.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-start justify-between ${
                          isChecked
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold font-mono">{scope.label}</div>
                          <div className="text-[10px] text-slate-500">{scope.desc}</div>
                        </div>
                        {isChecked && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 transition-all"
                >
                  Generate Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Keys List */}
      <div className="space-y-3">
        {keys.map((k) => {
          const isRevealed = revealedKeyId === k.id;
          const displayKey = isRevealed ? k.rawKey : k.maskedKey;
          const sdkColor =
            k.sdkTarget === 'Kotlin'
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              : k.sdkTarget === 'TypeScript'
              ? 'text-sky-400 bg-sky-500/10 border-sky-500/20'
              : k.sdkTarget === 'Python'
              ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              : 'text-purple-400 bg-purple-500/10 border-purple-500/20';

          return (
            <div
              key={k.id}
              className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 shadow-xl space-y-3 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-900 text-emerald-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">{k.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold border ${sdkColor}`}>
                        {k.sdkTarget} SDK
                      </span>
                      <span
                        className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold ${
                          k.environment === 'production'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {k.environment.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-xs font-mono text-slate-500">
                    {k.requestsCount.toLocaleString()} total reqs
                  </span>
                  <button
                    type="button"
                    onClick={() => revokeKey(k.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    title="Revoke Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Key Box */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-white">
                <span className="truncate pr-2">{displayKey}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setRevealedKeyId(isRevealed ? null : k.id)}
                    className="p-1.5 rounded bg-slate-900 text-slate-400 hover:text-white"
                    title={isRevealed ? 'Mask key' : 'Reveal key'}
                  >
                    {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(k.rawKey, k.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-900 text-slate-300 hover:text-white text-[11px] font-bold"
                  >
                    {copiedId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === k.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Scopes Badges */}
              <div className="flex flex-wrap gap-1 pt-1">
                {k.scopes.map((scope) => (
                  <span key={scope} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800/80 text-[10px] font-mono text-slate-400">
                    {scope}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
