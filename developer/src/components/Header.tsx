'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDeveloperAuth } from '../context/DeveloperAuthContext';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useDeveloperAuth();

  // Hide home page header on dashboard and docs
  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/docs')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#090d16]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-wider text-white flex items-center gap-2">
                VIBEZ <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">DEV</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium -mt-0.5">
                Powered by <span className="text-emerald-400 font-bold">PRIGID GROUP</span>
              </span>
            </div>
          </Link>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono hover:border-emerald-500/40 transition-all"
                >
                  <div className="w-5 h-5 rounded-md overflow-hidden shrink-0">
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80'}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-bold">{user.name.split(' ')[0]}</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 text-xs font-mono transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-300 hover:text-white transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};


