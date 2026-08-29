'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  | 'settings';

export default function DashboardPage() {
  const { user, logout } = useDeveloperAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [showOnboardingManual, setShowOnboardingManual] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
                  {user?.organization || 'Acme Mobile Labs'}
                </span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 shrink-0">
                {user?.role || 'Owner'}
              </span>
            </div>
          </div>

          {/* Navigation Links Group */}
          <div className="p-4 space-y-6 flex-1">
            {mainNavItems.map((group) => (
              <div key={group.group} className="space-y-1.5">
                <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  {group.group}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id as DashboardTab);
                        setMobileSidebarOpen(false);
                      }}
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
            ))}

            {/* Platform Quick Links */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Platform Resources
              </div>
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
          </div>

          {/* Sidebar Footer User Profile */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
            <button
              type="button"
              onClick={() => {
                setShowOnboardingManual(true);
                setMobileSidebarOpen(false);
              }}
              className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-mono font-bold text-emerald-400 flex items-center justify-center gap-2 transition-all"
            >
              <span>🚀 Onboarding Guide</span>
            </button>

            {user ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('profile');
                    setMobileSidebarOpen(false);
                  }}
                  className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-80 transition-opacity"
                  title="View Profile"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-700 shrink-0">
                    <img
                      src={
                        user.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                      }
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{user.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('settings');
                      setMobileSidebarOpen(false);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                    title="Console Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="w-full py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase text-center block hover:bg-emerald-400"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
        {/* Top Content Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
              <span>Console</span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="text-emerald-400 font-bold capitalize">{activeTab}</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {tabTitles[activeTab]?.title}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {tabTitles[activeTab]?.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>LIVE PRODUCTION</span>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('explorer')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sandbox API</span>
            </button>
          </div>
        </div>

        {/* Tab Panel Components */}
        <div className="pt-2 space-y-6">
          {activeTab === 'overview' && (
            <DashboardOverview onNavigateTab={(tab) => setActiveTab(tab as DashboardTab)} />
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
        </div>
      </main>
    </div>
  );
}
