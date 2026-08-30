'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Search,
  Shield,
  Server,
  Code,
  Globe,
  Terminal,
  Zap,
  CheckCircle,
  AlertTriangle,
  FileText,
  Webhook,
  Layers,
  Key,
  Users,
  MessageSquare,
  Bell,
  CreditCard,
  Settings,
  HelpCircle,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { CodeBlock } from '../../components/CodeBlock';

interface NavItem {
  id: string;
  label: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path?: string;
}

interface NavCategory {
  title: string;
  icon: any;
  items: NavItem[];
}

function DocsContent() {
  const searchParams = useSearchParams();
  const [activeItem, setActiveItem] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Restore and maintain active docs section on reload / direct link
  useEffect(() => {
    const docFromQuery = searchParams?.get('doc') || searchParams?.get('section');
    if (docFromQuery) {
      setActiveItem(docFromQuery);
      return;
    }

    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setActiveItem(hash);
        return;
      }

      const savedDoc = localStorage.getItem('vibez_active_docs_section');
      if (savedDoc) {
        setActiveItem(savedDoc);
      }
    }
  }, [searchParams]);

  const handleSelectDoc = (id: string) => {
    setActiveItem(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vibez_active_docs_section', id);
      const url = new URL(window.location.href);
      url.searchParams.set('doc', id);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const toggleCategory = (title: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const navStructure: NavCategory[] = [
    {
      title: 'Overview',
      icon: BookOpen,
      items: [
        { id: 'intro', label: 'Introduction' },
        { id: 'get-started', label: 'Get Started' },
        { id: 'architecture', label: 'Architecture' },
        { id: 'api-status', label: 'API Status' },
      ],
    },
    {
      title: 'Guides',
      icon: Layers,
      items: [
        { id: 'guide-auth', label: 'Authentication & Tokens' },
        { id: 'guide-messaging', label: 'Real-time Messaging' },
        { id: 'guide-webrtc', label: 'Voice & Video Calling' },
        { id: 'guide-webhooks', label: 'Webhooks & HMAC Signatures' },
      ],
    },
    {
      title: 'API Reference',
      icon: Terminal,
      items: [
        { id: 'api-health', label: 'GET /health-check', method: 'GET', path: '/api/developer/server/health-check' },
        { id: 'api-status-cluster', label: 'GET /custom-server-status', method: 'GET', path: '/api/developer/server/custom-server-status' },
        { id: 'api-oauth-token', label: 'POST /issue-oauth-token', method: 'POST', path: '/api/developer/server/issue-oauth-token' },
        { id: 'api-dispatch-msg', label: 'POST /dispatch-message', method: 'POST', path: '/api/developer/server/dispatch-message' },
        { id: 'api-rtc-token', label: 'POST /generate-rtc-token', method: 'POST', path: '/api/developer/server/generate-rtc-token' },
        { id: 'api-webhook-verify', label: 'POST /verify-webhook', method: 'POST', path: '/api/developer/server/verify-webhook' },
      ],
    },
    {
      title: 'SDKs',
      icon: Code,
      items: [
        { id: 'sdk-js', label: 'JavaScript' },
        { id: 'sdk-ts', label: 'TypeScript' },
        { id: 'sdk-android', label: 'Android (Kotlin)' },
        { id: 'sdk-rest', label: 'REST API' },
      ],
    },
    {
      title: 'Webhooks',
      icon: Webhook,
      items: [
        { id: 'webhook-overview', label: 'Overview' },
        { id: 'webhook-events', label: 'Supported Events' },
        { id: 'webhook-signatures', label: 'HMAC SHA-256 Signatures' },
        { id: 'webhook-retry', label: 'Retry & Delivery Policy' },
      ],
    },
    {
      title: 'Resources',
      icon: FileText,
      items: [
        { id: 'res-errors', label: 'Error Codes' },
        { id: 'res-rate-limits', label: 'Rate Limits' },
        { id: 'res-pagination', label: 'Pagination' },
        { id: 'res-versioning', label: 'Versioning' },
        { id: 'res-changelog', label: 'Changelog' },
        { id: 'res-support', label: 'Support & SLAs' },
      ],
    },
  ];

  const methodBadge = (method?: string) => {
    if (!method) return null;
    const colors = {
      GET: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      POST: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      PUT: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      PATCH: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      DELETE: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    };
    return (
      <span className={`px-1.5 py-0.5 text-[9px] font-mono font-black border rounded ${colors[method as keyof typeof colors] || ''}`}>
        {method}
      </span>
    );
  };

  const renderContent = () => {
    switch (activeItem) {
      case 'intro':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
                PRIGID GROUP VIBEZ Platform v3.0
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">Introduction</h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                Welcome to the official API & Platform Reference for VIBEZ. VIBEZ provides real-time messaging, WebRTC call signaling, OAuth2 client token generation, and HMAC-signed webhook event dispatching.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">High-Speed Signaling</h3>
                <p className="text-xs text-slate-400">Sub-30ms global dispatch powered by edge cluster routing.</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Protected Credentials</h3>
                <p className="text-xs text-slate-400">Master API Keys, Bearer tokens, and HMAC SHA-256 signatures.</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Cross-Platform SDKs</h3>
                <p className="text-xs text-slate-400">Native Android Kotlin, Node.js, TypeScript, and Python SDKs.</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Live Production Endpoint Host</h3>
              <p className="text-xs text-slate-400">All API endpoints are served securely from the production edge gateway:</p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 flex items-center justify-between">
                <span>https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app</span>
                <button
                  onClick={() => copyText('https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app', 'base-url')}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  {copiedSection === 'base-url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        );

      case 'get-started':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-white tracking-tight">Get Started</h1>
              <p className="text-slate-400 text-sm">
                Follow this guide to issue Master API credentials and invoke system endpoints in under 2 minutes.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs">
                  <span>STEP 1</span>
                </div>
                <h3 className="text-sm font-bold text-white">Issue Primary API Key</h3>
                <p className="text-xs text-slate-400">
                  Access your protected <a href="/keys" className="text-emerald-400 underline font-bold">API Sandbox & Master Keys</a> in the Developer Dashboard and copy your key string.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs">
                  <span>STEP 2</span>
                </div>
                <h3 className="text-sm font-bold text-white">Construct HTTP Request Headers</h3>
                <CodeBlock
                  code={`Content-Type: application/json\nX-API-Key: vbz_live_kt_8f901ab38127498cbe0094b2`}
                  language="http"
                  title="Required Request Headers"
                />
              </div>

              <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs">
                  <span>STEP 3</span>
                </div>
                <h3 className="text-sm font-bold text-white">Execute System Health Check</h3>
                <CodeBlock
                  code={`curl -X GET "https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app/api/developer/server/health-check" \\
  -H "X-API-Key: vbz_live_kt_8f901ab38127498cbe0094b2"`}
                  language="bash"
                  title="cURL Terminal Execution"
                />
              </div>
            </div>
          </div>
        );

      case 'architecture':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white tracking-tight">System Architecture</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              The VIBEZ platform architecture is built around a distributed server cluster providing instant message routing, OAuth authentication, WebRTC signaling, and webhook delivery.
            </p>
            <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-4">
              <h3 className="text-sm font-black uppercase text-white font-mono">Platform Infrastructure Tiers</h3>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <div>
                    <strong className="text-white">Edge Gateway:</strong> Accepts incoming API calls, validates <code className="text-emerald-400 font-mono">X-API-Key</code> headers, and routes traffic.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <div>
                    <strong className="text-white">OAuth Auth Core:</strong> Issues JWT client credentials for SDK authorization.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <div>
                    <strong className="text-white">Signaling Engine:</strong> Generates WebRTC channels and RTC tokens for audio/video calls.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        );

      case 'api-status':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white tracking-tight">API Operational Status</h1>
            <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <div className="text-sm font-bold text-white">All System Endpoints Operational</div>
                  <div className="text-xs text-emerald-400 font-mono">Uptime: 99.99% • Health Checks: Passing</div>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400">PRIGID Cloud Edge</span>
            </div>
          </div>
        );

      // Guides
      case 'guide-auth':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white tracking-tight">Guide: Authentication & Tokens</h1>
            <p className="text-slate-400 text-sm">
              All system endpoints require authentication using the <code className="text-emerald-400 font-mono">X-API-Key</code> header or OAuth2 Bearer tokens.
            </p>
            <CodeBlock
              code={`// Option A: API Key Header\nX-API-Key: vbz_live_kt_8f901ab38127498cbe0094b2\n\n// Option B: Bearer OAuth Token\nAuthorization: Bearer eyJhbGciOiJIUzI1NiIs...`}
              language="http"
              title="HTTP Header Specifications"
            />
          </div>
        );

      case 'guide-messaging':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white tracking-tight">Guide: Real-time Messaging</h1>
            <p className="text-slate-400 text-sm">
              Send high-speed messages between users and status updates using the <code className="text-emerald-400 font-mono">/dispatch-message</code> endpoint.
            </p>
          </div>
        );

      case 'guide-webrtc':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white tracking-tight">Guide: Voice & Video Calling</h1>
            <p className="text-slate-400 text-sm">
              Generate WebRTC RTC channel tokens for peer-to-peer voice/video sessions using the <code className="text-emerald-400 font-mono">/generate-rtc-token</code> endpoint.
            </p>
          </div>
        );

      case 'guide-webhooks':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white tracking-tight">Guide: Webhooks & HMAC Signatures</h1>
            <p className="text-slate-400 text-sm">
              Verify incoming webhook payloads using HMAC SHA-256 signatures via <code className="text-emerald-400 font-mono">/verify-webhook</code>.
            </p>
          </div>
        );

      // API Reference Endpoints
      case 'api-health':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-mono font-black">GET</span>
              <h1 className="text-xl font-mono font-bold text-white">/api/developer/server/health-check</h1>
            </div>
            <p className="text-xs text-slate-400">System health check and node status endpoint.</p>
            <CodeBlock
              code={`curl -X GET "https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app/api/developer/server/health-check" \\
  -H "X-API-Key: vbz_live_kt_8f901ab38127498cbe0094b2"`}
              language="bash"
              title="cURL Request"
            />
            <div className="space-y-1">
              <span className="text-xs font-mono text-slate-400 uppercase font-bold">200 OK Response Payload</span>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-auto">
{JSON.stringify({
  status: "OK",
  timestamp: "2026-08-28T12:00:00.000Z",
  serverNode: "v3.0.0-emerald",
  databaseStatus: "CONNECTED",
  latencyMs: 12,
  environment: "production"
}, null, 2)}
              </pre>
            </div>
          </div>
        );

      case 'api-status-cluster':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-mono font-black">GET</span>
              <h1 className="text-xl font-mono font-bold text-white">/api/developer/server/custom-server-status</h1>
            </div>
            <p className="text-xs text-slate-400">Detailed infrastructure telemetry, database cluster health, and maintenance status.</p>
            <CodeBlock
              code={`curl -X GET "https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app/api/developer/server/custom-server-status" \\
  -H "X-API-Key: vbz_live_kt_8f901ab38127498cbe0094b2"`}
              language="bash"
              title="cURL Request"
            />
            <div className="space-y-1">
              <span className="text-xs font-mono text-slate-400 uppercase font-bold">200 OK Response Payload</span>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-auto">
{JSON.stringify({
  status: "OPERATIONAL",
  maintenanceMode: false,
  allowNewRegistrations: true,
  node: "v3.0-emerald",
  clusters: {
    redisCache: "HEALTHY",
    spannerDb: "HEALTHY",
    webrtcSignaling: "ONLINE"
  },
  poweredBy: "PRIGID GROUP Global Infrastructure"
}, null, 2)}
              </pre>
            </div>
          </div>
        );

      case 'api-oauth-token':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-black">POST</span>
              <h1 className="text-xl font-mono font-bold text-white">/api/developer/server/issue-oauth-token</h1>
            </div>
            <p className="text-xs text-slate-400">Issue OAuth2 Bearer access token for client applications.</p>
            <CodeBlock
              code={`curl -X POST "https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app/api/developer/server/issue-oauth-token" \\
  -H "X-API-Key: vbz_live_kt_8f901ab38127498cbe0094b2" \\
  -H "Content-Type: application/json" \\
  -d '{"clientId": "clt_live_991823", "grantType": "client_credentials"}'`}
              language="bash"
              title="cURL Request"
            />
            <div className="space-y-1">
              <span className="text-xs font-mono text-slate-400 uppercase font-bold">200 OK Response Payload</span>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-auto">
{JSON.stringify({
  success: true,
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  tokenType: "Bearer",
  expiresInSeconds: 3600,
  issuedAt: "2026-08-28T12:00:00.000Z"
}, null, 2)}
              </pre>
            </div>
          </div>
        );

      case 'api-dispatch-msg':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-black">POST</span>
              <h1 className="text-xl font-mono font-bold text-white">/api/developer/server/dispatch-message</h1>
            </div>
            <p className="text-xs text-slate-400">Dispatch real-time messages and status updates to target users.</p>
            <CodeBlock
              code={`curl -X POST "https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app/api/developer/server/dispatch-message" \\
  -H "X-API-Key: vbz_live_kt_8f901ab38127498cbe0094b2" \\
  -H "Content-Type: application/json" \\
  -d '{"recipientId": "usr_alex_rivera", "content": "Welcome to VIBEZ!"}'`}
              language="bash"
              title="cURL Request"
            />
            <div className="space-y-1">
              <span className="text-xs font-mono text-slate-400 uppercase font-bold">200 OK Response Payload</span>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-auto">
{JSON.stringify({
  success: true,
  messageId: "msg_live_7721893",
  recipientId: "usr_alex_rivera",
  deliveryStatus: "SENT",
  dispatchedAt: "2026-08-28T12:00:00.000Z"
}, null, 2)}
              </pre>
            </div>
          </div>
        );

      case 'api-rtc-token':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-black">POST</span>
              <h1 className="text-xl font-mono font-bold text-white">/api/developer/server/generate-rtc-token</h1>
            </div>
            <p className="text-xs text-slate-400">Generate WebRTC RTC channel tokens for peer voice and video calling.</p>
            <CodeBlock
              code={`curl -X POST "https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app/api/developer/server/generate-rtc-token" \\
  -H "X-API-Key: vbz_live_kt_8f901ab38127498cbe0094b2" \\
  -H "Content-Type: application/json" \\
  -d '{"channelName": "room_voice_101", "uid": 109238}'`}
              language="bash"
              title="cURL Request"
            />
            <div className="space-y-1">
              <span className="text-xs font-mono text-slate-400 uppercase font-bold">200 OK Response Payload</span>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-auto">
{JSON.stringify({
  success: true,
  channelName: "room_voice_101",
  rtcToken: "0068f901ab38127498cbe0094b2...",
  expiresAt: "2026-08-28T13:00:00.000Z"
}, null, 2)}
              </pre>
            </div>
          </div>
        );

      case 'api-webhook-verify':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-black">POST</span>
              <h1 className="text-xl font-mono font-bold text-white">/api/developer/server/verify-webhook</h1>
            </div>
            <p className="text-xs text-slate-400">Verify incoming webhook event payloads against HMAC SHA-256 signatures.</p>
            <CodeBlock
              code={`curl -X POST "https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app/api/developer/server/verify-webhook" \\
  -H "X-API-Key: vbz_live_kt_8f901ab38127498cbe0094b2" \\
  -H "Content-Type: application/json" \\
  -d '{"payload": {"event": "user.registered"}, "signature": "sha256=mock"}'`}
              language="bash"
              title="cURL Request"
            />
            <div className="space-y-1">
              <span className="text-xs font-mono text-slate-400 uppercase font-bold">200 OK Response Payload</span>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-auto">
{JSON.stringify({
  valid: true,
  signatureMatched: true,
  verifiedAt: "2026-08-28T12:00:00.000Z"
}, null, 2)}
              </pre>
            </div>
          </div>
        );

      // SDKs
      case 'sdk-js':
      case 'sdk-ts':
      case 'sdk-android':
      case 'sdk-rest':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white tracking-tight">
              SDK: {activeItem.replace('sdk-', '').toUpperCase()}
            </h1>
            <p className="text-slate-400 text-sm">
              Official SDK integration package for {activeItem.replace('sdk-', '')}.
            </p>
            <CodeBlock
              code={
                activeItem === 'sdk-android'
                  ? `dependencies {\n    implementation("com.vibez.sdk:android:v3.0.0")\n}`
                  : `npm install @vibez/client-sdk`
              }
              language={activeItem === 'sdk-android' ? 'kotlin' : 'bash'}
              title="Installation Command"
            />
          </div>
        );

      // Webhooks
      case 'webhook-overview':
      case 'webhook-events':
      case 'webhook-signatures':
      case 'webhook-retry':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white tracking-tight capitalize">
              Webhooks: {activeItem.replace('webhook-', '')}
            </h1>
            <p className="text-slate-400 text-sm">
              Real-time HTTP event callbacks dispatched to registered developer endpoints with HMAC signatures.
            </p>
            <CodeBlock
              code={`X-Vibez-Signature: sha256=a89102c984fe...\nX-Vibez-Event: message.created`}
              language="http"
              title="Webhook Callback Header"
            />
          </div>
        );

      // Resources
      case 'res-errors':
      case 'res-rate-limits':
      case 'res-pagination':
      case 'res-versioning':
      case 'res-changelog':
      case 'res-support':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white tracking-tight capitalize">
              Resource: {activeItem.replace('res-', '').replace('-', ' ')}
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Technical details regarding {activeItem.replace('res-', '').replace('-', ' ')} across all VIBEZ API tiers.
            </p>
            <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
              <div><strong className="text-emerald-400">Rate Limits:</strong> 10,000 requests/min per Primary Master Key.</div>
              <div><strong className="text-emerald-400">Pagination:</strong> Cursor-based pagination.</div>
              <div><strong className="text-emerald-400">Versioning:</strong> ISO date-based API contracts.</div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-white">Documentation Section</h1>
            <p className="text-xs text-slate-400">Select a section from the left navigation tree.</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Search Bar & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold mb-2">
            OpenAPI 3.0 Reference Documentation
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">System Endpoints & Platform Documentation</h1>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search API reference..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Grid: Sidebar Tree + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
        {/* Left Sidebar Navigation Tree */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-4 sticky top-24">
            <div className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">
              Documentation Tree
            </div>

            <nav className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {navStructure.map((cat) => {
                const Icon = cat.icon;
                const isCollapsed = Boolean(collapsedCategories[cat.title]);
                const filteredItems = cat.items.filter((item) =>
                  item.label.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (searchQuery && filteredItems.length === 0) return null;

                return (
                  <div key={cat.title} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat.title)}
                      className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-900 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{cat.title}</span>
                      </div>
                      {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                    </button>

                    {!isCollapsed && (
                      <div className="pl-5 space-y-1 border-l border-slate-800/80 ml-3">
                        {filteredItems.map((item) => {
                          const isActive = activeItem === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectDoc(item.id)}
                              className={`w-full flex items-center justify-between p-1.5 rounded-md text-[11px] font-mono transition-all text-left ${
                                isActive
                                  ? 'bg-emerald-500/10 text-emerald-400 font-bold border-l-2 border-emerald-500 pl-2'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                              }`}
                            >
                              <span className="truncate">{item.label}</span>
                              {methodBadge(item.method)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Right Main Content Area */}
        <div className="lg:col-span-9">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#070b14] border border-slate-800 shadow-2xl min-h-[600px]">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DocsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading documentation...</span>
        </div>
      </div>
    }>
      <DocsContent />
    </Suspense>
  );
}
