'use client';

import React, { useState } from 'react';
import {
  Key,
  Plus,
  Shield,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Smartphone,
  Server,
  Cpu,
  Terminal,
  Sparkles,
  Edit2,
  RotateCw,
  Search,
  Filter,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldCheck,
  Layers,
  Lock,
  KeyRound,
  Radio,
  Zap,
} from 'lucide-react';
import { useDeveloperAuth, DeveloperKey } from '../context/DeveloperAuthContext';

interface ScopeDefinition {
  id: string;
  label: string;
  category: 'identity' | 'messaging' | 'rtc' | 'auth' | 'telemetry' | 'webhooks';
  desc: string;
}

const ALL_SCOPES: ScopeDefinition[] = [
  // Identity & Single Sign-On
  { id: 'openid', label: 'OpenID Connect', category: 'identity', desc: 'Standard OIDC authentication identifier' },
  { id: 'profile', label: 'User Profile', category: 'identity', desc: 'Access avatar, display name, handle & bio' },
  { id: 'email', label: 'Email Address', category: 'identity', desc: 'Verified developer & subscriber email address' },
  { id: 'phone', label: 'Phone Number', category: 'identity', desc: 'E.164 verified phone number data' },
  { id: 'offline_access', label: 'Offline Refresh Access', category: 'identity', desc: 'Issue persistent refresh tokens for continuous sync' },

  // Messaging & Real-Time Chat
  { id: 'messages:write', label: 'Send & Post Messages', category: 'messaging', desc: 'Dispatch 1-on-1 chats, group texts & attachments' },
  { id: 'messages:read', label: 'Read Messages & History', category: 'messaging', desc: 'Fetch conversation logs and encrypted payloads' },
  { id: 'messages:delete', label: 'Revoke Messages', category: 'messaging', desc: 'Delete and edit delivered chat items' },

  // Authentication & Phone OTP
  { id: 'auth:otp', label: 'Phone OTP Auth', category: 'auth', desc: 'Generate & verify SMS/WhatsApp 6-digit OTP codes' },
  { id: 'auth:sessions', label: 'Session Management', category: 'auth', desc: 'Query active device tokens and revoke sessions' },

  // WebRTC Audio / Video & Calls
  { id: 'calls:signaling', label: 'WebRTC Signaling', category: 'rtc', desc: 'Establish peer-to-peer and SFU audio/video sessions' },
  { id: 'rtc:token', label: 'RTC Channel Tokens', category: 'rtc', desc: 'Generate high-throughput Agora/LiveKit channel tokens' },
  { id: 'rtc:rooms', label: 'Manage Conference Rooms', category: 'rtc', desc: 'Create, lock, and moderate group voice spaces' },

  // Stories & Disappearing Status
  { id: 'status:publish', label: 'Publish Stories / Status', category: 'messaging', desc: 'Upload 24-hour ephemeral rich media stories' },
  { id: 'status:read', label: 'View Stories & Updates', category: 'messaging', desc: 'Stream subscribed contact stories and reactions' },

  // System, Telemetry & Quotas
  { id: 'system:telemetry', label: 'System Telemetry', category: 'telemetry', desc: 'Access server health, node latency & error traces' },
  { id: 'logs:read', label: 'Traffic & Audit Logs', category: 'telemetry', desc: 'Stream real-time HTTP requests and audit events' },
  { id: 'quotas:read', label: 'Usage & Rate Limits', category: 'telemetry', desc: 'Monitor request volumes and burst tier limits' },

  // Webhooks & Event Replay
  { id: 'webhooks:manage', label: 'Webhooks Configuration', category: 'webhooks', desc: 'Register endpoints and configure HMAC secret signatures' },
  { id: 'events:replay', label: 'Event Replay Studio', category: 'webhooks', desc: 'Re-trigger WebSocket dispatches and test webhooks' },
];

export const DeveloperKeyGenerator: React.FC = () => {
  const { keys, createKey, updateKey, revokeKey } = useDeveloperAuth();

  // Modals & Active Edit States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<DeveloperKey | null>(null);
  const [revealedKeyId, setRevealedKeyId] = useState<string | null>(null);
  const [revealedSecretId, setRevealedSecretId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'api_key' | 'client_secret'>('ALL');
  const [envFilter, setEnvFilter] = useState<'ALL' | 'production' | 'sandbox'>('ALL');

  // Form State for Create & Edit
  const [formData, setFormData] = useState<{
    name: string;
    keyType: 'api_key' | 'client_secret';
    environment: 'sandbox' | 'production';
    sdkTarget: 'Kotlin' | 'TypeScript' | 'Python' | 'Go' | 'Universal';
    scopes: string[];
  }>({
    name: '',
    keyType: 'api_key',
    environment: 'production',
    sdkTarget: 'Kotlin',
    scopes: ['openid', 'profile', 'email', 'messages:write', 'auth:otp', 'calls:signaling'],
  });

  const [scopeCategoryFilter, setScopeCategoryFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleScope = (scopeId: string) => {
    if (formData.scopes.includes(scopeId)) {
      setFormData((prev) => ({
        ...prev,
        scopes: prev.scopes.filter((s) => s !== scopeId),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        scopes: [...prev.scopes, scopeId],
      }));
    }
  };

  const selectAllScopes = () => {
    setFormData((prev) => ({
      ...prev,
      scopes: ALL_SCOPES.map((s) => s.id),
    }));
  };

  const clearAllScopes = () => {
    setFormData((prev) => ({
      ...prev,
      scopes: [],
    }));
  };

  const applyPreset = (preset: 'standard' | 'full' | 'identity' | 'messaging') => {
    if (preset === 'full') {
      selectAllScopes();
    } else if (preset === 'identity') {
      setFormData((prev) => ({
        ...prev,
        scopes: ['openid', 'profile', 'email', 'phone', 'offline_access'],
      }));
    } else if (preset === 'messaging') {
      setFormData((prev) => ({
        ...prev,
        scopes: ['openid', 'profile', 'email', 'messages:write', 'messages:read', 'auth:otp', 'calls:signaling'],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        scopes: ['openid', 'profile', 'email', 'messages:write', 'auth:otp'],
      }));
    }
  };

  const handleOpenCreateModal = () => {
    setEditingKey(null);
    setFormData({
      name: '',
      keyType: 'api_key',
      environment: 'production',
      sdkTarget: 'Kotlin',
      scopes: ['openid', 'profile', 'email', 'messages:write', 'auth:otp', 'calls:signaling'],
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (key: DeveloperKey) => {
    setEditingKey(key);
    setFormData({
      name: key.name,
      keyType: key.keyType,
      environment: key.environment,
      sdkTarget: key.sdkTarget,
      scopes: key.scopes,
    });
    setIsCreateModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingKey) {
      await updateKey(editingKey.id, {
        name: formData.name,
        environment: formData.environment,
        sdkTarget: formData.sdkTarget,
        scopes: formData.scopes,
      });
      showToast('Key credentials & scopes updated successfully!');
    } else {
      await createKey({
        name: formData.name,
        keyType: formData.keyType,
        environment: formData.environment,
        sdkTarget: formData.sdkTarget,
        scopes: formData.scopes.length > 0 ? formData.scopes : ['openid', 'profile', 'messages:write'],
      });
      showToast('New credentials generated successfully!');
    }

    setIsCreateModalOpen(false);
    setEditingKey(null);
  };

  const handleRotate = async (key: DeveloperKey) => {
    if (confirm(`Are you sure you want to rotate secrets for "${key.name}"? Previous keys will become invalid.`)) {
      await updateKey(key.id, { rotateSecret: true });
      showToast('Key & secret rotated successfully!');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Permanently revoke & delete "${name}"?`)) {
      await revokeKey(id);
      showToast('Key permanently revoked.');
    }
  };

  // Filtered keys list
  const filteredKeys = keys.filter((k) => {
    const matchesSearch =
      k.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      k.rawKey.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (k.clientId && k.clientId.toLowerCase().includes(searchFilter.toLowerCase())) ||
      k.scopes.some((s) => s.toLowerCase().includes(searchFilter.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || k.keyType === typeFilter;
    const matchesEnv = envFilter === 'ALL' || k.environment === envFilter;

    return matchesSearch && matchesType && matchesEnv;
  });

  const visibleScopes =
    scopeCategoryFilter === 'all'
      ? ALL_SCOPES
      : ALL_SCOPES.filter((s) => s.category === scopeCategoryFilter);

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-500 text-slate-950 font-mono text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-black uppercase tracking-wider text-white">
              API Keys & Credential Secrets
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/20">
              {keys.length} Active {keys.length === 1 ? 'Credential' : 'Credentials'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Create, update, and manage scoped API Bearer Keys and Client ID/Secret pairs • Powered by <span className="text-emerald-400 font-bold">PRIGID GROUP</span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 flex items-center gap-2 transition-all self-start sm:self-auto shadow-lg shadow-emerald-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Key</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search keys by name, scope, ID..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {(['ALL', 'api_key', 'client_secret'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  typeFilter === t
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'ALL' ? 'All Types' : t === 'api_key' ? 'API Keys' : 'Client Secrets'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {(['ALL', 'production', 'sandbox'] as const).map((env) => (
              <button
                key={env}
                type="button"
                onClick={() => setEnvFilter(env)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  envFilter === env
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {env === 'ALL' ? 'All Envs' : env.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generation & Edit Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#050811]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 sticky top-0 bg-[#090d16] z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  {editingKey ? <Edit2 className="w-4 h-4" /> : <Key className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-base font-black text-white uppercase tracking-tight">
                    {editingKey ? 'Edit Key & Modify Scopes' : 'Generate New API Key / Client Secret'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Configure granular permission scopes across identity, messaging, and RTC infrastructure.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                  Key Description / Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Android Mobile Production Client, Billing Microservice"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                    Credential Type
                  </label>
                  <select
                    value={formData.keyType}
                    disabled={!!editingKey}
                    onChange={(e) => setFormData({ ...formData, keyType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="api_key">API Key (Bearer Auth Token)</option>
                    <option value="client_secret">Client ID + Secret (OAuth2)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                    Target Environment
                  </label>
                  <select
                    value={formData.environment}
                    onChange={(e) => setFormData({ ...formData, environment: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="production">Production (Live Spanner / RTC)</option>
                    <option value="sandbox">Sandbox (Testing / Isolated)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                  Target Platform / SDK
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['Kotlin', 'TypeScript', 'Python', 'Go', 'Universal'] as const).map((sdk) => (
                    <button
                      key={sdk}
                      type="button"
                      onClick={() => setFormData({ ...formData, sdkTarget: sdk })}
                      className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                        formData.sdkTarget === sdk
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {sdk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scopes Section */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-mono text-white font-black uppercase tracking-wider">
                      Permission Scopes ({formData.scopes.length} selected)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      All selected scopes will be embedded into the credential key & verified on API requests.
                    </span>
                  </div>

                  {/* Scope Presets */}
                  <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => applyPreset('standard')}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('identity')}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                    >
                      Identity Only
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('messaging')}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                    >
                      Chat & RTC
                    </button>
                    <button
                      type="button"
                      onClick={selectAllScopes}
                      className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearAllScopes}
                      className="px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Scope Category Tabs */}
                <div className="flex gap-1 overflow-x-auto pb-1 text-[11px] font-mono">
                  {[
                    { id: 'all', label: 'All Categories' },
                    { id: 'identity', label: 'Identity & SSO' },
                    { id: 'messaging', label: 'Messaging' },
                    { id: 'auth', label: 'Phone OTP' },
                    { id: 'rtc', label: 'Audio / Video RTC' },
                    { id: 'telemetry', label: 'Telemetry & Logs' },
                    { id: 'webhooks', label: 'Webhooks' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setScopeCategoryFilter(cat.id)}
                      className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
                        scopeCategoryFilter === cat.id
                          ? 'bg-slate-800 text-white font-bold'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Scopes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                  {visibleScopes.map((scope) => {
                    const isChecked = formData.scopes.includes(scope.id);
                    return (
                      <button
                        key={scope.id}
                        type="button"
                        onClick={() => toggleScope(scope.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-start justify-between ${
                          isChecked
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <div className="pr-2">
                          <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                            <span>{scope.id}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-slate-900 text-slate-400 font-sans">
                              {scope.label}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{scope.desc}</div>
                        </div>
                        {isChecked ? (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-4 h-4 rounded border border-slate-700 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10"
                >
                  {editingKey ? 'Save Changes' : 'Generate Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Keys List */}
      <div className="space-y-4">
        {filteredKeys.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#070b14] border border-slate-800 space-y-3">
            <Key className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-black text-white">No keys found</h4>
            <p className="text-xs text-slate-500">
              {searchFilter ? 'Try clearing your search filters' : 'Generate your first API Key or Client Secret'}
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase hover:bg-emerald-400 transition-all inline-flex items-center gap-1.5 mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate Credentials</span>
            </button>
          </div>
        ) : (
          filteredKeys.map((k) => {
            const isRevealedKey = revealedKeyId === k.id;
            const isRevealedSecret = revealedSecretId === k.id;
            const displayKey = isRevealedKey ? k.rawKey : k.maskedKey;
            const isClientSecret = k.keyType === 'client_secret';

            const sdkColor =
              k.sdkTarget === 'Kotlin'
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : k.sdkTarget === 'TypeScript'
                ? 'text-sky-400 bg-sky-500/10 border-sky-500/20'
                : k.sdkTarget === 'Python'
                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                : k.sdkTarget === 'Go'
                ? 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';

            return (
              <div
                key={k.id}
                className="p-5 sm:p-6 rounded-2xl bg-[#070b14] border border-slate-800 shadow-xl space-y-4 hover:border-slate-700 transition-all relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isClientSecret ? 'bg-purple-500/10 text-purple-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {isClientSecret ? <KeyRound className="w-5 h-5" /> : <Key className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white">{k.name}</h4>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold uppercase border ${
                          isClientSecret ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {isClientSecret ? 'Client Credentials' : 'API Key'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold border ${sdkColor}`}>
                          {k.sdkTarget} SDK
                        </span>
                        <span
                          className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold ${
                            k.environment === 'production'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {k.environment.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Created {k.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(k)}
                      className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-xs font-mono flex items-center gap-1"
                      title="Edit Key & Scopes"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit Scopes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRotate(k)}
                      className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all text-xs font-mono flex items-center gap-1"
                      title="Rotate Secrets"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Rotate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(k.id, k.name)}
                      className="p-2 rounded-xl bg-slate-900 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Revoke Key"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* API Key Box */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-white">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-500 text-[11px] font-bold uppercase shrink-0">
                        {isClientSecret ? 'Access Token' : 'Bearer Key'}:
                      </span>
                      <span className="truncate">{displayKey}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setRevealedKeyId(isRevealedKey ? null : k.id)}
                        className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                        title={isRevealedKey ? 'Mask' : 'Reveal'}
                      >
                        {isRevealedKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(k.rawKey, `${k.id}_raw`)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white text-[11px] font-bold"
                      >
                        {copiedId === `${k.id}_raw` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === `${k.id}_raw` ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Client ID + Secret (for OAuth Credential pairs) */}
                  {isClientSecret && k.clientId && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
                        <div className="min-w-0 pr-2">
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Client ID</span>
                          <span className="truncate block">{k.clientId}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(k.clientId!, `${k.id}_cid`)}
                          className="p-1.5 rounded bg-slate-900 text-slate-400 hover:text-white shrink-0"
                          title="Copy Client ID"
                        >
                          {copiedId === `${k.id}_cid` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
                        <div className="min-w-0 pr-2">
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Client Secret</span>
                          <span className="truncate block">
                            {isRevealedSecret ? k.clientSecret : '••••••••••••••••••••••••'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setRevealedSecretId(isRevealedSecret ? null : k.id)}
                            className="p-1.5 rounded bg-slate-900 text-slate-400 hover:text-white"
                          >
                            {isRevealedSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(k.clientSecret || '', `${k.id}_sec`)}
                            className="p-1.5 rounded bg-slate-900 text-slate-400 hover:text-white"
                          >
                            {copiedId === `${k.id}_sec` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scopes Badges */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Authorized Scopes ({k.scopes.length})</span>
                    <span>{k.requestsCount.toLocaleString()} total API requests</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {k.scopes.map((scope) => (
                      <span
                        key={scope}
                        className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-emerald-400 font-bold"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
