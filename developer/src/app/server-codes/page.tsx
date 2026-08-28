'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Server, 
  Code2, 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  Play, 
  ShieldCheck, 
  Radio, 
  Key, 
  Activity, 
  Sliders, 
  FileCode2, 
  FolderTree, 
  Cpu, 
  Zap, 
  ExternalLink,
  Layers,
  ChevronRight,
  Info,
  RefreshCw
} from 'lucide-react';
import { 
  SERVER_FRAMEWORKS, 
  ServerFramework, 
  ServerFile, 
  ServerConfig, 
  defaultServerConfig 
} from '../../data/serverCodesData';
import { CodeBlock } from '../../components/CodeBlock';

export default function ServerCodesPage() {
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>('custom-server');
  const [selectedFileName, setSelectedFileName] = useState<string>('index.ts');
  const [config, setConfig] = useState<ServerConfig>({
    ...defaultServerConfig,
    port: 3000,
  });
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'code' | 'sandbox' | 'deploy'>('code');

  // Custom Server Bridge State
  const [customServerUrl, setCustomServerUrl] = useState<string>('http://localhost:3000');
  const [customServerTesting, setCustomServerTesting] = useState<boolean>(false);
  const [customServerStatus, setCustomServerStatus] = useState<{
    connected: boolean;
    serverType?: string;
    latencyMs?: number;
    database?: any;
    error?: string;
    checkedAt?: string;
  }>({
    connected: true,
    serverType: 'Vibez Custom Backend (Express + Prisma)',
    latencyMs: 8,
    database: { provider: 'PostgreSQL', status: 'connected', totalUsers: 2450, totalMessages: 18490 },
    checkedAt: new Date().toLocaleTimeString(),
  });

  const checkLiveCustomServer = async (targetUrl = customServerUrl) => {
    setCustomServerTesting(true);
    try {
      const res = await fetch(`/api/developer/server/custom-server-status?url=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();
      setCustomServerStatus(data);
    } catch (err: any) {
      setCustomServerStatus({
        connected: false,
        serverType: 'Custom Vibez Express Server',
        error: err.message || 'Connection failed',
        checkedAt: new Date().toLocaleTimeString(),
      });
    } finally {
      setCustomServerTesting(false);
    }
  };

  // Interactive Live Sandbox States
  const [sandboxEndpoint, setSandboxEndpoint] = useState<'webhook' | 'dispatch' | 'rtc' | 'oauth' | 'health'>('webhook');
  const [sandboxLoading, setSandboxLoading] = useState<boolean>(false);
  const [sandboxResponse, setSandboxResponse] = useState<any>(null);
  const [routeThroughCustomServer, setRouteThroughCustomServer] = useState<boolean>(true);

  // Webhook Test Form
  const [testSecret, setTestSecret] = useState<string>(config.webhookSecret);
  const [testPayload, setTestPayload] = useState<string>(
    JSON.stringify(
      {
        event_id: 'evt_' + Math.random().toString(36).substring(2, 9),
        event_type: 'message.sent',
        timestamp: Math.floor(Date.now() / 1000),
        data: {
          message_id: 'msg_98242194',
          sender_id: 'usr_sarah_connor',
          recipient_id: 'usr_john_doe',
          content: 'Hey! Are we still syncing for the deployment at 3 PM?',
          channel_id: 'dm_sarah_john'
        }
      },
      null,
      2
    )
  );
  const [testSignature, setTestSignature] = useState<string>('');

  // Message Dispatch Test Form
  const [dispatchRecipient, setDispatchRecipient] = useState<string>('usr_john_doe');
  const [dispatchContent, setDispatchContent] = useState<string>('System notification: Your API quota has been replenished.');
  const [dispatchApiKey, setDispatchApiKey] = useState<string>(config.apiKey);

  // WebRTC Token Form
  const [rtcRoomId, setRtcRoomId] = useState<string>('room_vibez_enterprise_alpha');
  const [rtcUserId, setRtcUserId] = useState<string>('usr_dev_3821');

  // OAuth Form
  const [oauthClientId, setOauthClientId] = useState<string>(config.clientId);
  const [oauthClientSecret, setOauthClientSecret] = useState<string>(config.clientSecret);

  const currentFramework: ServerFramework = 
    SERVER_FRAMEWORKS.find((f) => f.id === selectedFrameworkId) || SERVER_FRAMEWORKS[0];

  const currentFile: ServerFile = 
    currentFramework.files.find((f) => f.name === selectedFileName) || currentFramework.files[0];

  const renderedContent = currentFile.content(config);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(renderedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([renderedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Run Sandbox Live Tests
  const handleRunSandbox = async () => {
    setSandboxLoading(true);
    setSandboxResponse(null);
    try {
      if (sandboxEndpoint === 'webhook') {
        const res = await fetch('/api/developer/server/verify-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: testSecret,
            payload: testPayload,
            signature: testSignature || undefined,
            timestamp: Math.floor(Date.now() / 1000)
          })
        });
        const data = await res.json();
        setSandboxResponse(data);
        if (data.data?.computedSignature && !testSignature) {
          setTestSignature(`v1=${data.data.computedSignature}`);
        }
      } else if (sandboxEndpoint === 'dispatch') {
        const res = await fetch('/api/developer/server/dispatch-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dispatchApiKey}`
          },
          body: JSON.stringify({
            recipientId: dispatchRecipient,
            content: dispatchContent,
            messageType: 'text',
            metadata: { priority: 'high', origin: 'developer_sandbox' },
            customServerUrl: routeThroughCustomServer ? customServerUrl : undefined,
          })
        });
        const data = await res.json();
        setSandboxResponse(data);
      } else if (sandboxEndpoint === 'rtc') {
        const res = await fetch('/api/developer/server/generate-rtc-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: rtcRoomId,
            userId: rtcUserId,
            role: 'publisher',
            ttlSeconds: 3600
          })
        });
        const data = await res.json();
        setSandboxResponse(data);
      } else if (sandboxEndpoint === 'oauth') {
        const res = await fetch('/api/developer/server/issue-oauth-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: oauthClientId,
            client_secret: oauthClientSecret,
            grant_type: 'client_credentials',
            scope: 'messages:write rtc:signaling'
          })
        });
        const data = await res.json();
        setSandboxResponse(data);
      } else if (sandboxEndpoint === 'health') {
        const res = await fetch(`/api/developer/server/health-check?customServerUrl=${encodeURIComponent(customServerUrl)}`);
        const data = await res.json();
        setSandboxResponse(data);
      }
    } catch (err: any) {
      setSandboxResponse({ success: false, error: err.message || 'Network error' });
    } finally {
      setSandboxLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header & Breadcrumbs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Link href="/" className="hover:text-emerald-400">Developer Hub</Link>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-emerald-400 font-bold">Server Codes & Backend Hub</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    Developer Server Codes
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                      Enterprise v2.4
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Production backend server implementations, HMAC cryptography, WebRTC signaling & real-time webhook proxies • Powered by <span className="text-emerald-400 font-bold">PRIGID GROUP</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions & Navigation Tabs */}
            <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'code'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Server Codebases</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sandbox')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'sandbox'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Live Server Sandbox</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('deploy')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'deploy'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Deploy Recipes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Custom Server Live Bridge Panel */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={`w-3.5 h-3.5 rounded-full mt-1 sm:mt-0 flex-shrink-0 ${
                customServerStatus.connected ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
              }`} />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    Custom Server Live Bridge
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    customServerStatus.connected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {customServerStatus.connected ? 'ACTIVE & CONNECTED' : 'STANDBY MODE'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                    Port: 3000 (Express + Prisma)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Target: <code className="text-emerald-400 font-mono font-bold">{customServerUrl}</code> • Database: <span className="text-slate-300 font-medium">PostgreSQL Prisma (Connected)</span> • Real-Time: <span className="text-slate-300 font-medium">Socket.IO Rooms</span>
                </p>
              </div>
            </div>

            {/* Quick URL Switcher & Ping Button */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                <span className="text-[10px] text-slate-400 font-mono mr-2">URL:</span>
                <input
                  type="text"
                  value={customServerUrl}
                  onChange={(e) => setCustomServerUrl(e.target.value)}
                  className="bg-transparent text-xs font-mono text-white focus:outline-none w-44 sm:w-56"
                  placeholder="http://localhost:3000"
                />
              </div>
              <button
                type="button"
                onClick={() => checkLiveCustomServer(customServerUrl)}
                disabled={customServerTesting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${customServerTesting ? 'animate-spin' : ''}`} />
                <span>{customServerTesting ? 'Pinging...' : 'Ping Server'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedFrameworkId('custom-server');
                  setSelectedFileName('index.ts');
                  setActiveTab('code');
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all"
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>View Server Code</span>
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: SERVER CODEBASES */}
        {activeTab === 'code' && (
          <div className="space-y-6">
            {/* Framework Switcher Carousel */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {SERVER_FRAMEWORKS.map((framework) => {
                const isSelected = framework.id === selectedFrameworkId;
                return (
                  <button
                    key={framework.id}
                    type="button"
                    onClick={() => {
                      setSelectedFrameworkId(framework.id);
                      setSelectedFileName(framework.files[0]?.name || '');
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                      isSelected
                        ? 'bg-slate-900 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{framework.icon}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        isSelected 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {framework.badge}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-white group-hover:text-emerald-400 transition-colors">
                      {framework.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                      {framework.runtime.split('/')[0]}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Main Code Studio: Configurator + Multi-File Viewer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Interactive Server Configurator */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Live Configurator</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfig(defaultServerConfig)}
                      className="text-[10px] font-mono text-slate-400 hover:text-emerald-400 flex items-center gap-1"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      Reset
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tweak your backend runtime settings. The server code and environment files adapt dynamically.
                  </p>

                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                        Server Port
                      </label>
                      <input
                        type="number"
                        value={config.port}
                        onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value, 10) || 8080 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-emerald-400 focus:outline-none focus:border-emerald-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                        API Secret Key
                      </label>
                      <input
                        type="text"
                        value={config.apiKey}
                        onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                        Webhook Signing Secret (HMAC)
                      </label>
                      <input
                        type="text"
                        value={config.webhookSecret}
                        onChange={(e) => setConfig({ ...config, webhookSecret: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                        API Base URL
                      </label>
                      <input
                        type="text"
                        value={config.apiUrl}
                        onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-[11px]"
                      />
                    </div>

                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <label className="flex items-center justify-between cursor-pointer py-1">
                        <span className="text-slate-300 text-[11px]">Enable Redis / In-Memory Cache</span>
                        <input
                          type="checkbox"
                          checked={config.enableRedis}
                          onChange={(e) => setConfig({ ...config, enableRedis: e.target.checked })}
                          className="accent-emerald-500 w-4 h-4 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer py-1">
                        <span className="text-slate-300 text-[11px]">Enable WebSocket Signaling Relay</span>
                        <input
                          type="checkbox"
                          checked={config.enableWebSocket}
                          onChange={(e) => setConfig({ ...config, enableWebSocket: e.target.checked })}
                          className="accent-emerald-500 w-4 h-4 rounded"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* File Tree Navigator */}
                <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-3 shadow-xl">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <FolderTree className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Project Files ({currentFramework.files.length})</h3>
                  </div>

                  <div className="space-y-1">
                    {currentFramework.files.map((file) => {
                      const isFileSelected = file.name === selectedFileName;
                      return (
                        <button
                          key={file.name}
                          type="button"
                          onClick={() => setSelectedFileName(file.name)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all text-left ${
                            isFileSelected
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold'
                              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileCode2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{file.path}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                            {file.language}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Code Viewer & Actions */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                  
                  {/* File Header Bar */}
                  <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                        <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                        <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-200">
                        {currentFramework.name} / <span className="text-emerald-400">{currentFile.path}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium transition-all"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy File'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadFile}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export {currentFile.name}</span>
                      </button>
                    </div>
                  </div>

                  {/* Code Viewer */}
                  <div className="max-h-[680px] overflow-y-auto">
                    <CodeBlock code={renderedContent} language={currentFile.language} />
                  </div>

                  {/* Footer Stats */}
                  <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <div className="flex items-center gap-4">
                      <span>Lines: {renderedContent.split('\n').length}</span>
                      <span>Bytes: {new Blob([renderedContent]).size} B</span>
                      <span>Runtime: {currentFramework.runtime}</span>
                    </div>
                    <div className="text-emerald-400 font-medium flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>PRIGID Verified Architecture</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE SERVER SANDBOX & DIAGNOSTICS */}
        {activeTab === 'sandbox' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-emerald-400" />
                    Live Server-Side Integration Sandbox
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Execute real server-side requests, cryptographic HMAC SHA-256 verifications, and message dispatches against live Next.js API route handlers.
                  </p>
                </div>

                {/* Endpoint Selection Pills */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'webhook', label: '1. HMAC Webhook Verify', icon: ShieldCheck },
                    { id: 'dispatch', label: '2. Message Dispatch', icon: Zap },
                    { id: 'rtc', label: '3. WebRTC Room Token', icon: Radio },
                    { id: 'oauth', label: '4. OAuth2 Token Exchange', icon: Key },
                    { id: 'health', label: '5. Gateway Health Ping', icon: Activity },
                  ].map((ep) => {
                    const Icon = ep.icon;
                    const isActive = sandboxEndpoint === ep.id;
                    return (
                      <button
                        key={ep.id}
                        type="button"
                        onClick={() => {
                          setSandboxEndpoint(ep.id as any);
                          setSandboxResponse(null);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                          isActive
                            ? 'bg-emerald-500 text-slate-950 shadow-md'
                            : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{ep.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Endpoint Dynamic Form + Live Console Output */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Form Column */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-4 font-mono text-xs">
                    
                    {/* SCENARIO 1: WEBHOOK HMAC VALIDATOR */}
                    {sandboxEndpoint === 'webhook' && (
                      <>
                        <div className="flex items-center justify-between text-emerald-400 font-bold">
                          <span>POST /api/developer/server/verify-webhook</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[10px]">HMAC-SHA256</span>
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                            Webhook Secret Key
                          </label>
                          <input
                            type="text"
                            value={testSecret}
                            onChange={(e) => setTestSecret(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                            Raw JSON Payload
                          </label>
                          <textarea
                            rows={6}
                            value={testPayload}
                            onChange={(e) => setTestPayload(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs font-mono resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                            Provided Signature (Leave blank to auto-compute)
                          </label>
                          <input
                            type="text"
                            placeholder="v1=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                            value={testSignature}
                            onChange={(e) => setTestSignature(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                          />
                        </div>
                      </>
                    )}

                    {/* SCENARIO 2: MESSAGE DISPATCH */}
                    {sandboxEndpoint === 'dispatch' && (
                      <>
                        <div className="flex items-center justify-between text-emerald-400 font-bold">
                          <span>POST /api/developer/server/dispatch-message</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[10px]">Server-to-Server</span>
                        </div>

                        {/* Custom Server Router Switch */}
                        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-200">Execution Target</span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              routeThroughCustomServer ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {routeThroughCustomServer ? 'Live Custom Server (/server)' : 'Developer Edge'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                            <button
                              type="button"
                              onClick={() => setRouteThroughCustomServer(true)}
                              className={`p-2 rounded-lg border text-left transition-all ${
                                routeThroughCustomServer
                                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <div>🏢 Custom Server</div>
                              <div className="text-[9px] text-slate-400 mt-0.5">Direct to {customServerUrl}</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setRouteThroughCustomServer(false)}
                              className={`p-2 rounded-lg border text-left transition-all ${
                                !routeThroughCustomServer
                                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <div>⚡ Edge Gateway</div>
                              <div className="text-[9px] text-slate-400 mt-0.5">High-speed proxy simulation</div>
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                            Bearer API Key
                          </label>
                          <input
                            type="text"
                            value={dispatchApiKey}
                            onChange={(e) => setDispatchApiKey(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                            Recipient User ID
                          </label>
                          <input
                            type="text"
                            value={dispatchRecipient}
                            onChange={(e) => setDispatchRecipient(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                            Message Content
                          </label>
                          <textarea
                            rows={3}
                            value={dispatchContent}
                            onChange={(e) => setDispatchContent(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs resize-none"
                          />
                        </div>
                      </>
                    )}

                    {/* SCENARIO 3: WEBRTC TOKEN */}
                    {sandboxEndpoint === 'rtc' && (
                      <>
                        <div className="flex items-center justify-between text-emerald-400 font-bold">
                          <span>POST /api/developer/server/generate-rtc-token</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[10px]">Signaling & STUN/TURN</span>
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                            Room ID
                          </label>
                          <input
                            type="text"
                            value={rtcRoomId}
                            onChange={(e) => setRtcRoomId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                            User ID
                          </label>
                          <input
                            type="text"
                            value={rtcUserId}
                            onChange={(e) => setRtcUserId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                          />
                        </div>
                      </>
                    )}

                    {/* SCENARIO 4: OAUTH2 EXCHANGE */}
                    {sandboxEndpoint === 'oauth' && (
                      <>
                        <div className="flex items-center justify-between text-emerald-400 font-bold">
                          <span>POST /api/developer/server/issue-oauth-token</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[10px]">Client Credentials</span>
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                            Client ID
                          </label>
                          <input
                            type="text"
                            value={oauthClientId}
                            onChange={(e) => setOauthClientId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                            Client Secret
                          </label>
                          <input
                            type="password"
                            value={oauthClientSecret}
                            onChange={(e) => setOauthClientSecret(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                          />
                        </div>
                      </>
                    )}

                    {/* SCENARIO 5: HEALTH PING */}
                    {sandboxEndpoint === 'health' && (
                      <>
                        <div className="flex items-center justify-between text-emerald-400 font-bold">
                          <span>GET /api/developer/server/health-check</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[10px]">Diagnostics</span>
                        </div>
                        <p className="text-slate-400 text-xs leading-relaxed">
                          Pings the VIBEZ backend edge gateway, verifies cluster memory and uptime, and computes roundtrip network latency.
                        </p>
                      </>
                    )}

                    <button
                      type="button"
                      disabled={sandboxLoading}
                      onClick={handleRunSandbox}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:opacity-95 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
                    >
                      {sandboxLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Executing Server Call...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Execute Live Server Call</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Output Console Column */}
                <div className="lg:col-span-6 space-y-2">
                  <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3 min-h-[320px]">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-mono font-bold text-slate-300">Live Response Payload</span>
                      </div>
                      {sandboxResponse && (
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          sandboxResponse.success !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {sandboxResponse.success !== false ? '200 OK' : '400 / 500 ERROR'}
                        </span>
                      )}
                    </div>

                    {sandboxResponse ? (
                      <div className="max-h-[340px] overflow-y-auto">
                        <CodeBlock 
                          code={JSON.stringify(sandboxResponse, null, 2)} 
                          language="json" 
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 space-y-2 font-mono text-xs">
                        <Info className="w-8 h-8 text-slate-700" />
                        <p>Click "Execute Live Server Call" to inspect actual server output</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DEPLOYMENT ARCHITECTURE RECIPES */}
        {activeTab === 'deploy' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Recipe 1: Docker Compose */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono font-bold">
                    🐳
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Docker Compose Production Stack</h3>
                    <p className="text-xs text-slate-400">Isolated server + Redis cache setup</p>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto">
                  <CodeBlock
                    language="yaml"
                    code={`version: '3.8'

services:
  vibez-backend:
    build: .
    restart: always
    ports:
      - "${config.port}:${config.port}"
    environment:
      - PORT=${config.port}
      - VIBEZ_API_KEY=${config.apiKey}
      - VIBEZ_WEBHOOK_SECRET=${config.webhookSecret}
      - REDIS_URL=redis://cache:6379
    depends_on:
      - cache

  cache:
    image: redis:7-alpine
    restart: always
    ports:
      - "6379:6379"`}
                  />
                </div>
              </div>

              {/* Recipe 2: Kubernetes Deployment */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono font-bold">
                    ☸️
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Kubernetes Ingress & Deployment</h3>
                    <p className="text-xs text-slate-400">Zero-downtime rolling updates on K8s</p>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto">
                  <CodeBlock
                    language="yaml"
                    code={`apiVersion: apps/v1
kind: Deployment
metadata:
  name: vibez-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vibez-server
  template:
    metadata:
      labels:
        app: vibez-server
    spec:
      containers:
      - name: vibez-server
        image: registry.vibez.prigid.com/backend:v2.4
        ports:
        - containerPort: ${config.port}
        envFrom:
        - secretRef:
            name: vibez-secrets`}
                  />
                </div>
              </div>

              {/* Recipe 3: Nginx Reverse Proxy with WebSocket */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono font-bold">
                    🛡️
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Nginx Reverse Proxy & WebSocket Upgrade</h3>
                    <p className="text-xs text-slate-400">SSL termination and keep-alive configuration</p>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto">
                  <CodeBlock
                    language="bash"
                    code={`server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:${config.port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`}
                  />
                </div>
              </div>

              {/* Recipe 4: Systemd Service */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono font-bold">
                    ⚙️
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Linux Systemd Daemon Service</h3>
                    <p className="text-xs text-slate-400">Auto-restart on failure for Ubuntu/Debian</p>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto">
                  <CodeBlock
                    language="bash"
                    code={`[Unit]
Description=VIBEZ Developer Backend Server
After=network.target

[Service]
Type=simple
User=vibez
WorkingDirectory=/opt/vibez-server
ExecStart=/usr/bin/node /opt/vibez-server/dist/server.js
Restart=on-failure
Environment=NODE_ENV=production PORT=${config.port}

[Install]
WantedBy=multi-user.target`}
                  />
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
