'use client';

import React, { useState } from 'react';
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

export default function DocsPage() {
  const [activeItem, setActiveItem] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

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
        { id: 'guide-auth', label: 'Authentication' },
        { id: 'guide-users', label: 'Users' },
        { id: 'guide-media', label: 'Media & Uploads' },
        { id: 'guide-messaging', label: 'Messaging' },
        { id: 'guide-notifications', label: 'Notifications' },
        { id: 'guide-subscriptions', label: 'Subscriptions' },
        { id: 'guide-payments', label: 'Payments' },
        { id: 'guide-webhooks', label: 'Webhooks' },
      ],
    },
    {
      title: 'API Reference',
      icon: Terminal,
      items: [
        { id: 'api-health', label: 'GET /health', method: 'GET', path: '/health' },
        { id: 'api-sys-status', label: 'GET /api/system/status', method: 'GET', path: '/api/system/status' },
        { id: 'api-auth-reg', label: 'POST /api/auth/register', method: 'POST', path: '/api/auth/register' },
        { id: 'api-auth-login', label: 'POST /api/auth/login', method: 'POST', path: '/api/auth/login' },
        { id: 'api-auth-logout', label: 'POST /api/auth/logout', method: 'POST', path: '/api/auth/logout' },
        { id: 'api-users', label: 'Users API', method: 'GET', path: '/api/users' },
        { id: 'api-profiles', label: 'Profiles API', method: 'GET', path: '/api/profiles' },
        { id: 'api-posts', label: 'Posts API', method: 'POST', path: '/api/posts' },
        { id: 'api-comments', label: 'Comments API', method: 'POST', path: '/api/comments' },
        { id: 'api-likes', label: 'Likes API', method: 'POST', path: '/api/likes' },
        { id: 'api-follows', label: 'Follows API', method: 'POST', path: '/api/follows' },
        { id: 'api-messaging', label: 'Messaging API', method: 'POST', path: '/api/messages' },
        { id: 'api-notifications', label: 'Notifications API', method: 'GET', path: '/api/notifications' },
        { id: 'api-media', label: 'Media API', method: 'POST', path: '/api/media/upload' },
        { id: 'api-subscriptions', label: 'Subscriptions API', method: 'GET', path: '/api/subscriptions' },
        { id: 'api-payments', label: 'Payments API', method: 'POST', path: '/api/payments/checkout' },
        { id: 'api-admin', label: 'Admin Telemetry', method: 'GET', path: '/api/admin/telemetry' },
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
        { id: 'webhook-events', label: 'Events' },
        { id: 'webhook-signatures', label: 'Signatures' },
        { id: 'webhook-retry', label: 'Retry Policy' },
      ],
    },
    {
      title: 'Resources',
      icon: FileText,
      items: [
        { id: 'res-errors', label: 'Errors' },
        { id: 'res-rate-limits', label: 'Rate Limits' },
        { id: 'res-pagination', label: 'Pagination' },
        { id: 'res-versioning', label: 'Versioning' },
        { id: 'res-changelog', label: 'Changelog' },
        { id: 'res-support', label: 'Support' },
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
                PRIGID GROUP Platform v3.0
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">Introduction</h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                Welcome to the official developer documentation for the VIBEZ Platform API. VIBEZ provides high-performance, real-time backend infrastructure for messaging, user identities, status broadcasts, webhooks, and monetization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Ultra-Low Latency</h3>
                <p className="text-xs text-slate-400">Sub-30ms global routing powered by Spanner & Redis edge cache.</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Zero-Trust Auth</h3>
                <p className="text-xs text-slate-400">HMAC SHA-256 signatures, JWT bearer tokens, and Master API Keys.</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Cross-SDK Sync</h3>
                <p className="text-xs text-slate-400">First-class support for Android Kotlin, TypeScript, Node.js, and Python.</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Base Endpoint Host</h3>
              <p className="text-xs text-slate-400">All requests should target the edge production gateway:</p>
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
                Follow this quick 3-step guide to issue API credentials and send your first request in under 2 minutes.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs">
                  <span>STEP 1</span>
                </div>
                <h3 className="text-sm font-bold text-white">Generate Master API Key</h3>
                <p className="text-xs text-slate-400">
                  Navigate to your protected <a href="/keys" className="text-emerald-400 underline font-bold">API Sandbox Keys</a> panel in the Dashboard and issue a new key token starting with <code className="text-emerald-300">vbz_live_...</code>.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs">
                  <span>STEP 2</span>
                </div>
                <h3 className="text-sm font-bold text-white">Set HTTP Request Headers</h3>
                <p className="text-xs text-slate-400">Include your master key in the request headers:</p>
                <CodeBlock
                  code={`Content-Type: application/json\nX-API-Key: vbz_live_kt_8f901ab38127498cbe0094b2`}
                  language="http"
                  title="Request Headers"
                />
              </div>

              <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs">
                  <span>STEP 3</span>
                </div>
                <h3 className="text-sm font-bold text-white">Test Health Ping</h3>
                <CodeBlock
                  code={`curl -X GET "https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app/api/developer/server/health-check" \\
  -H "X-API-Key: vbz_live_kt_8f901ab38127498cbe0094b2"`}
                  language="bash"
                  title="cURL Terminal Command"
                />
              </div>
            </div>
          </div>
        );

      case 'architecture':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white tracking-tight">Architecture</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              VIBEZ is built on a distributed microservices mesh operating in Google Cloud Platform with multi-region failover.
            </p>
            <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-4">
              <h3 className="text-sm font-black uppercase text-white font-mono">Infrastructure Components</h3>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <div>
                    <strong className="text-white">Signaling & Edge Layer:</strong> Envoy proxy cluster terminating TLS 1.3 and dispatching requests directly to regional containers.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <div>
                    <strong className="text-white">Data Persistence:</strong> Cloud Spanner for ACID transactions paired with Redis Enterprise for sub-millisecond status fanouts.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <div>
                    <strong className="text-white">Real-Time Messaging:</strong> WebSockets with automatic fallback to gRPC bidirectional streams.
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
                  <div className="text-sm font-bold text-white">All Systems Operational</div>
                  <div className="text-xs text-emerald-400 font-mono">Global Uptime: 99.99% • Regional Nodes: Healthy</div>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400">Node: v3.0-prod</span>
            </div>
          </div>
        );

      // Guides
      case 'guide-auth':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white tracking-tight">Guide: Authentication</h1>
            <p className="text-slate-400 text-sm">
              All REST API calls require an API key passed via header or an OAuth2 bearer token.
            </p>
            <CodeBlock
              code={`// Example Auth Header\nAuthorization: Bearer <YOUR_JWT_OR_OAUTH_TOKEN>\nX-API-Key: <YOUR_PRIMARY_API_KEY>`}
              language="http"
              title="HTTP Header Specifications"
            />
          </div>
        );

      case 'guide-users':
      case 'guide-media':
      case 'guide-messaging':
      case 'guide-notifications':
      case 'guide-subscriptions':
      case 'guide-payments':
      case 'guide-webhooks':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white tracking-tight capitalize">
              Guide: {activeItem.replace('guide-', '').replace('-', ' ')}
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Learn how to implement {activeItem.replace('guide-', '')} workflows using VIBEZ platform APIs and client SDKs.
            </p>
            <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="font-bold text-white">Key Integration Workflow:</p>
              <p>1. Initialize client using Master API Key.</p>
              <p>2. Execute request payload through edge routing.</p>
              <p>3. Handle response status codes and verify HMAC signatures on callback handlers.</p>
            </div>
          </div>
        );

      // API Reference Endpoints
      case 'api-health':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-mono font-black">GET</span>
              <h1 className="text-2xl font-mono font-bold text-white">/health</h1>
            </div>
            <p className="text-xs text-slate-400">Basic HTTP health check endpoint for load balancers and container monitors.</p>
            <CodeBlock
              code={`curl -X GET "https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app/health"`}
              language="bash"
              title="cURL Command"
            />
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300">
              {JSON.stringify({ status: "healthy", timestamp: new Date().toISOString() }, null, 2)}
            </div>
          </div>
        );

      case 'api-sys-status':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-mono font-black">GET</span>
              <h1 className="text-2xl font-mono font-bold text-white">/api/system/status</h1>
            </div>
            <p className="text-xs text-slate-400">Detailed system operational telemetry and maintenance window status.</p>
            <CodeBlock
              code={`curl -X GET "https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app/api/system/status"`}
              language="bash"
              title="cURL Command"
            />
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300">
              {JSON.stringify({
                status: "OPERATIONAL",
                maintenanceMode: false,
                allowNewRegistrations: true,
                node: "v3.0-emerald",
                poweredBy: "PRIGID GROUP Global Infrastructure"
              }, null, 2)}
            </div>
          </div>
        );

      case 'api-auth-reg':
      case 'api-auth-login':
      case 'api-auth-logout':
      case 'api-users':
      case 'api-profiles':
      case 'api-posts':
      case 'api-comments':
      case 'api-likes':
      case 'api-follows':
      case 'api-messaging':
      case 'api-notifications':
      case 'api-media':
      case 'api-subscriptions':
      case 'api-payments':
      case 'api-admin':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-mono font-bold text-white">
              {activeItem.toUpperCase().replace('API-', 'API / ').replace('-', ' ')}
            </h1>
            <p className="text-xs text-slate-400">Production REST Endpoint Specification.</p>
            <CodeBlock
              code={`// Example Request\nPOST /api/... HTTP/1.1\nHost: vibez.api.com\nContent-Type: application/json\nX-API-Key: vbz_live_kt_8f901ab38127498cbe0094b2`}
              language="http"
              title="Endpoint Specification"
            />
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
              Official client library and integration package for {activeItem.replace('sdk-', '')}.
            </p>
            <CodeBlock
              code={
                activeItem === 'sdk-android'
                  ? `dependencies {\n    implementation("com.vibez.sdk:android:v3.0.0")\n}`
                  : `npm install @vibez/client-sdk`
              }
              language={activeItem === 'sdk-android' ? 'kotlin' : 'bash'}
              title="Installation Package"
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
              Real-time HTTP event callbacks dispatched to registered developer endpoints.
            </p>
            <CodeBlock
              code={`// Sample Webhook Header\nX-Vibez-Signature: sha256=a89102c984fe...\nX-Vibez-Event: message.created`}
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
              <div><strong className="text-emerald-400">Pagination:</strong> Cursor-based (<code className="text-slate-200">?cursor=...&limit=20</code>).</div>
              <div><strong className="text-emerald-400">Versioning:</strong> ISO header-based contract guarantees.</div>
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
            OpenAPI 3.0 Documentation Hub
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">API & Platform Reference</h1>
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
                              onClick={() => setActiveItem(item.id)}
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
