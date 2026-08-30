'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Lock,
  Activity,
  Cpu,
  RefreshCw,
  Clock,
  CheckSquare,
  LayoutDashboard,
  KeyRound,
  Sparkles,
  Building,
  LogOut,
  Menu,
  X,
  User,
  ShieldCheck
} from 'lucide-react';
import { useDeveloperAuth } from '../../context/DeveloperAuthContext';
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
  const { user, login, logout, isLoading: authLoading } = useDeveloperAuth();
  const searchParams = useSearchParams();
  const [activeItem, setActiveItem] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Overview & Metrics': true,
    'Access & Security': true,
    'Developer Tools & AI': true,
    'Account & Preferences': true,
    'Platform Resources': true,
  });

  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const mainNavItems = [
    {
      group: 'Overview & Metrics',
      items: [
        { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
        { id: 'logs', label: 'Traffic Inspector', icon: Terminal },
        { id: 'quotas', label: 'Rate Limits & Quota', icon: Gauge },
      ],
    },
    {
      group: 'Access & Security',
      items: [
        { id: 'keys', label: 'API Sandbox & Master Keys', icon: Key },
        { id: 'oauth', label: 'OAuth2 Client Apps', icon: KeyRound },
        { id: 'team', label: 'Team Members', icon: Users },
      ],
    },
    {
      group: 'Developer Tools & AI',
      items: [
        { id: 'explorer', label: 'API Sandbox Explorer', icon: Play },
        { id: 'replay', label: 'Webhooks & Event Streams', icon: Webhook },
        { id: 'ai_schema', label: 'AI Schema & Mocks', icon: Sparkles },
      ],
    },
    {
      group: 'Account & Preferences',
      items: [
        { id: 'profile', label: 'Developer Profile', icon: User },
        { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
        { id: 'settings', label: 'Console Settings', icon: Settings },
      ],
    },
  ];

  const externalLinks = [
    { href: '/docs', label: 'API Documentation', icon: BookOpen },
    { href: '/sdks', label: 'SDK Packages', icon: Code },
  ];

  const navStructure: NavCategory[] = [
    {
      title: 'Overview',
      icon: BookOpen,
      items: [
        { id: 'intro', label: 'Introduction' },
        { id: 'get-started', label: 'Get Started' },
        { id: 'architecture', label: 'System Architecture' },
        { id: 'api-status', label: 'API Status & Uptime' },
      ],
    },
    {
      title: 'Core Guides',
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
      title: 'SDK Toolkits',
      icon: Code,
      items: [
        { id: 'sdk-js', label: 'JavaScript Client' },
        { id: 'sdk-ts', label: 'TypeScript / Node' },
        { id: 'sdk-android', label: 'Android (Kotlin)' },
        { id: 'sdk-rest', label: 'REST Raw API' },
      ],
    },
    {
      title: 'Webhook Callbacks',
      icon: Webhook,
      items: [
        { id: 'webhook-overview', label: 'Webhooks Overview' },
        { id: 'webhook-events', label: 'Supported Events' },
        { id: 'webhook-signatures', label: 'HMAC SHA-256 Signatures' },
        { id: 'webhook-retry', label: 'Retry & Delivery Policy' },
      ],
    },
    {
      title: 'API Resources',
      icon: FileText,
      items: [
        { id: 'res-errors', label: 'Error Codes' },
        { id: 'res-rate-limits', label: 'Rate Limits & Quota' },
        { id: 'res-pagination', label: 'Cursor Pagination' },
        { id: 'res-versioning', label: 'API Versioning' },
        { id: 'res-changelog', label: 'Changelog History' },
        { id: 'res-support', label: 'Developer Support SLAs' },
      ],
    },
  ];

  // Flattened navigation for next and previous button logic
  const flatNavItems = navStructure.flatMap(cat => cat.items.map(item => ({
    ...item,
    categoryTitle: cat.title
  })));

  const currentIndex = flatNavItems.findIndex(item => item.id === activeItem);
  const prevItem = currentIndex > 0 ? flatNavItems[currentIndex - 1] : null;
  const nextItem = currentIndex < flatNavItems.length - 1 ? flatNavItems[currentIndex + 1] : null;

  // Restore active section
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Common prerequisite card
  const Prerequisites = ({ requirements }: { requirements: string[] }) => (
    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 my-6 space-y-2">
      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
        <Lock className="w-3.5 h-3.5" />
        <span>Prerequisites for this section</span>
      </div>
      <ul className="space-y-1.5 pl-5 list-disc text-xs text-slate-300 leading-relaxed">
        {requirements.map((req, i) => (
          <li key={i}>{req}</li>
        ))}
      </ul>
    </div>
  );

  const renderContent = () => {
    switch (activeItem) {
      case 'intro':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
                VIBEZ Platform v3.0 Documentation
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">Introduction</h1>
              <p className="text-slate-300 text-sm leading-relaxed">
                Welcome to the VIBEZ developer reference portal. Our API suite is designed with standard, robust mechanics modeled closely after standard payment processing networks like Paystack and Flutterwave, offering consistent response objects, clear authentication schemas, and fast Webhook deliveries.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Edge Gateway API Host</h3>
              <p className="text-xs text-slate-400">All live transactions and calls are dispatched to the official secure sandbox server:</p>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 flex items-center justify-between">
                <span>https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app</span>
                <button
                  type="button"
                  onClick={() => copyText('https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app', 'base-url')}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  {copiedSection === 'base-url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Fast Execution</h3>
                <p className="text-xs text-slate-400">Highly optimized API routes and message streams operating under low network latency.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">HMAC Verification</h3>
                <p className="text-xs text-slate-400">HMAC SHA-256 signatures dispatched with each Webhook event payload for security verification.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
                <Code className="w-5 h-5 text-purple-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Unified SDKs</h3>
                <p className="text-xs text-slate-400">Native Android Kotlin modules and JavaScript/Node SDKs optimized for client integration.</p>
              </div>
            </div>
          </div>
        );

      case 'get-started':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-white tracking-tight">Get Started</h1>
              <p className="text-slate-300 text-sm">
                Follow this quickstart guide to register, obtain API credentials, and query your first endpoint in under two minutes.
              </p>
            </div>

            <Prerequisites requirements={[
              'Register an active developer account under the VIBEZ portal.',
              'Ensure you have an active Master API Key issued from your keys dashboard.',
              'Configure the REST client tool of your choice (e.g., cURL, Postman).'
            ]} />

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs uppercase">
                  <span>Step 1: Obtain your live api key</span>
                </div>
                <p className="text-xs text-slate-400">
                  Head over to the <a href="/keys" className="text-emerald-400 underline font-bold">API Keys Sandbox</a>. Click on "Create Live Key", select the scopes your application needs, and securely copy the generated key.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs uppercase">
                  <span>Step 2: Construct request headers</span>
                </div>
                <p className="text-xs text-slate-400">
                  All requests directed to our system cluster must include your Master Key within the request header block:
                </p>
                <CodeBlock
                  code={`Content-Type: application/json\nX-API-Key: vbz_live_kt_8f901ab38127498cbe0094b2`}
                  language="http"
                  title="Required Request Headers"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs uppercase">
                  <span>Step 3: Execute health check</span>
                </div>
                <p className="text-xs text-slate-400">
                  Execute the following request to verify that your key is properly authenticated on our edge routes:
                </p>
                <CodeBlock
                  code={`curl -X GET "https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app/api/developer/server/health-check" \\\n  -H "X-API-Key: YOUR_API_KEY_HERE"`}
                  language="bash"
                  title="Run cURL command"
                />
              </div>
            </div>
          </div>
        );

      case 'architecture':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white tracking-tight">System Architecture</h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              The VIBEZ platform routes live traffic through our edge gateway nodes. The network structure is divided into discrete service tiers to ensure fault tolerance and horizontal scalability.
            </p>

            <div className="p-5 rounded-2xl bg-[#050811] border border-slate-800 space-y-4">
              <h3 className="text-xs font-black uppercase text-white font-mono tracking-wider flex items-center gap-2 text-emerald-400">
                <Cpu className="w-4 h-4" />
                <span>Distributed Network Architecture</span>
              </h3>
              
              <div className="space-y-4 text-xs text-slate-300">
                <div className="p-3.5 rounded-lg bg-slate-900/30 border border-slate-800/60">
                  <strong className="text-white">1. Edge Gateway Routing Layer</strong>
                  <p className="text-slate-400 mt-1">Accepts inbound client interactions, validates security headers and rate limits, and routes to respective backend clusters.</p>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-900/30 border border-slate-800/60">
                  <strong className="text-white">2. Token & Session Core</strong>
                  <p className="text-slate-400 mt-1">Manages JWT keys, temporary authorization state, and handles API sandbox scope validations.</p>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-900/30 border border-slate-800/60">
                  <strong className="text-white">3. Signaling Server Nodes</strong>
                  <p className="text-slate-400 mt-1">Generates dynamic Agora-compatible Voice/Video RTC channel credentials for client interactions.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'api-status':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white tracking-tight">API Operational Status</h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              We maintain real-time telemetry checkpoints on all public APIs and core servers to verify full operational readiness.
            </p>

            <div className="p-5 rounded-xl bg-emerald-950/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <div className="text-sm font-bold text-white">All Gateway Services Operational</div>
                  <div className="text-xs text-emerald-400 font-mono">Gateway Uptime: 99.99% • Response Latency: &lt; 45ms</div>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded font-bold uppercase tracking-wider">Edge Live</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">REST Services</span>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Operational</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">WebRTC Signal Cluster</span>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Operational</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">Webhook Dispatcher</span>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Operational</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'guide-auth':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white tracking-tight">Authentication & Tokens</h1>
            <p className="text-slate-300 text-sm">
              All REST request resources directed to the VIBEZ API clusters require header validation tags or credentials. Let&apos;s look at our standardized authorization scheme:
            </p>

            <Prerequisites requirements={[
              'Valid and registered Client credentials generated within your dashboard settings.',
              'Active API keys assigned appropriate scopes.'
            ]} />

            <div className="space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">Authorization Methods</h3>
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
                <strong className="text-xs text-indigo-400 font-mono uppercase">Option A: Global API Keys (Direct Server Integration)</strong>
                <p className="text-xs text-slate-400">Pass your Master API credentials inside the request header block directly:</p>
                <CodeBlock
                  code={`X-API-Key: vbz_live_kt_8f901ab38127498cbe0094b2`}
                  language="http"
                  title="Direct Key Validation"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
                <strong className="text-xs text-purple-400 font-mono uppercase">Option B: Client Bearer OAuth Tokens</strong>
                <p className="text-xs text-slate-400">Utilize client tokens for ephemeral third-party authorization. This is passed inside the Authorization header:</p>
                <CodeBlock
                  code={`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
                  language="http"
                  title="OAuth Bearer Key Validation"
                />
              </div>
            </div>
          </div>
        );

      case 'guide-messaging':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white tracking-tight">Real-time Messaging Guide</h1>
            <p className="text-slate-300 text-sm">
              The Real-time messaging service allows seamless, instantaneous data delivery across channels and devices. We leverage server-to-client gateways and Webhooks to synchronize state.
            </p>

            <Prerequisites requirements={[
              'Valid Client ID and scoped access.',
              'A recipient user ID to accept the incoming message.',
              'Active websocket connection or callback webhook URL configured.'
            ]} />

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-white tracking-wider">Sending message via cURL</h3>
              <p className="text-xs text-slate-400">Trigger standard message dispatches via your private gateway:</p>
              <CodeBlock
                code={`curl -X POST "https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app/api/developer/server/dispatch-message" \\
  -H "X-API-Key: vbz_live_kt_8f901ab38127498cbe0094b2" \\
  -H "Content-Type: application/json" \\
  -d '{"recipientId": "usr_alex_rivera", "content": "Hello World from the API!"}'`}
                language="bash"
                title="Send Message Dispatch"
              />
            </div>
          </div>
        );

      case 'guide-webrtc':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white tracking-tight">Voice & Video Calling Guide</h1>
            <p className="text-slate-300 text-sm">
              Implement interactive P2P multimedia rooms. Our system generates temporal RTC credentials which authorize and initialize Agora-compatible call streams securely.
            </p>

            <Prerequisites requirements={[
              'RTC generator module scope active inside your Master API Key.',
              'A unique alphanumeric Room name for the connection session.'
            ]} />

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-white tracking-wider">Obtaining an RTC Session Token</h3>
              <p className="text-xs text-slate-400">Call the endpoint to generate token credentials dynamically on call initialization:</p>
              <CodeBlock
                code={`curl -X POST "https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app/api/developer/server/generate-rtc-token" \\
  -H "X-API-Key: vbz_live_kt_8f901ab38127498cbe0094b2" \\
  -H "Content-Type: application/json" \\
  -d '{"channelName": "support_channel_room", "uid": 880293}'`}
                language="bash"
                title="Generate RTC Token"
              />
            </div>
          </div>
        );

      case 'guide-webhooks':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white tracking-tight">Webhooks & HMAC Signatures</h1>
            <p className="text-slate-300 text-sm">
              We push transaction updates and user events straight to your specified webhook endpoint. To secure these callbacks, each payload carries a signature hash.
            </p>

            <Prerequisites requirements={[
              'An active, publicly reachable HTTP endpoint (supporting HTTPS).',
              'The webhook signing secret configured inside your dashboard settings.'
            ]} />

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-white tracking-wider">Validating HMAC signatures</h3>
              <p className="text-xs text-slate-400">
                A header attribute <code className="text-emerald-400 font-mono">X-Vibez-Signature</code> is attached to incoming payloads. To verify, run a SHA-256 HMAC algorithm on the raw JSON bytes with your secret:
              </p>
              <CodeBlock
                code={`const crypto = require('crypto');\nconst expectedSignature = crypto\n  .createHmac('sha256', SIGNING_SECRET)\n  .update(JSON.stringify(rawPayloadBody))\n  .digest('hex');`}
                language="javascript"
                title="Node.js HMAC Signature Verification"
              />
            </div>
          </div>
        );

      case 'api-health':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-mono font-black">GET</span>
              <h1 className="text-xl font-mono font-bold text-white">/api/developer/server/health-check</h1>
            </div>
            <p className="text-xs text-slate-400">System health check, diagnostics metrics, node status, and cluster routing check.</p>
            
            <Prerequisites requirements={['API Key passed within the headers.']} />

            <CodeBlock
              code={`curl -X GET "https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app/api/developer/server/health-check" \\
  -H "X-API-Key: YOUR_API_KEY_HERE"`}
              language="bash"
              title="Endpoint cURL request"
            />
            
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase font-bold">200 OK Response Payload</span>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-auto">
{JSON.stringify({
  status: "OK",
  timestamp: "2026-08-29T19:16:00.000Z",
  serverNode: "v3.0.0-emerald",
  databaseStatus: "CONNECTED",
  latencyMs: 14,
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
            <p className="text-xs text-slate-400">Detailed infrastructure telemetry, database cluster statuses, memory status, and current load.</p>

            <Prerequisites requirements={['API Key passed within the headers.']} />

            <CodeBlock
              code={`curl -X GET "https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app/api/developer/server/custom-server-status" \\
  -H "X-API-Key: YOUR_API_KEY_HERE"`}
              language="bash"
              title="Endpoint cURL request"
            />

            <div className="space-y-2">
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
            <p className="text-xs text-slate-400">Issue OAuth2 Bearer access tokens to authenticate client sessions.</p>

            <Prerequisites requirements={[
              'Master API Key headers verified.',
              'Active, non-revoked clientId identifier provided within JSON parameters.'
            ]} />

            <CodeBlock
              code={`curl -X POST "https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app/api/developer/server/issue-oauth-token" \\
  -H "X-API-Key: YOUR_API_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{"clientId": "clt_live_991823", "grantType": "client_credentials"}'`}
              language="bash"
              title="Endpoint cURL request"
            />

            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase font-bold">200 OK Response Payload</span>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-auto">
{JSON.stringify({
  success: true,
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  tokenType: "Bearer",
  expiresInSeconds: 3600,
  issuedAt: "2026-08-29T19:16:00.000Z"
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
            <p className="text-xs text-slate-400">Trigger instant message payloads and user alerts securely from third-party server systems.</p>

            <Prerequisites requirements={[
              'Valid and registered recipientId within database registry.',
              'Request payload string size strictly within 10,000 characters.'
            ]} />

            <CodeBlock
              code={`curl -X POST "https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app/api/developer/server/dispatch-message" \\
  -H "X-API-Key: YOUR_API_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{"recipientId": "usr_alex_rivera", "content": "Welcome to VIBEZ!"}'`}
              language="bash"
              title="Endpoint cURL request"
            />

            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase font-bold">200 OK Response Payload</span>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-auto">
{JSON.stringify({
  success: true,
  messageId: "msg_live_7721893",
  recipientId: "usr_alex_rivera",
  deliveryStatus: "SENT",
  dispatchedAt: "2026-08-29T19:16:00.000Z"
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
            <p className="text-xs text-slate-400">Secure Agora-compatible WebRTC channel token generation API.</p>

            <Prerequisites requirements={[
              'Agora app signaling permissions enabled on active profile credentials.',
              'Channel name passed as simple Alphanumeric string.'
            ]} />

            <CodeBlock
              code={`curl -X POST "https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app/api/developer/server/generate-rtc-token" \\
  -H "X-API-Key: YOUR_API_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{"channelName": "room_voice_101", "uid": 109238}'`}
              language="bash"
              title="Endpoint cURL request"
            />

            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase font-bold">200 OK Response Payload</span>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-auto">
{JSON.stringify({
  success: true,
  channelName: "room_voice_101",
  rtcToken: "0068f901ab38127498cbe0094b2...",
  expiresAt: "2026-08-29T20:16:00.000Z"
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
            <p className="text-xs text-slate-400">Verify validity and signatures of incoming webhook event payloads.</p>

            <Prerequisites requirements={['The raw JSON string body and payload signature.']} />

            <CodeBlock
              code={`curl -X POST "https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app/api/developer/server/verify-webhook" \\
  -H "X-API-Key: YOUR_API_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{"payload": {"event": "user.registered"}, "signature": "sha256=mock"}'`}
              language="bash"
              title="Endpoint cURL request"
            />

            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase font-bold">200 OK Response Payload</span>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-auto">
{JSON.stringify({
  valid: true,
  signatureMatched: true,
  verifiedAt: "2026-08-29T19:16:00.000Z"
}, null, 2)}
              </pre>
            </div>
          </div>
        );

      case 'sdk-js':
      case 'sdk-ts':
      case 'sdk-android':
      case 'sdk-rest':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white tracking-tight">
              SDK: {activeItem.replace('sdk-', '').toUpperCase()} Integration
            </h1>
            <p className="text-slate-300 text-sm">
              Incorporate VIBEZ system calls natively using the standardized {activeItem.replace('sdk-', '')} library toolkit.
            </p>

            <Prerequisites requirements={[
              'Latest compiler or package package manager utility (npm, yarn, gradle).',
              'Network permissions enabled in compile configuration.'
            ]} />

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-white tracking-wider">Installation</h3>
              <CodeBlock
                code={
                  activeItem === 'sdk-android'
                    ? `dependencies {\n    implementation("com.vibez.sdk:android:v3.0.0")\n}`
                    : `npm install @vibez/client-sdk`
                }
                language={activeItem === 'sdk-android' ? 'kotlin' : 'bash'}
                title="Install Package Command"
              />
            </div>
          </div>
        );

      case 'webhook-overview':
      case 'webhook-events':
      case 'webhook-signatures':
      case 'webhook-retry':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white tracking-tight capitalize">
              Webhooks: {activeItem.replace('webhook-', '')}
            </h1>
            <p className="text-slate-300 text-sm">
              Securely receive webhook transactions and real-time push event state updates directed back to your system endpoints.
            </p>

            <Prerequisites requirements={[
              'Webhook URL configured with secure HTTPS prefix.',
              'Secret signing hash mapped to application dashboard.'
            ]} />

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-white tracking-wider font-mono text-emerald-400">Webhook Header Spec</h3>
              <CodeBlock
                code={`X-Vibez-Signature: sha256=a89102c984fe...\nX-Vibez-Event: message.created`}
                language="http"
                title="Example Inbound Webhook Headers"
              />
            </div>
          </div>
        );

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
            <p className="text-slate-300 text-sm leading-relaxed">
              Technical specifics and governance policies representing {activeItem.replace('res-', '').replace('-', ' ')} across active environments.
            </p>

            <div className="p-5 rounded-2xl bg-[#050811] border border-slate-800 text-xs font-mono text-slate-300 space-y-4">
              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
                <strong className="text-white block mb-1">🔥 Current Policy Rate Limits:</strong>
                <span>10,000 requests/minute allocated per single Master Key.</span>
              </div>
              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
                <strong className="text-white block mb-1">📑 Pagination:</strong>
                <span>Alphanumeric cursor offset indexing standard across collections.</span>
              </div>
              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
                <strong className="text-white block mb-1">📅 Versioning Schema:</strong>
                <span>ISO format header identifiers (`X-Client-Version: 2026-08-29`).</span>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-white">Documentation Hub</h1>
            <p className="text-xs text-slate-400">Please choose a guide from the documentation navigation panel on the left.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col lg:flex-row">
      {/* Mobile Header Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#070b14] border-b border-slate-800 sticky top-0 z-50 w-full">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-slate-950">
            ⚡
          </div>
          <span className="font-black text-white text-base">VIBEZ CONSOLE</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 w-72 h-screen bg-[#070b14] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 shrink-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
          {/* Sidebar Top Header / Brand */}
          <div className="p-5 border-b border-slate-800/80 flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-all shrink-0">
                <div className="w-full h-full bg-[#050811] rounded-[10px] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base text-white tracking-tight">VIBEZ</span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    CONSOLE
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  Powered by <span className="text-emerald-400 font-bold">PRIGID GROUP</span>
                </span>
              </div>
            </Link>

            {/* Organization Selector Badge */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300 mt-1">
              <div className="flex items-center gap-2 min-w-0">
                <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate font-bold text-white">
                  {user?.organization || 'PRIGID Verified Developer'}
                </span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 shrink-0">
                {user?.role || 'Developer'}
              </span>
            </div>
          </div>

          {/* Navigation Links Group */}
          <div className="p-4 space-y-4 flex-1">
            {mainNavItems.map((group) => {
              const isOpen = openGroups[group.group] !== false;
              return (
                <div key={group.group} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.group)}
                    className="w-full px-3 py-2 flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider transition-all rounded-xl border text-slate-500 hover:text-white bg-slate-950/40 border-slate-800/60 hover:bg-slate-900/60"
                  >
                    <span>{group.group}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : 'rotate-0'
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="space-y-1 pt-1 pl-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.id}
                            href={`/dashboard?tab=${item.id}`}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition-all"
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className="w-4 h-4 text-slate-500" />
                              <span>{item.label}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Platform Quick Links */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => toggleGroup('Platform Resources')}
                className="w-full px-3 py-2 flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider transition-all rounded-xl border text-emerald-400 bg-emerald-500/5 border-emerald-500/20"
              >
                <span>Platform Resources</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    openGroups['Platform Resources'] ? 'rotate-180' : 'rotate-0'
                  }`}
                />
              </button>

              {openGroups['Platform Resources'] && (
                <div className="space-y-1.5 pt-1 pl-1">
                  {externalLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = link.href === '/docs';
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                          <span>{link.label}</span>
                        </div>
                        {!isActive && <ExternalLink className="w-3 h-3 text-slate-600" />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Footer User Profile */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
            {user ? (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-600 flex items-center justify-center font-bold text-slate-950 text-xs shadow shrink-0">
                    {user.name ? user.name.charAt(0) : 'D'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{user.name}</div>
                    <div className="text-[10px] text-slate-500 truncate font-mono">{user.email}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  title="Logout Session"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 border border-slate-800"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Developer Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Workspace Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-bold">
                PRIGID Infrastructure
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] font-mono text-slate-400 uppercase">
                API Reference Docs
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              VIBEZ Developer Reference Docs
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              High-performance integrations with developer-first mechanics.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search docs & references..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Original Docs Layout with Two-Column Content Index and Pane */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
          {/* Left Sidebar Navigation Tree */}
          <div className="lg:col-span-3 space-y-4">
            <div className="p-4 rounded-2xl bg-[#040811] border border-slate-800/80 space-y-4 sticky top-24">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono pl-1">
                API References & Guides
              </div>

              <nav className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
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
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-900/60 text-xs font-bold text-slate-300 hover:text-white transition-all text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-emerald-400" />
                          <span>{cat.title}</span>
                        </div>
                        {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </button>

                      {!isCollapsed && (
                        <div className="pl-4 space-y-0.5 border-l border-slate-800/80 ml-4 my-1">
                          {filteredItems.map((item) => {
                            const isActive = activeItem === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelectDoc(item.id)}
                                className={`w-full flex items-center justify-between p-2 rounded-lg text-[11px] font-mono transition-all text-left ${
                                  isActive
                                    ? 'bg-emerald-500/10 text-emerald-400 font-bold border-l-2 border-emerald-500 pl-2.5'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
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
          <div className="lg:col-span-9 space-y-6">
            <div className="p-6 sm:p-10 rounded-3xl bg-[#040811] border border-slate-800/80 shadow-2xl min-h-[550px] relative">
              {/* Center Content Renderer */}
              <div className="prose prose-invert max-w-none">
                {renderContent()}
              </div>

              {/* Bottom Next and Previous Navigation Buttons */}
              <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                {prevItem ? (
                  <button
                    type="button"
                    onClick={() => handleSelectDoc(prevItem.id)}
                    className="w-full sm:w-1/2 flex items-center gap-3.5 p-4 rounded-2xl bg-slate-900/20 border border-slate-800 hover:border-slate-700/80 text-left group transition-all duration-200 active:scale-98"
                  >
                    <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform" />
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-mono font-black text-slate-500 tracking-wider">Previous section</span>
                      <p className="text-xs font-bold text-slate-200 font-sans group-hover:text-emerald-400 transition-colors">{prevItem.label}</p>
                    </div>
                  </button>
                ) : (
                  <div className="hidden sm:block w-1/2" />
                )}

                {nextItem ? (
                  <button
                    type="button"
                    onClick={() => handleSelectDoc(nextItem.id)}
                    className="w-full sm:w-1/2 flex items-center justify-between p-4 rounded-2xl bg-slate-900/20 border border-slate-800 hover:border-slate-700/80 text-right group transition-all duration-200 active:scale-98"
                  >
                    <div className="space-y-0.5 text-right">
                      <span className="text-[10px] uppercase font-mono font-black text-slate-500 tracking-wider">Up next</span>
                      <p className="text-xs font-bold text-slate-200 font-sans group-hover:text-emerald-400 transition-colors">{nextItem.label}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <div className="hidden sm:block w-1/2" />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DocsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#040811] text-slate-400 font-mono text-xs">
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
