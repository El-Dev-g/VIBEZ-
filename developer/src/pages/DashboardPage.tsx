import React, { useState, useEffect, Suspense } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  LogOut,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Menu,
  X,
  User,
  Settings,
  Lock,
  Layers,
} from 'lucide-react';

import { useDeveloperAuth } from '../context/DeveloperAuthContext';
import { DeveloperOnboarding } from '../components/DeveloperOnboarding';
import { PrigidAppConsole } from '../components/PrigidAppConsole';
import { DeveloperProfile } from '../components/DeveloperProfile';
import { DeveloperSettings } from '../components/DeveloperSettings';

type DashboardTab = 'apps' | 'profile' | 'settings';

const VALID_TABS: DashboardTab[] = ['apps', 'profile', 'settings'];

function DashboardContent() {
  const { user, login, logout, isLoading: authLoading } = useDeveloperAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<DashboardTab>('apps');
  const [showOnboardingManual, setShowOnboardingManual] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Developer Platform': true,
  });

  useEffect(() => {
    const tabFromQuery = searchParams.get('tab') as DashboardTab;
    if (tabFromQuery && VALID_TABS.includes(tabFromQuery)) {
      setActiveTab(tabFromQuery);
      return;
    }

    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '') as DashboardTab;
      if (hash && VALID_TABS.includes(hash)) {
        setActiveTab(hash);
        return;
      }

      const savedTab = localStorage.getItem('vibez_active_dashboard_tab') as DashboardTab;
      if (savedTab && VALID_TABS.includes(savedTab)) {
        setActiveTab(savedTab);
      }
    }
  }, [searchParams]);

  const handleTabChange = (newTab: DashboardTab) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setActiveTab(newTab);
    setMobileSidebarOpen(false);
    setSearchParams({ tab: newTab }, { replace: true });
    if (typeof window !== 'undefined') {
      localStorage.setItem('vibez_active_dashboard_tab', newTab);
    }
  };

  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const needsOnboarding = user && !user.hasCompletedOnboarding;

  const mainNavItems = [
    {
      group: 'Developer Platform',
      items: [
        { id: 'apps', label: 'My Applications', icon: Layers, badge: 'Console' },
        { id: 'profile', label: 'Developer Profile', icon: User },
        { id: 'settings', label: 'Console Settings', icon: Settings },
      ],
    },
  ];

  const tabTitles: Record<DashboardTab, { title: string; subtitle: string }> = {
    apps: {
      title: 'PRIGID Developer Console',
      subtitle: 'Meta for Developers-style application studio, products catalogue, permissions matrix, test tokens, and webhooks.',
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
      {(needsOnboarding || showOnboardingManual) && (
        <DeveloperOnboarding onComplete={() => setShowOnboardingManual(false)} />
      )}

      {/* Mobile Header Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-[#090d16] border-b border-slate-800 sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
            ⚡
          </div>
          <span className="font-black text-white text-base">VIBEZ DEV</span>
        </Link>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-xl bg-slate-900 text-slate-300 border border-slate-800"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#080c16] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-wider text-white flex items-center gap-2">
                VIBEZ <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">CONSOLE</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">PRIGID GROUP</span>
            </div>
          </Link>

          {/* User Profile Card */}
          {user ? (
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate">{user.name}</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-medium truncate">{user.organization}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                title="Logout"
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Guest Session</span>
              </div>
              <Link to="/login" className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[10px] uppercase">
                Sign In
              </Link>
            </div>
          )}

          {/* Nav Groups */}
          <nav className="space-y-4">
            {mainNavItems.map((group) => {
              const isOpen = openGroups[group.group] !== false;
              return (
                <div key={group.group} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(group.group)}
                    className="w-full flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 px-2 py-1 hover:text-slate-300 transition-colors"
                  >
                    <span>{group.group}</span>
                    {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>

                  {isOpen && (
                    <div className="space-y-0.5 pt-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        const isProtected = !user && item.id !== 'overview';
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleTabChange(item.id as DashboardTab)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                              isActive
                                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold'
                                : 'text-slate-400 hover:bg-slate-900 hover:text-white border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                              <span>{item.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isProtected && <Lock className="w-3 h-3 text-amber-400/80" />}
                              {item.badge && !isProtected && (
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                    isActive
                                      ? 'bg-emerald-400 text-slate-950 font-black'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>
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

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-slate-800/80 bg-[#060911] text-[10px] text-slate-500 font-mono space-y-1">
          <div className="flex items-center justify-between">
            <span>Environment:</span>
            <span className="text-emerald-400 font-bold">Production Node</span>
          </div>
          <div className="flex items-center justify-between">
            <span>API Version:</span>
            <span>v2.4.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                {tabTitles[activeTab]?.title || 'Developer Console'}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {tabTitles[activeTab]?.subtitle || 'Enterprise API and operational dashboard.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOnboardingManual(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-mono text-xs font-bold transition-all flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Onboarding Guide</span>
              </button>
            </div>
          </div>

          {/* Active Tab View */}
          {!user ? (
            <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 text-center max-w-xl mx-auto space-y-6 my-12">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Authentication Required</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Access to application configuration, API credentials, webhooks, and permissions is restricted. Please sign in to your developer account.
                </p>
              </div>

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
                <Link to="/login" className="text-emerald-400 hover:underline font-bold">
                  Full Login Page
                </Link>
                <span className="text-slate-700">•</span>
                <Link to="/register" className="text-slate-400 hover:text-white transition-colors">
                  Register Account
                </Link>
              </div>

              <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Secured by PRIGID GROUP Infrastructure Shield</span>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'apps' && <PrigidAppConsole />}
              {activeTab === 'profile' && <DeveloperProfile onLogout={logout} />}
              {activeTab === 'settings' && <DeveloperSettings />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050811] flex items-center justify-center text-slate-400 font-mono text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading developer console...</span>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
