'use client';

import React, { useState } from 'react';
import { Sparkles, Smartphone, Server, Cpu, Terminal, ArrowRight, CheckCircle2, Shield, Key, Copy, Check, Rocket } from 'lucide-react';
import { useDeveloperAuth } from '../context/DeveloperAuthContext';

interface OnboardingProps {
  onComplete?: () => void;
}

export const DeveloperOnboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { user, completeOnboarding } = useDeveloperAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [orgName, setOrgName] = useState(user?.organization || 'Acme Engineering Labs');
  const [projectName, setProjectName] = useState('Vibez Integration App');
  const [selectedSdk, setSelectedSdk] = useState<'Kotlin' | 'TypeScript' | 'Python' | 'Go'>(user?.primarySdk || 'Kotlin');
  const [useCases, setUseCases] = useState<string[]>(['Real-time Messaging', 'Phone Authentication']);
  const [copiedKey, setCopiedKey] = useState(false);

  const toggleUseCase = (uc: string) => {
    if (useCases.includes(uc)) {
      setUseCases(useCases.filter((item) => item !== uc));
    } else {
      setUseCases([...useCases, uc]);
    }
  };

  const handleFinish = () => {
    completeOnboarding(orgName, selectedSdk, projectName);
    if (onComplete) onComplete();
  };

  const generatedKeyExample = `vbz_sbx_${selectedSdk.toLowerCase().substring(0, 2)}_98f21bc0891a27e44`;

  return (
    <div className="fixed inset-0 z-50 bg-[#050811]/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Top Glow & Progress indicator */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold flex items-center justify-center">
              {step}/4
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Developer Onboarding Flow
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            Powered by <span className="text-emerald-400">PRIGID GROUP</span>
          </span>
        </div>

        {/* STEP 1: Organization & Project */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Welcome to VIBEZ Developer Hub ⚡
              </h2>
              <p className="text-sm text-slate-400">
                Let&apos;s set up your developer profile and organization workspace to provision your API credentials.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                  Organization / Team Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Acme Mobile Labs"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                  Initial Project / App Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. NextGen Messenger"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!orgName.trim() || !projectName.trim()}
                className="px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Primary SDK Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Select Your Primary SDK
              </h2>
              <p className="text-sm text-slate-400">
                We will configure your sandbox environments, sample code, and request telemetry accordingly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'Kotlin', label: 'Android Kotlin', desc: 'Native Jetpack Compose, Retrofit & WebRTC', icon: Smartphone, color: 'text-emerald-400' },
                { id: 'TypeScript', label: 'TypeScript / Node.js', desc: 'Web apps, Next.js, and serverless microservices', icon: Server, color: 'text-blue-400' },
                { id: 'Python', label: 'Python SDK', desc: 'Data engineering, bots, and AI pipelines', icon: Cpu, color: 'text-amber-400' },
                { id: 'Go', label: 'Go Client', desc: 'High-throughput real-time signaling proxies', icon: Terminal, color: 'text-teal-400' },
              ].map((sdk) => {
                const Icon = sdk.icon;
                const isSelected = selectedSdk === sdk.id;
                return (
                  <button
                    key={sdk.id}
                    type="button"
                    onClick={() => setSelectedSdk(sdk.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl bg-slate-900 ${sdk.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">{sdk.label}</div>
                      <div className="text-xs text-slate-400 mt-1 leading-relaxed">{sdk.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 flex items-center gap-2 transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Intended Use Cases */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                What are you building?
              </h2>
              <p className="text-sm text-slate-400">
                Choose the VIBEZ modules you plan to integrate into {projectName}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                'Real-time Messaging',
                'Phone Authentication',
                'WebRTC Audio/Video Calls',
                'Status & Stories Broadcasts',
                'Identity & Verified Badges',
                'Webhooks & Event Ingestion',
                'Community & Group Chats',
                'Telemetry & Audit Logs',
              ].map((uc) => {
                const isChecked = useCases.includes(uc);
                return (
                  <button
                    key={uc}
                    type="button"
                    onClick={() => toggleUseCase(uc)}
                    className={`p-3.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all ${
                      isChecked
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{uc}</span>
                    <CheckCircle2 className={`w-4 h-4 ${isChecked ? 'text-emerald-400' : 'text-slate-800'}`} />
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 flex items-center gap-2 transition-all"
              >
                <span>Generate Keys</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Initial Sandbox Key & Completion */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ready to Launch</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Your Sandbox Environment is Ready!
              </h2>
              <p className="text-sm text-slate-400">
                We have generated your primary sandbox key targeting the <span className="text-emerald-400 font-bold">{selectedSdk}</span> SDK.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 font-bold uppercase">Sandbox API Key</span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  {selectedSdk} Target
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-300">
                <span className="truncate">{generatedKeyExample}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedKeyExample);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-[11px] text-slate-300 hover:text-white font-sans font-bold ml-2 shrink-0"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Default scopes enabled: messages:write, auth:otp, system:telemetry</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider hover:opacity-95 shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Rocket className="w-4 h-4" />
                <span>Enter Developer Dashboard</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
