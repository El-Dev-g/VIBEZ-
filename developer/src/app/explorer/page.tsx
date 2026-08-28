'use client';

import React, { useState } from 'react';
import { Play, Send, CheckCircle, AlertCircle, RefreshCw, Copy, Check, Shield, Sparkles } from 'lucide-react';

interface Preset {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  body: string;
  requiresAuth: boolean;
}

export default function ApiExplorerPage() {
  const presets: Preset[] = [
    {
      name: 'System Health & Telemetry',
      method: 'GET',
      endpoint: '/api/system/status',
      body: '',
      requiresAuth: false
    },
    {
      name: 'Request Phone OTP',
      method: 'POST',
      endpoint: '/api/auth/phone/otp',
      body: JSON.stringify({ phoneNumber: '+1234567890' }, null, 2),
      requiresAuth: false
    },
    {
      name: 'Verify Phone OTP Code',
      method: 'POST',
      endpoint: '/api/auth/phone/verify',
      body: JSON.stringify({ phoneNumber: '+1234567890', code: '123456', displayName: 'Dev Tester' }, null, 2),
      requiresAuth: false
    },
    {
      name: 'Send Instant Message',
      method: 'POST',
      endpoint: '/api/messages',
      body: JSON.stringify({ recipientId: 'usr_sample', content: 'Testing from VIBEZ API Explorer ⚡', type: 'TEXT' }, null, 2),
      requiresAuth: true
    },
    {
      name: 'Create Ephemeral Status',
      method: 'POST',
      endpoint: '/api/statuses',
      body: JSON.stringify({ content: 'Status created via Developer Portal', backgroundColor: '#10b981' }, null, 2),
      requiresAuth: true
    }
  ];

  const [baseUrl, setBaseUrl] = useState('https://vibez-n5h1.onrender.com');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
  const [endpoint, setEndpoint] = useState('/api/system/status');
  const [authToken, setAuthToken] = useState('');
  const [apiKey, setApiKey] = useState('vbz_sandbox_live_token');
  const [requestBody, setRequestBody] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseBody, setResponseBody] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

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
    const fullUrl = `${baseUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
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
      setResponseBody(JSON.stringify({
        error: 'Network or CORS Error',
        message: err?.message || 'Failed to connect to backend endpoint. Ensure server is active.',
        endpoint: fullUrl,
        poweredBy: 'PRIGID GROUP Global Cloud'
      }, null, 2));
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Sandbox</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">API Request Explorer</h1>
          <p className="text-slate-400 text-sm mt-1">
            Execute real HTTP requests live against VIBEZ APIs • Powered by <span className="text-emerald-400 font-bold">PRIGID GROUP</span>
          </p>
        </div>
      </div>

      {/* Presets Row */}
      <div className="space-y-2">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">Quick Presets:</span>
        <div className="flex flex-wrap gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
            >
              <span className={`text-[10px] font-mono font-black ${
                p.method === 'GET' ? 'text-blue-400' : 'text-emerald-400'
              }`}>
                {p.method}
              </span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Request Builder & Response Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Request Form */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl bg-[#070b14] border border-slate-800 p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">HTTP Request Config</h3>

            {/* Base URL */}
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
                  placeholder="/api/system/status"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Auth Bearer Token */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Bearer Token (JWT - Optional)</label>
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
                  rows={7}
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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:opacity-95 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing Request...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send API Request</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Response Inspector */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl bg-[#070b14] border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Live Response Inspector</h3>
              {responseStatus !== null && (
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                    responseStatus >= 200 && responseStatus < 300
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : responseStatus === 0
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {responseStatus === 0 ? 'Network Failure' : `HTTP ${responseStatus}`}
                  </span>
                  {latency !== null && (
                    <span className="text-xs font-mono text-slate-400">
                      {latency}ms
                    </span>
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
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-[11px] font-mono text-slate-300 hover:text-white"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Output'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 max-h-[420px] overflow-auto leading-relaxed">
                  {responseBody}
                </pre>
              </div>
            ) : (
              <div className="h-[320px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-slate-500 space-y-2">
                <Play className="w-8 h-8 opacity-40" />
                <p className="text-xs font-medium">Select an endpoint preset or configure the form, then click Send Request to inspect results.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
