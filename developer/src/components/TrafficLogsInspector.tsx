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
    id: 'req_998124_01',
    time: '2026-08-28 13:25:40.112',
    sdk: 'Kotlin',
    method: 'POST',
    endpoint: '/api/messages',
    status: 200,
    durationMs: 28,
    ip: '192.168.1.104',
    clientVersion: 'vibez-android-sdk/v2.4.0',
    headers: {
      'Authorization': 'Bearer vbz_live_kt_8f901ab38127498cbe0094b2',
      'Content-Type': 'application/json',
      'X-Vibez-Device-Model': 'Pixel 9 Pro',
      'X-Vibez-OS': 'Android 15',
    },
    requestBody: {
      recipientId: 'usr_8821a',
      content: 'Hey Alex, checkout the new PRIGID group release notes!',
      mediaType: 'text',
      tempId: 'tmp_msg_109283',
    },
    responseBody: {
      success: true,
      messageId: 'msg_live_7721893',
      deliveryStatus: 'sent',
      timestamp: 1787923540,
    },
  },
  {
    id: 'req_998124_02',
    time: '2026-08-28 13:25:38.890',
    sdk: 'TypeScript',
    method: 'POST',
    endpoint: '/api/auth/phone/otp',
    status: 200,
    durationMs: 42,
    ip: '82.165.197.1',
    clientVersion: 'vibez-web-client/v1.9.2',
    headers: {
      'Authorization': 'Bearer vbz_clt_ts_314ab89ecf001278ba6577a1',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    requestBody: {
      phoneNumber: '+14155552671',
      recaptchaToken: 'recaptcha_v3_passed_token',
    },
    responseBody: {
      success: true,
      otpDispatched: true,
      expiresInSeconds: 300,
      retryAfterSeconds: 60,
    },
  },
  {
    id: 'req_998124_03',
    time: '2026-08-28 13:25:35.210',
    sdk: 'Python',
    method: 'POST',
    endpoint: '/api/verification/checkout',
    status: 400,
    durationMs: 19,
    ip: '54.210.12.88',
    clientVersion: 'vibez-python-bot/v3.0.1',
    headers: {
      'Authorization': 'Bearer vbz_test_py_77218390bbca890124fe12c4',
      'Content-Type': 'application/json',
    },
    requestBody: {
      targetUserId: 'usr_invalid_9999',
      badgeTier: 'gold',
    },
    responseBody: {
      error: 'INVALID_TARGET_USER',
      message: 'User id usr_invalid_9999 does not exist or has closed their account.',
      code: 40012,
    },
    errorDetail: 'ValidationError: Target user not found in Redis cache or Spanner cluster.',
  },
  {
    id: 'req_998124_04',
    time: '2026-08-28 13:25:31.745',
    sdk: 'Go',
    method: 'WS',
    endpoint: '/api/calls/signaling',
    status: 101,
    durationMs: 11,
    ip: '35.190.22.14',
    clientVersion: 'vibez-go-signaling/v1.2.0',
    headers: {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
      'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
      'X-Vibez-Room-ID': 'room_sfu_voice_9918',
    },
    requestBody: { action: 'JOIN_ROOM', sdpOffer: 'v=0\r\no=- 20518 0 IN IP4 0.0.0.0...' },
    responseBody: { status: 'CONNECTED', peerId: 'peer_node_01', sdpAnswer: 'v=0\r\no=PRIGID_SFU...' },
  },
  {
    id: 'req_998124_05',
    time: '2026-08-28 13:25:28.004',
    sdk: 'Kotlin',
    method: 'POST',
    endpoint: '/api/statuses',
    status: 200,
    durationMs: 35,
    ip: '192.168.1.104',
    clientVersion: 'vibez-android-sdk/v2.4.0',
    headers: {
      'Authorization': 'Bearer vbz_live_kt_8f901ab38127498cbe0094b2',
      'Content-Type': 'application/json',
    },
    requestBody: {
      mediaUrl: 'https://cdn.vibez.prigid.com/status/st_99812.webp',
      caption: 'Testing the new PRIGID high-speed signaling!',
      durationSeconds: 24,
    },
    responseBody: {
      statusId: 'st_881923',
      publishedAt: 1787923528,
      expiresAt: 1788009928,
    },
  },
];

export const TrafficLogsInspector: React.FC = () => {
  const [logs] = useState<RequestDetail[]>(SAMPLE_LOGS);
  const [statusFilter, setStatusFilter] = useState<'All' | '2xx' | '4xx' | '5xx'>('All');
  const [sdkFilter, setSdkFilter] = useState<'All' | 'Kotlin' | 'TypeScript' | 'Python' | 'Go'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<RequestDetail | null>(SAMPLE_LOGS[0]);

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
