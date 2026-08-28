'use client';

import React, { useState, useEffect } from 'react';
import { Play, Send, RefreshCw, Copy, Check, Sparkles, Shield, Key, AlertCircle } from 'lucide-react';
import { useDeveloperAuth } from '../context/DeveloperAuthContext';

interface Preset {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  body: string;
  requiresAuth: boolean;
}

export const ApiExplorerSandbox: React.FC = () => {
  const { user, keys } = useDeveloperAuth();

  const presets: Preset[] = [
    {
      name: 'System Health & Telemetry',
      method: 'GET',
      endpoint: '/api/developer/server/health-check',
      body: '',
      requiresAuth: false,
    },
    {
      name: 'Dispatch Live Message',
      method: 'POST',
      endpoint: '/api/developer/server/dispatch-message',
      body: JSON.stringify({ recipientId: 'usr_live_receiver', content: 'Testing live payload from Sandbox ⚡' }, null, 2),
      requiresAuth: true,
    },
    {
      name: 'Verify Webhook Signature',
      method: 'POST',
      endpoint: '/api/developer/server/verify-webhook',
      body: JSON.stringify({ payload: { event: 'user.registered', userId: 'usr_10092' }, signature: 'sha256=mock' }, null, 2),
      requiresAuth: true,
    },
    {
      name: 'Issue OAuth Token',
      method: 'POST',
      endpoint: '/api/developer/server/issue-oauth-token',
      body: JSON.stringify({ clientId: 'clt_live_client', grantType: 'client_credentials' }, null, 2),
      requiresAuth: true,
    },
    {
      name: 'Generate WebRTC RTC Token',
      method: 'POST',
      endpoint: '/api/developer/server/generate-rtc-token',
      body: JSON.stringify({ channelName: 'voice_room_01', uid: 109238 }, null, 2),
      requiresAuth: true,
    },
  ];

  const primaryKey = keys.length > 0 ? (keys[0].rawKey || keys[0].maskedKey) : '';

  const [baseUrl, setBaseUrl] = useState('');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
  const [endpoint, setEndpoint] = useState('/api/developer/server/health-check');
  const [authToken, setAuthToken] = useState('');
  const [apiKey, setApiKey] = useState(primaryKey);
  const [requestBody, setRequestBody] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseBody, setResponseBody] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (primaryKey && !apiKey) {
      setApiKey(primaryKey);
    }
  }, [primaryKey]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const applyPreset = (preset: Preset) => {
    setMethod(preset.method);
    setEndpoint(preset.endpoint);
    setRequestBody(preset.body);
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
        } catch (e) {
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
            <span>Protected Sandbox Environment</span>
          </div>
          <h2 className="text-lg font-black text-white">Interactive API Payload Tester</h2>
          <p className="text-xs text-slate-400">
            Construct, execute, and inspect real HTTP payloads using your primary developer credentials.
          </p>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 shrink-0">
          <Key className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Active Primary Key</div>
            <div className="truncate font-bold text-white max-w-[180px]">
              {primaryKey ? primaryKey.slice(0, 16) + '...' : 'No API Key Generated'}
            </div>
          </div>
        </div>
      </div>

      {/* Presets Row */}
      <div className="space-y-2">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">
          Endpoint Presets:
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
                  p.method === 'GET' ? 'text-blue-400' : 'text-emerald-400'
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
              <span className="text-[10px] font-mono text-emerald-400">Authenticated Payload</span>
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
                X-API-Key Header (Primary Key)
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
                Bearer Authorization Token (Optional)
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
                  <span>Execute Request</span>
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
