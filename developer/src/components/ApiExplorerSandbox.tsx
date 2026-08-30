'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  Send,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  Shield,
  Key,
  AlertCircle,
  ShieldCheck,
  Layers,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useDeveloperAuth } from '../context/DeveloperAuthContext';

interface Preset {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  body: string;
  requiresAuth: boolean;
  suggestedScopes: string[];
}

const AVAILABLE_SANDBOX_SCOPES = [
  'openid',
  'profile',
  'email',
  'phone',
  'messages:write',
  'messages:read',
  'auth:otp',
  'calls:signaling',
  'status:publish',
  'system:telemetry',
  'webhooks:manage',
];

export const ApiExplorerSandbox: React.FC = () => {
  const { user, keys } = useDeveloperAuth();

  const presets: Preset[] = [
    {
      name: 'System Health & Telemetry',
      method: 'GET',
      endpoint: '/api/developer/server/health-check',
      body: '',
      requiresAuth: false,
      suggestedScopes: ['system:telemetry'],
    },
    {
      name: 'List Stored API Keys (CRUD GET)',
      method: 'GET',
      endpoint: '/api/developer/auth/keys',
      body: '',
      requiresAuth: true,
      suggestedScopes: ['system:telemetry'],
    },
    {
      name: 'Generate Scoped API Key (CRUD POST)',
      method: 'POST',
      endpoint: '/api/developer/auth/keys',
      body: JSON.stringify(
        {
          name: 'Kotlin Sandbox Client',
          keyType: 'api_key',
          environment: 'sandbox',
          sdkTarget: 'Kotlin',
          scopes: ['openid', 'profile', 'messages:write', 'calls:signaling'],
        },
        null,
        2
      ),
      requiresAuth: true,
      suggestedScopes: ['messages:write', 'calls:signaling'],
    },
    {
      name: 'Issue Scoped OAuth2 Bearer Token',
      method: 'POST',
      endpoint: '/api/developer/server/issue-oauth-token',
      body: JSON.stringify(
        {
          client_id: 'clt_sandbox_client',
          client_secret: 'sec_sandbox_secret',
          grant_type: 'client_credentials',
          scope: 'openid profile email messages:write auth:otp calls:signaling',
        },
        null,
        2
      ),
      requiresAuth: false,
      suggestedScopes: ['openid', 'profile', 'email'],
    },
    {
      name: 'Dispatch Live Message',
      method: 'POST',
      endpoint: '/api/developer/server/dispatch-message',
      body: JSON.stringify(
        {
          recipientId: 'usr_live_receiver',
          content: 'Testing live scoped payload from VIBEZ Sandbox ⚡',
        },
        null,
        2
      ),
      requiresAuth: true,
      suggestedScopes: ['messages:write'],
    },
    {
      name: 'Verify Webhook Signature',
      method: 'POST',
      endpoint: '/api/developer/server/verify-webhook',
      body: JSON.stringify(
        {
          payload: { event: 'user.registered', userId: 'usr_10092' },
          signature: 'sha256=mock_signature',
        },
        null,
        2
      ),
      requiresAuth: true,
      suggestedScopes: ['webhooks:manage'],
    },
    {
      name: 'Generate WebRTC RTC Token',
      method: 'POST',
      endpoint: '/api/developer/server/generate-rtc-token',
      body: JSON.stringify(
        {
          channelName: 'voice_room_01',
          uid: 109238,
        },
        null,
        2
      ),
      requiresAuth: true,
      suggestedScopes: ['calls:signaling'],
    },
  ];

  const primaryKey = keys.length > 0 ? keys[0].rawKey : '';

  const [selectedKeyId, setSelectedKeyId] = useState<string>(keys.length > 0 ? keys[0].id : 'custom');
  const [baseUrl, setBaseUrl] = useState('');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
  const [endpoint, setEndpoint] = useState('/api/developer/server/health-check');
  const [authToken, setAuthToken] = useState('');
  const [apiKey, setApiKey] = useState(primaryKey);
  const [requestBody, setRequestBody] = useState('');

  // Scopes state for interactive token minting
  const [sandboxScopes, setSandboxScopes] = useState<string[]>([
    'openid',
    'profile',
    'email',
    'messages:write',
    'auth:otp',
    'calls:signaling',
  ]);
  const [isMintingToken, setIsMintingToken] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseBody, setResponseBody] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (keys.length > 0 && (!apiKey || selectedKeyId === 'custom')) {
      setSelectedKeyId(keys[0].id);
      setApiKey(keys[0].rawKey);
      if (keys[0].scopes) {
        setSandboxScopes(keys[0].scopes);
      }
    }
  }, [keys]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const handleKeySelectChange = (id: string) => {
    setSelectedKeyId(id);
    if (id === 'custom') {
      // Keep existing manual text
      return;
    }
    const found = keys.find((k) => k.id === id);
    if (found) {
      setApiKey(found.rawKey);
      if (found.scopes && found.scopes.length > 0) {
        setSandboxScopes(found.scopes);
      }
    }
  };

  const toggleScope = (scope: string) => {
    if (sandboxScopes.includes(scope)) {
      setSandboxScopes(sandboxScopes.filter((s) => s !== scope));
    } else {
      setSandboxScopes([...sandboxScopes, scope]);
    }
  };

  const handleMintScopedToken = async () => {
    setIsMintingToken(true);
    try {
      const activeKeyObj = keys.find((k) => k.id === selectedKeyId);
      const res = await fetch('/api/developer/server/issue-oauth-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: activeKeyObj?.clientId || 'clt_sandbox_direct',
          client_secret: activeKeyObj?.clientSecret || apiKey || 'sec_sandbox_secret',
          api_key: apiKey,
          grant_type: 'client_credentials',
          scope: sandboxScopes.join(' '),
        }),
      });

      const data = await res.json();
      if (data.access_token) {
        setAuthToken(data.access_token);
        setResponseBody(JSON.stringify(data, null, 2));
        setResponseStatus(200);
      } else {
        setResponseBody(JSON.stringify(data, null, 2));
        setResponseStatus(400);
      }
    } catch (err: any) {
      setResponseBody(JSON.stringify({ error: err.message || 'Token mint error' }, null, 2));
      setResponseStatus(500);
    } finally {
      setIsMintingToken(false);
    }
  };

  const applyPreset = (preset: Preset) => {
    setMethod(preset.method);
    setEndpoint(preset.endpoint);
    setRequestBody(preset.body);
    if (preset.suggestedScopes && preset.suggestedScopes.length > 0) {
      setSandboxScopes(Array.from(new Set([...sandboxScopes, ...preset.suggestedScopes])));
    }
  };

  const handleSendRequest = async () => {
    setIsLoading(true);
    setResponseStatus(null);
    setResponseBody(null);
    setLatency(null);

    const startTime = performance.now();
    const cleanOrigin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    const fullUrl = `${cleanOrigin.replace(/\/$/, '')}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey || 'vbz_master_key',
    };

    if (authToken.trim()) {
      headers['Authorization'] = `Bearer ${authToken.trim()}`;
    }

    try {
      const options: RequestInit = {
        method,
        headers,
      };

      if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody.trim()) {
        try {
          options.body = requestBody;
        } catch {
          console.error('Invalid JSON request body');
        }
      }

      const res = await fetch(fullUrl, options);
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setResponseStatus(res.status);

      const respHeaders: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        respHeaders[key] = val;
      });
      setResponseHeaders(respHeaders);

      const text = await res.text();
      try {
        const json = JSON.parse(text);
        setResponseBody(JSON.stringify(json, null, 2));
      } catch {
        setResponseBody(text);
      }
    } catch (err: any) {
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setResponseStatus(0);
      setResponseBody(
        JSON.stringify(
          {
            error: 'Network Execution Failure',
            message: err?.message || 'Failed to connect to target endpoint.',
            endpoint: fullUrl,
            poweredBy: 'PRIGID GROUP Global Cloud',
          },
          null,
          2
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyResponse = () => {
    if (responseBody) {
      navigator.clipboard.writeText(responseBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sandbox Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#070b14] border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-bold">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Interactive Scoped API Sandbox</span>
          </div>
          <h2 className="text-lg font-black text-white">Execute REST Endpoints & Scoped Keys</h2>
          <p className="text-xs text-slate-400">
            Construct, execute, and verify permissions with API Keys or OAuth Client Credentials.
          </p>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 shrink-0">
          <Key className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Active Selected Key</div>
            <select
              value={selectedKeyId}
              onChange={(e) => handleKeySelectChange(e.target.value)}
              className="bg-transparent text-white font-bold font-mono text-xs focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              {keys.map((k) => (
                <option key={k.id} value={k.id} className="bg-slate-950 text-white">
                  {k.name} ({k.keyType === 'client_secret' ? 'OAuth' : 'API Key'})
                </option>
              ))}
              <option value="custom" className="bg-slate-950 text-slate-400">
                Custom / Manual Input
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Scope Selector Bar */}
      <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Active Authorization Scopes ({sandboxScopes.length} selected)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMintScopedToken}
              disabled={isMintingToken}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
            >
              {isMintingToken ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Issue Scoped Bearer Token</span>
            </button>
            <button
              type="button"
              onClick={() => setSandboxScopes(AVAILABLE_SANDBOX_SCOPES)}
              className="text-[11px] font-mono text-slate-400 hover:text-white"
            >
              Select All
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {AVAILABLE_SANDBOX_SCOPES.map((scope) => {
            const isChecked = sandboxScopes.includes(scope);
            return (
              <button
                key={scope}
                type="button"
                onClick={() => toggleScope(scope)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 border ${
                  isChecked
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {isChecked ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="w-3 h-3" />}
                <span>{scope}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Presets Row */}
      <div className="space-y-2">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">
          Endpoint Presets (CRUD Operations):
        </span>
        <div className="flex flex-wrap gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
            >
              <span
                className={`text-[10px] font-mono font-black ${
                  p.method === 'GET'
                    ? 'text-blue-400'
                    : p.method === 'POST'
                    ? 'text-emerald-400'
                    : p.method === 'PUT'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {p.method}
              </span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Builder & Response Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Request Form */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl bg-[#070b14] border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-white font-mono">
                Request Configuration
              </h3>
              <span className="text-[10px] font-mono text-emerald-400">Authenticated Scope Payload</span>
            </div>

            {/* Base Host URL */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Base Host URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Method and Endpoint */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-4 sm:col-span-3">
                <label className="block text-xs font-mono text-slate-400 mb-1">Method</label>
                <select
                  value={method}
                  onChange={(e: any) => setMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div className="col-span-8 sm:col-span-9">
                <label className="block text-xs font-mono text-slate-400 mb-1">Endpoint Path</label>
                <input
                  type="text"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="/api/developer/server/health-check"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* X-API-Key Header */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                X-API-Key Header (Credential Key / Master Key)
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="vbz_live_kt_..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Auth Bearer Token */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Bearer Authorization Token (Scoped JWT)
              </label>
              <input
                type="text"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIs..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Request Body */}
            {['POST', 'PUT', 'PATCH'].includes(method) && (
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Request Body (JSON)</label>
                <textarea
                  rows={6}
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  placeholder='{\n  "key": "value"\n}'
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleSendRequest}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing Request...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Execute {method} Request</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Response Inspector */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl bg-[#070b14] border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-white font-mono">
                Live Response Inspector
              </h3>
              {responseStatus !== null && (
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : responseStatus === 0
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {responseStatus === 0 ? 'Network Failure' : `HTTP ${responseStatus}`}
                  </span>
                  {latency !== null && (
                    <span className="text-xs font-mono text-slate-400">{latency}ms</span>
                  )}
                </div>
              )}
            </div>

            {responseBody ? (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={copyResponse}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 hover:text-white"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Output'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 max-h-[380px] overflow-auto leading-relaxed">
                  {responseBody}
                </pre>
              </div>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-slate-500 space-y-2">
                <Play className="w-8 h-8 opacity-40 text-emerald-400" />
                <p className="text-xs font-medium">
                  Select an endpoint preset or configure the request, then click Execute Request to inspect output.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
