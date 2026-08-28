'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, User, Mail, Building, ArrowRight, ShieldCheck } from 'lucide-react';
import { useDeveloperAuth } from '../../context/DeveloperAuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useDeveloperAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [org, setOrg] = useState('');
  const [sdk, setSdk] = useState<'Kotlin' | 'TypeScript' | 'Python' | 'Go'>('Kotlin');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !org) return;
    setIsLoading(true);
    setTimeout(() => {
      register(name, email, org, sdk);
      router.push('/dashboard');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#050811] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#090d16] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <Zap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Create Developer Account</h1>
          <p className="text-xs text-slate-400">
            Join the PRIGID GROUP Developer Hub to build real-time communication apps
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="alex@techcorp.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">Organization / Team Name</label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. Acme Mobile Labs"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 font-bold mb-2">Target SDK Platform</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Kotlin', 'TypeScript', 'Python', 'Go'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSdk(s)}
                  className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                    sdk === s
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider hover:opacity-95 shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <span>{isLoading ? 'Creating Account...' : 'Continue to Onboarding'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 font-mono">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-400 hover:underline font-bold">
            Sign In
          </Link>
        </div>

        <div className="pt-2 border-t border-slate-800/80 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Secured by PRIGID GROUP Developer Infrastructure</span>
        </div>
      </div>
    </div>
  );
}
