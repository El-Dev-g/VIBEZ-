import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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
  ShieldCheck,
  Gauge,
  Play
} from 'lucide-react';
import { useDeveloperAuth } from '../context/DeveloperAuthContext';
import { CodeBlock } from '../components/CodeBlock';

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
  const [searchParams] = useSearchParams();
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

  const categories: NavCategory[] = [
    {
      title: 'Getting Started',
      icon: BookOpen,
      items: [
        { id: 'intro', label: 'Platform Overview' },
        { id: 'quickstart', label: '5-Minute Quickstart' },
        { id: 'auth_guide', label: 'Authentication & API Keys' },
        { id: 'environments', label: 'Sandbox vs Production' },
      ],
    },
    {
      title: 'Phone Authentication',
      icon: Lock,
      items: [
        { id: 'auth_otp', label: 'Request Phone OTP', method: 'POST', path: '/api/auth/phone/otp' },
        { id: 'auth_verify', label: 'Verify OTP & Issue Session', method: 'POST', path: '/api/auth/phone/verify' },
        { id: 'auth_refresh', label: 'Refresh Session Token', method: 'POST', path: '/api/auth/token/refresh' },
      ],
    },
    {
      title: 'Messaging & Chat API',
      icon: MessageSquare,
      items: [
        { id: 'msg_send', label: 'Send Message', method: 'POST', path: '/api/developer/messages/send' },
        { id: 'msg_list', label: 'Fetch Chat History', method: 'GET', path: '/api/chats/:id/messages' },
        { id: 'msg_typing', label: 'Send Typing Indicator', method: 'POST', path: '/api/chats/:id/typing' },
      ],
    },
    {
      title: 'Webhooks & Realtime',
      icon: Webhook,
      items: [
        { id: 'wh_config', label: 'Webhook Endpoints' },
        { id: 'wh_events', label: 'Event Types & Payloads' },
        { id: 'wh_security', label: 'HMAC Signature Verification' },
      ],
    },
    {
      title: 'RTC & Call Engine',
      icon: Activity,
      items: [
        { id: 'rtc_token', label: 'Generate RTC Token', method: 'POST', path: '/api/developer/rtc/token' },
        { id: 'rtc_signaling', label: 'WebRTC Signaling Protocol' },
      ],
    },
  ];

  const allItems = categories.flatMap(c => c.items);
  const currentIndex = allItems.findIndex(item => item.id === activeItem);
  const prevItem = currentIndex > 0 ? allItems[currentIndex - 1] : null;
  const nextItem = currentIndex >= 0 && currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;

  useEffect(() => {
    const docParam = searchParams.get('doc');
    if (docParam && allItems.some(i => i.id === docParam)) {
      setActiveItem(docParam);
    }
  }, [searchParams]);

  const handleSelectDoc = (id: string) => {
    setActiveItem(id);
    setMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    switch (activeItem) {
      case 'intro':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white">VIBEZ Developer Documentation</h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Welcome to the official PRIGID GROUP Developer Documentation. VIBEZ provides enterprise real-time communication APIs, including Phone OTP authentication, Socket.IO messaging streams, WebRTC call signaling, and Webhooks.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h3 className="font-bold text-white text-sm">REST API Base URL</h3>
                <code className="text-xs font-mono text-emerald-400 block bg-slate-950 p-2 rounded border border-slate-800">
                  https://vibez-n5h1.onrender.com/api
                </code>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h3 className="font-bold text-white text-sm">WebSocket Gateway</h3>
                <code className="text-xs font-mono text-emerald-400 block bg-slate-950 p-2 rounded border border-slate-800">
                  wss://vibez-n5h1.onrender.com
                </code>
              </div>
            </div>
          </div>
        );
      case 'quickstart':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white">5-Minute Quickstart</h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Follow this quickstart guide to send your first API request and establish a WebSocket connection.
            </p>
            <CodeBlock
              language="bash"
              title="1. Dispatch SMS OTP"
              code={`curl -X POST "https://vibez-n5h1.onrender.com/api/auth/phone/otp" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"phoneNumber": "+1234567890"}'`}
            />
          </div>
        );
      case 'auth_otp':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">POST</span>
              <code className="text-sm font-mono text-white">/api/auth/phone/otp</code>
            </div>
            <h1 className="text-3xl font-black text-white">Request Phone OTP</h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Dispatches a 6-digit verification challenge via SMS or sandbox testing channels to the specified international phone number.
            </p>
            <CodeBlock
              language="json"
              title="Request Body"
              code={`{\n  "phoneNumber": "+14155552671"\n}`}
            />
            <CodeBlock
              language="json"
              title="Response (200 OK)"
              code={`{\n  "success": true,\n  "message": "OTP dispatched successfully",\n  "data": {\n    "verificationId": "vfy_98fbc120a",\n    "expiresIn": 300\n  }\n}`}
            />
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-black text-white capitalize">{activeItem.replace('_', ' ')}</h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Detailed technical reference and code examples for {activeItem.replace('_', ' ')}.
            </p>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
              Endpoint specification and payload schemas are synced in real-time with the server build.
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col lg:flex-row">
      {/* Mobile Top Navigation */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-[#080c16] border-b border-slate-800 sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
            ⚡
          </div>
          <span className="font-black text-white text-base">VIBEZ DOCS</span>
        </Link>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-xl bg-slate-900 text-slate-300 border border-slate-800"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Docs Navigation */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-[#060911] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              ⚡
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-wider text-white">VIBEZ API DOCS</span>
              <span className="text-[10px] text-slate-400 font-medium">PRIGID GROUP</span>
            </div>
          </Link>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Categories */}
          <nav className="space-y-6">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.title} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-400 px-2">
                    <Icon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{cat.title}</span>
                  </div>
                  <div className="space-y-1">
                    {cat.items.map((item) => {
                      const isActive = activeItem === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectDoc(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-left transition-all ${
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30'
                              : 'text-slate-400 hover:bg-slate-900 hover:text-white border border-transparent'
                          }`}
                        >
                          <span className="truncate">{item.label}</span>
                          {item.method && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-emerald-300">
                              {item.method}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800/80 bg-[#04070e] text-[10px] text-slate-500 font-mono">
          <span>API Reference Version 2.4.0</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Link to="/dashboard" className="hover:text-emerald-400">Console</Link>
              <span>/</span>
              <span className="text-white font-bold">Documentation</span>
            </div>
            <Link
              to="/dashboard"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs hover:text-white transition-all flex items-center gap-2"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Console</span>
            </Link>
          </div>

          <div className="p-6 sm:p-10 rounded-3xl bg-[#040811] border border-slate-800/80 shadow-2xl min-h-[550px] relative">
            <div className="prose prose-invert max-w-none">
              {renderContent()}
            </div>

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
