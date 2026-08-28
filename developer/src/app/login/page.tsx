'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useDeveloperAuth } from '../../context/DeveloperAuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useDeveloperAuth();
  const [email, setEmail] = useState('alex.rivera@prigid.com');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setTimeout(() => {
      login(email);
      router.push('/dashboard');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#050811] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#090d16] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <Zap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Developer Login</h1>
          <p className="text-xs text-slate-400">
            Sign in to access your API keys, traffic telemetry & team workspace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">Developer Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider hover:opacity-95 shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In to Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 font-mono">
          Don&apos;t have a developer account?{' '}
          <Link href="/register" className="text-emerald-400 hover:underline font-bold">
            Create an Account
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
