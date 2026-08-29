'use client';

import React, { useState } from 'react';
import { Filter, Search, Eye, AlertCircle, CheckCircle2, Clock, Terminal, ChevronRight, X, ArrowDown } from 'lucide-react';

interface RequestDetail {
  id: string;
  time: string;
  sdk: 'Kotlin' | 'TypeScript' | 'Python' | 'Go';
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'WS';
  endpoint: string;
  status: number;
  durationMs: number;
  ip: string;
  clientVersion: string;
  headers: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
  errorDetail?: string;
}

const SAMPLE_LOGS: RequestDetail[] = [
  {
    id: 'req_890123',
    time: '2026-08-28 17:15:02.102',
    sdk: 'Kotlin',
    method: 'GET',
    endpoint: '/api/developer/server/health-check',
    status: 200,
    durationMs: 12,
    ip: '192.168.1.104',
    clientVersion: 'vibez-android-sdk/v3.2.0',
    headers: {
      'Authorization': 'Bearer vbz_live_master_key',
      'User-Agent': 'VibezAndroid/3.2.0 (Android 14; Pixel 8 Pro)',
      'X-Vibez-Platform': 'Android',
    },
    requestBody: null,
    responseBody: { status: 'healthy', timestamp: 1787946902, region: 'us-east-1' },
  },
  {
    id: 'req_890124',
    time: '2026-08-28 17:14:58.890',
    sdk: 'TypeScript',
    method: 'POST',
    endpoint: '/api/developer/server/dispatch-message',
    status: 200,
    durationMs: 24,
    ip: '34.201.12.88',
    clientVersion: 'vibez-node-sdk/v2.1.0',
    headers: {
      'Authorization': 'Bearer vbz_live_master_key',
      'Content-Type': 'application/json',
      'X-Signature-256': 'sha256=a89f3c21...',
    },
    requestBody: { channelId: 'chn_dev_01', message: 'Hello Vibez Developer Network' },
    responseBody: { success: true, messageId: 'msg_881923', dispatchedAt: '2026-08-28T17:14:58Z' },
  },
  {
    id: 'req_890125',
    time: '2026-08-28 17:14:42.420',
    sdk: 'Python',
    method: 'POST',
    endpoint: '/api/developer/server/generate-rtc-token',
    status: 200,
    durationMs: 18,
    ip: '18.222.45.101',
    clientVersion: 'vibez-python/v1.4.2',
    headers: {
      'Authorization': 'Bearer vbz_live_master_key',
      'Content-Type': 'application/json',
    },
    requestBody: { roomId: 'room_voice_global', uid: 'usr_python_bot' },
    responseBody: { rtcToken: 'rtc_tok_7718293a9f', expiresAt: 1787950502 },
  },
  {
    id: 'req_890126',
    time: '2026-08-28 17:14:10.910',
    sdk: 'Go',
    method: 'POST',
    endpoint: '/api/developer/server/verify-webhook',
    status: 200,
    durationMs: 29,
    ip: '52.90.110.22',
    clientVersion: 'vibez-go-sdk/v1.1.0',
    headers: {
      'Content-Type': 'application/json',
      'X-Vibez-Signature': 'v1=9910a8b7c6...',
    },
    requestBody: { event: 'user.subscribed', payload: { userId: 'usr_99102' } },
    responseBody: { valid: true, verifiedAt: '2026-08-28T17:14:10Z' },
  },
];

export const TrafficLogsInspector: React.FC = () => {
  const [logs, setLogs] = useState<RequestDetail[]>(SAMPLE_LOGS);
  const [statusFilter, setStatusFilter] = useState<'All' | '2xx' | '4xx' | '5xx'>('All');
  const [sdkFilter, setSdkFilter] = useState<'All' | 'Kotlin' | 'TypeScript' | 'Python' | 'Go'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<RequestDetail | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const handleLivePing = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/developer/server/health-check');
      const data = await res.json();
      const durationMs = Math.round(performance.now() - start);

      const newLog: RequestDetail = {
        id: `req_${Date.now().toString().slice(-6)}`,
        time: new Date().toISOString().replace('T', ' ').slice(0, 23),
        sdk: 'Kotlin',
        method: 'GET',
        endpoint: '/api/developer/server/health-check',
        status: res.status,
        durationMs,
        ip: '127.0.0.1',
        clientVersion: 'vibez-developer-console/v3.0',
        headers: {
          'Authorization': 'Bearer vbz_live_master_key',
          'Content-Type': 'application/json',
          'X-Vibez-Platform': 'AI Studio Cloud',
        },
        requestBody: null,
        responseBody: data,
      };

      setLogs((prev) => [newLog, ...prev]);
      if (!selectedLog) setSelectedLog(newLog);
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - start);
      const errLog: RequestDetail = {
        id: `req_err_${Date.now().toString().slice(-6)}`,
        time: new Date().toISOString().replace('T', ' ').slice(0, 23),
        sdk: 'TypeScript',
        method: 'GET',
        endpoint: '/api/developer/server/health-check',
        status: 500,
        durationMs,
        ip: '127.0.0.1',
        clientVersion: 'vibez-developer-console/v3.0',
        headers: { 'Content-Type': 'application/json' },
        errorDetail: err?.message || 'Network request failure',
      };
      setLogs((prev) => [errLog, ...prev]);
      if (!selectedLog) setSelectedLog(errLog);
    } finally {
      setIsPinging(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (statusFilter === '2xx' && (log.status < 200 || log.status >= 300)) return false;
    if (statusFilter === '4xx' && (log.status < 400 || log.status >= 500)) return false;
    if (statusFilter === '5xx' && log.status < 500) return false;
    if (sdkFilter !== 'All' && log.sdk !== sdkFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.endpoint.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q) ||
        log.ip.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-black uppercase tracking-wider text-white">
              Traffic Logs & Error Inspector
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Deep packet inspection, latency percentiles, and runtime error traces • Powered by <span className="text-emerald-400 font-bold">PRIGID GROUP</span>
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleLivePing}
            disabled={isPinging}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Clock className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
            <span>{isPinging ? 'Pinging...' : 'Ping Live API'}</span>
          </button>

          {/* Status filter */}
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs font-mono">
            {(['All', '2xx', '4xx', '5xx'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === st ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* SDK filter */}
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs font-mono">
            {(['All', 'Kotlin', 'TypeScript', 'Python', 'Go'] as const).map((sdk) => (
              <button
                key={sdk}
                type="button"
                onClick={() => setSdkFilter(sdk)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  sdkFilter === sdk ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {sdk}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Logs Table + Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Logs Table */}
        <div className="lg:col-span-7 rounded-2xl bg-[#070b14] border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search endpoint, request ID, IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Showing {filteredLogs.length} events
            </span>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <Terminal className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-xs font-mono text-slate-400 font-bold">No traffic logs recorded yet</div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Click "Ping Live API" above or issue requests through your SDKs to record telemetry in real time.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
              {filteredLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-3.5 cursor-pointer transition-all flex items-center justify-between gap-3 text-xs font-mono ${
                      isSelected ? 'bg-emerald-500/10 border-l-4 border-emerald-500' : 'hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                          log.status === 200 || log.status === 101
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {log.status}
                      </span>
                      <span className="text-slate-400 font-bold">{log.method}</span>
                      <span className="text-white font-medium truncate">{log.endpoint}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                        {log.sdk}
                      </span>
                      <span className="text-emerald-400 font-bold">{log.durationMs}ms</span>
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Request Inspector Details */}
        <div className="lg:col-span-5 rounded-2xl bg-[#070b14] border border-slate-800 shadow-xl p-5 space-y-4">
          {selectedLog ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">{selectedLog.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400">
                      {selectedLog.sdk} Client
                    </span>
                  </div>
                  <div className="text-sm font-black text-white font-mono flex items-center gap-2">
                    <span>{selectedLog.method}</span>
                    <span className="text-emerald-400">{selectedLog.endpoint}</span>
                  </div>
                </div>
              </div>

              {/* Timing & Network Breakdown */}
              <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Duration</div>
                  <div className="text-white font-bold mt-0.5">{selectedLog.durationMs} ms</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Status</div>
                  <div className="text-emerald-400 font-bold mt-0.5">{selectedLog.status} OK</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Source IP</div>
                  <div className="text-slate-300 font-bold mt-0.5">{selectedLog.ip}</div>
                </div>
              </div>

              {/* Request Headers */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Request Headers</span>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1 max-h-24 overflow-y-auto">
                  {Object.entries(selectedLog.headers).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 truncate">
                      <span className="text-slate-500">{k}:</span>
                      <span className="text-emerald-300 truncate">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Request Payload */}
              {selectedLog.requestBody && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Request Payload</span>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-28">
                    {JSON.stringify(selectedLog.requestBody, null, 2)}
                  </pre>
                </div>
              )}

              {/* Response Payload */}
              {selectedLog.responseBody && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Response Payload</span>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-28">
                    {JSON.stringify(selectedLog.responseBody, null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-slate-500 font-mono text-xs">
              Select a request from the stream to inspect details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
