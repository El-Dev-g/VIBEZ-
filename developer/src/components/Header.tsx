'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Terminal, BookOpen, Play, Webhook, Key, Code, Menu, X, LayoutDashboard, User, Server } from 'lucide-react';
import { useDeveloperAuth } from '../context/DeveloperAuthContext';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { user } = useDeveloperAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Overview', icon: Terminal },
    { href: '/dashboard', label: 'Console', icon: LayoutDashboard, badge: 'Live' },
    { href: '/server-codes', label: 'Server Codes', icon: Server, badge: 'New' },
    { href: '/docs', label: 'API Reference', icon: BookOpen },
    { href: '/explorer', label: 'API Explorer', icon: Play },
    { href: '/webhooks', label: 'Webhooks', icon: Webhook },
    { href: '/keys', label: 'API Keys', icon: Key },
    { href: '/sdks', label: 'SDKs', icon: Code },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#090d16]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                ⚡
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-wider text-white flex items-center gap-2">
                  VIBEZ <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">DEV</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium -mt-1">
                  Powered by <span className="text-emerald-400 font-bold">PRIGID GROUP</span>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 pl-6 border-l border-slate-800">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-mono">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right quick actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-emerald-500/40 text-xs font-mono font-medium transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Dashboard</span>
            </Link>

            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono hover:border-slate-700 transition-all"
              >
                <div className="w-5 h-5 rounded-md overflow-hidden">
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80'}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-bold">{user.name.split(' ')[0]}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider hover:bg-emerald-400 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#0c121e] px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};

