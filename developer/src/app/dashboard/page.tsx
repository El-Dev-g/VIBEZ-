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
} from 'lucide-react';
import { useDeveloperAuth } from '../../context/DeveloperAuthContext';
import { DeveloperOnboarding } from '../../components/DeveloperOnboarding';
import { SdkDistributionVisualizer } from '../../components/SdkDistributionVisualizer';
import { DeveloperKeyGenerator } from '../../components/DeveloperKeyGenerator';
import { TeamMembersManager } from '../../components/TeamMembersManager';
import { RateLimitingQuotaManager } from '../../components/RateLimitingQuotaManager';
import { TrafficLogsInspector } from '../../components/TrafficLogsInspector';
import { OAuthAppsManager } from '../../components/OAuthAppsManager';
import { EventReplayStudio } from '../../components/EventReplayStudio';
import { AiSchemaMockGenerator } from '../../components/AiSchemaMockGenerator';

type DashboardTab =
  | 'telemetry'
  | 'keys'
  | 'team'
  | 'quotas'
  | 'logs'
  | 'oauth'
  | 'replay'
  | 'ai_schema';

export default function DashboardPage() {
  const { user, logout } = useDeveloperAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('telemetry');
  const [showOnboardingManual, setShowOnboardingManual] = useState(false);

  // If user exists and hasn't finished onboarding, trigger the onboarding modal
  const needsOnboarding = user && !user.hasCompletedOnboarding;

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 pb-20">
      {/* Onboarding Flow if not completed or opened manually */}
      {(needsOnboarding || showOnboardingManual) && (
        <DeveloperOnboarding onComplete={() => setShowOnboardingManual(false)} />
      )}

      {/* Top Banner / Header */}
      <div className="border-b border-slate-800/80 bg-[#070b14]/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-all">
                <div className="w-full h-full bg-[#050811] rounded-[10px] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base text-white tracking-tight">VIBEZ</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    CONSOLE
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  Powered by <span className="text-emerald-400 font-bold">PRIGID GROUP</span>
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800 text-xs font-mono text-slate-400">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-white font-bold">{user?.organization || 'Acme Mobile Labs'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-bold">{user?.role || 'Owner'}</span>
            </div>
          </div>

          {/* Quick links & User profile */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/explorer"
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sandbox API</span>
            </Link>

            <Link
              href="/docs"
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>API Docs</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowOnboardingManual(true)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 hover:bg-emerald-500/20 transition-all"
              title="Re-run Onboarding Wizard"
            >
              🚀 Onboarding
            </button>

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-700">
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs uppercase hover:bg-emerald-400"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-thin">
          {[
            { id: 'telemetry', label: 'SDK Distribution', icon: Activity, badge: 'Live' },
            { id: 'keys', label: 'API Keys & Secrets', icon: Key },
            { id: 'team', label: 'Team Members', icon: Users },
            { id: 'quotas', label: 'Rate Limits & Quota', icon: Gauge },
            { id: 'logs', label: 'Traffic Inspector', icon: Terminal },
            { id: 'oauth', label: 'OAuth2 Apps', icon: KeyRound },
            { id: 'replay', label: 'Event Replay Studio', icon: Radio },
            { id: 'ai_schema', label: 'AI Schema & Mocks', icon: Sparkles, badge: 'AI' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as DashboardTab)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10'
                    : 'bg-[#070b14] text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                      isActive ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="space-y-6">
          {activeTab === 'telemetry' && <SdkDistributionVisualizer />}
          {activeTab === 'keys' && <DeveloperKeyGenerator />}
          {activeTab === 'team' && <TeamMembersManager />}
          {activeTab === 'quotas' && <RateLimitingQuotaManager />}
          {activeTab === 'logs' && <TrafficLogsInspector />}
          {activeTab === 'oauth' && <OAuthAppsManager />}
          {activeTab === 'replay' && <EventReplayStudio />}
          {activeTab === 'ai_schema' && <AiSchemaMockGenerator />}
        </div>
      </div>
    </div>
  );
}
