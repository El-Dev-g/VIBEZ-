'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Activity,
  Key,
  Users,
  Gauge,
  Terminal,
  KeyRound,
  Radio,
  Sparkles,
  Zap,
  Building,
  LogOut,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Code2,
  BookOpen,
  Play,
  Webhook,
  Server,
  Menu,
  X,
  ExternalLink,
  LayoutDashboard,
  User,
  Settings,
  Lock,
  CreditCard,
} from 'lucide-react';
import { useDeveloperAuth } from '../../context/DeveloperAuthContext';
import { DeveloperOnboarding } from '../../components/DeveloperOnboarding';
import { DashboardOverview } from '../../components/DashboardOverview';
import { DeveloperKeyGenerator } from '../../components/DeveloperKeyGenerator';
import { TeamMembersManager } from '../../components/TeamMembersManager';
import { RateLimitingQuotaManager } from '../../components/RateLimitingQuotaManager';
import { TrafficLogsInspector } from '../../components/TrafficLogsInspector';
import { OAuthAppsManager } from '../../components/OAuthAppsManager';
import { EventReplayStudio } from '../../components/EventReplayStudio';
import { AiSchemaMockGenerator } from '../../components/AiSchemaMockGenerator';
import { ApiExplorerSandbox } from '../../components/ApiExplorerSandbox';
import { DeveloperProfile } from '../../components/DeveloperProfile';
import { DeveloperSettings } from '../../components/DeveloperSettings';
import { BillingManager } from '../../components/BillingManager';

type DashboardTab =
  | 'overview'
  | 'keys'
  | 'team'
  | 'quotas'
  | 'logs'
  | 'oauth'
  | 'replay'
  | 'ai_schema'
  | 'explorer'
  | 'profile'
  | 'settings'
  | 'billing';

const VALID_TABS: DashboardTab[] = [
  'overview',
  'keys',
  'team',
  'quotas',
  'logs',
  'oauth',
  'replay',
  'ai_schema',
  'explorer',
  'profile',
  'settings',
  'billing'
];

function DashboardContent() {
  const { user, login, logout, isLoading: authLoading } = useDeveloperAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [showOnboardingManual, setShowOnboardingManual] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Collapsible dropdown state for sidebar group menus
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Overview & Metrics': true,
    'Access & Security': true,
    'Developer Tools & AI': true,
    'Account & Preferences': true,
    'Platform Resources': true,
  });

  // Restore and maintain tab from URL search params / hash / localStorage on page load or refresh
  useEffect(() => {
    // 1. Check URL query param ?tab=
    const tabFromQuery = searchParams.get('tab') as DashboardTab;
    if (tabFromQuery && VALID_TABS.includes(tabFromQuery)) {
      setActiveTab(tabFromQuery);
      return;
    }

    // 2. Check URL Hash #tab= or #oauth, etc.
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '') as DashboardTab;
      if (hash && VALID_TABS.includes(hash)) {
        setActiveTab(hash);
        return;
      }

      // 3. Fallback to localStorage
      const savedTab = localStorage.getItem('vibez_active_dashboard_tab') as DashboardTab;
      if (savedTab && VALID_TABS.includes(savedTab)) {
        setActiveTab(savedTab);
      }
    }
  }, [searchParams]);

  const handleTabChange = (newTab: DashboardTab) => {
    setActiveTab(newTab);
    setMobileSidebarOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vibez_active_dashboard_tab', newTab);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newTab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // If user exists and hasn't finished onboarding, trigger the onboarding modal
  const needsOnboarding = user && !user.hasCompletedOnboarding;

  const mainNavItems = [
    {
      group: 'Overview & Metrics',
      items: [
        { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard, badge: 'Live' },
        { id: 'logs', label: 'Traffic Inspector', icon: Terminal },
        { id: 'quotas', label: 'Rate Limits & Quota', icon: Gauge },
      ],
    },
    {
      group: 'Access & Security',
      items: [
        { id: 'keys', label: 'API Sandbox & Master Keys', icon: Key, badge: 'Protected' },
        { id: 'oauth', label: 'OAuth2 Client Apps', icon: KeyRound },
        { id: 'team', label: 'Team Members', icon: Users },
      ],
    },
    {
      group: 'Developer Tools & AI',
      items: [
        { id: 'explorer', label: 'API Sandbox Explorer', icon: Play, badge: 'Sandbox' },
        { id: 'replay', label: 'Webhooks & Event Streams', icon: Webhook, badge: 'Live' },
        { id: 'ai_schema', label: 'AI Schema & Mocks', icon: Sparkles, badge: 'AI' },
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

  const externalLinks: { href: string; label: string; icon: any; badge?: string }[] = [
    { href: '/docs', label: 'API Documentation', icon: BookOpen },
    { href: '/sdks', label: 'SDK Packages', icon: Code2 },
  ];

  const tabTitles: Record<DashboardTab, { title: string; subtitle: string }> = {
    overview: {
      title: 'Dashboard Overview',
      subtitle: 'System performance, API traffic activity, active keys, and operational telemetry.',
    },
    keys: {
      title: 'API Keys & Access Control',
      subtitle: 'Manage production and test API keys with instant revocation.',
    },
    team: {
      title: 'Team & Organization Members',
      subtitle: 'Invite collaborators and set granular permission roles.',
    },
    quotas: {
      title: 'Rate Limits & Usage Quotas',
      subtitle: 'Monitor request volume, burst rates, and account tier limits.',
    },
    logs: {
      title: 'Traffic Inspector & Audit Logs',
      subtitle: 'Inspect live HTTP requests, status codes, and latency metrics.',
    },
    oauth: {
      title: 'OAuth2 Client Applications',
      subtitle: 'Register third-party OAuth2 apps, redirect URIs, and credentials.',
    },
    replay: {
      title: 'Event Replay Studio',
      subtitle: 'Re-trigger WebSocket events and test webhook dispatches.',
    },
    ai_schema: {
      title: 'AI Schema & Mock Generator',
      subtitle: 'Generate synthetic payloads and mock response schemas using Gemini AI.',
    },
    explorer: {
      title: 'API Sandbox Explorer',
      subtitle: 'Construct, test, and inspect real-time API request payloads in a protected environment.',
    },
    profile: {
      title: 'Developer Profile',
      subtitle: 'View account credentials, developer identity, and enterprise tier details.',
    },
    settings: {
      title: 'Console & API Settings',
      subtitle: 'Configure webhook signing keys, default environment modes, and rate limit alerts.',
    },
    billing: {
      title: 'Billing & Subscription Plans',
      subtitle: 'Manage your organization’s financial settings, usage tiers, and invoice history.',
    },
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col lg:flex-row">
      {/* Onboarding Flow Modal */}
      {(needsOnboarding || showOnboardingManual) && (
        <DeveloperOnboarding onComplete={() => setShowOnboardingManual(false)} />
      )}

      {/* Mobile Header Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#070b14] border-b border-slate-800 sticky top-0 z-50">
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
              const hasActiveChild = group.items.some((item) => item.id === activeTab);

              return (
                <div key={group.group} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.group)}
                    className={`w-full px-3 py-2 flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider transition-all rounded-xl border ${
                      hasActiveChild
                        ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20'
                        : 'text-slate-500 hover:text-white bg-slate-950/40 border-slate-800/60 hover:bg-slate-900/60'
                    }`}
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
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleTabChange(item.id as DashboardTab)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                              isActive
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold shadow-sm'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon
                                className={`w-4 h-4 ${
                                  isActive ? 'text-emerald-400' : 'text-slate-500'
                                }`}
                              />
                              <span>{item.label}</span>
                            </div>
                            {item.badge && (
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                                  isActive
                                    ? 'bg-emerald-500 text-slate-950'
                                    : 'bg-emerald-500/10 text-emerald-400'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>
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
                className={`w-full px-3 py-2 flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider transition-all rounded-xl border ${
                  openGroups['Platform Resources']
                    ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20'
                    : 'text-slate-500 hover:text-white bg-slate-950/40 border-slate-800/60 hover:bg-slate-900/60'
                }`}
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
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileSidebarOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900/60 transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-slate-500" />
                          <span>{link.label}</span>
                        </div>
                        {link.badge ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                            {link.badge}
                          </span>
                        ) : (
                          <ExternalLink className="w-3 h-3 text-slate-600" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Footer User Profile */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
            <button
              type="button"
              onClick={() => {
                setShowOnboardingManual(true);
                setMobileSidebarOpen(false);
              }}
              className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Restart SDK Onboarding</span>
            </button>

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

      {/* Main Content Workspace Area */}
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
                {activeTab.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {tabTitles[activeTab]?.title || 'Dashboard'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {tabTitles[activeTab]?.subtitle || 'Manage your developer workspace.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/docs"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-mono font-medium flex items-center gap-1.5 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Interactive Docs</span>
            </Link>

            <Link
              href="/sdks"
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Get SDKs</span>
            </Link>
          </div>
        </div>

        {/* Tab Panel Components */}
        <div className="pt-2 space-y-6">
          {authLoading ? (
            <div className="min-h-[50vh] flex items-center justify-center p-8">
              <div className="flex flex-col items-center gap-3 text-slate-400 font-mono text-xs">
                <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span>Restoring developer session...</span>
              </div>
            </div>
          ) : !user ? (
            <div className="min-h-[65vh] flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-[#070b14] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                  <ShieldCheck className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Protected Dashboard Workspace</span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Authentication Required
                  </h2>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Access to system telemetry, API keys, OAuth client credentials, team settings, and traffic logs is restricted. Please sign in to your developer account.
                  </p>
                </div>

                {/* Quick Login Form inside Protection Gate */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const emailInput = (formData.get('email') as string) || 'developer@prigid.com';
                    await login(emailInput);
                  }}
                  className="space-y-3 pt-2 text-left"
                >
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">Developer Email</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue="developer@prigid.com"
                      required
                      placeholder="developer@prigid.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider hover:opacity-95 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Authenticate & Access Console</span>
                  </button>
                </form>

                <div className="pt-2 flex items-center justify-center gap-4 text-xs font-mono">
                  <Link href="/login" className="text-emerald-400 hover:underline font-bold">
                    Full Login Page
                  </Link>
                  <span className="text-slate-700">•</span>
                  <Link href="/register" className="text-slate-400 hover:text-white transition-colors">
                    Register Account
                  </Link>
                </div>

                <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Secured by PRIGID GROUP Infrastructure Shield</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <DashboardOverview onNavigateTab={(tab) => handleTabChange(tab as DashboardTab)} />
              )}
              {activeTab === 'keys' && <DeveloperKeyGenerator />}
              {activeTab === 'team' && <TeamMembersManager />}
              {activeTab === 'quotas' && <RateLimitingQuotaManager />}
              {activeTab === 'logs' && <TrafficLogsInspector />}
              {activeTab === 'oauth' && <OAuthAppsManager />}
              {activeTab === 'replay' && <EventReplayStudio />}
              {activeTab === 'ai_schema' && <AiSchemaMockGenerator />}
              {activeTab === 'explorer' && <ApiExplorerSandbox />}
              {activeTab === 'profile' && <DeveloperProfile onLogout={logout} />}
              {activeTab === 'settings' && <DeveloperSettings />}
              {activeTab === 'billing' && <BillingManager />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050811] flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading developer console...</span>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
