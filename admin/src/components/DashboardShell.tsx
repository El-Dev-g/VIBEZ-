'use client';

import { useState, useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { user, logout } = useAuth();

  let pathname = '';
  try {
    pathname = usePathname() || '';
  } catch (e) {
    pathname = '';
  }
  const isLoginPage = pathname === '/login';

  // Handle click outside dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
        setIsNotifOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Calculate initials from user name or email
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'System Admin');
  const displayEmail = user?.email || 'admin@vibez.com';
  const displayRole = user?.role || 'SuperAdmin';
  
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'AD';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 lg:px-8 shadow-sm relative z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all lg:hidden"
              aria-label="Open navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">
                VIBEZ Internal Command <span className="text-gray-400 font-medium">| Node v2.4</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {/* Search Input */}
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-gray-100/80 rounded-xl border border-gray-200 group transition-all focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500/50 focus-within:bg-white">
              <svg className="w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="bg-transparent text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400 w-40 lg:w-48"
              />
            </div>

            {/* Notifications Popover */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsProfileOpen(false);
                }}
                className={`relative rounded-xl p-2.5 transition-all ${
                  isNotifOpen ? 'bg-emerald-50 text-emerald-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}
                aria-label="View system notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 border-2 border-white rounded-full"></span>
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-gray-200 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-gray-900">System Alerts</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">Active</span>
                    </div>
                    <Link 
                      href="/logs" 
                      onClick={() => setIsNotifOpen(false)}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto py-2">
                    <div className="py-2.5 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 text-xs">
                        🛡️
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900">Admin Security Shield Active</p>
                        <p className="text-[11px] text-gray-500 truncate">Authentication middleware protecting all routes</p>
                        <span className="text-[9px] text-gray-400">Just now</span>
                      </div>
                    </div>
                    <div className="py-2.5 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 text-xs">
                        ⚡
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900">Database Engine Healthy</p>
                        <p className="text-[11px] text-gray-500 truncate">PostgreSQL latency: 12ms avg</p>
                        <span className="text-[9px] text-gray-400">5m ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Admin User Profile Dropdown Button */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotifOpen(false);
                }}
                className={`flex items-center gap-2.5 rounded-2xl p-1.5 pr-3 transition-all border ${
                  isProfileOpen 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10' 
                    : 'bg-white hover:bg-gray-100 text-gray-800 border-gray-200 shadow-sm'
                }`}
                aria-label="Admin User Menu"
                aria-expanded={isProfileOpen}
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                    {initials}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className={`text-xs font-black leading-tight truncate max-w-[110px] ${isProfileOpen ? 'text-white' : 'text-gray-900'}`}>
                    {displayName}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isProfileOpen ? 'text-emerald-300' : 'text-emerald-600'}`}>
                    {displayRole}
                  </span>
                </div>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isProfileOpen ? 'text-emerald-400 rotate-180' : 'text-gray-400'
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-3xl bg-white border border-gray-200/80 shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150 z-50 divide-y divide-gray-100">
                  {/* User Profile Card Header */}
                  <div className="p-3 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center font-black text-base shadow-md shadow-emerald-500/20">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-black text-gray-900 truncate">{displayName}</h4>
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        </div>
                        <p className="text-xs font-medium text-gray-500 truncate">{displayEmail}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md text-[9px] font-black uppercase tracking-wider">
                          {displayRole}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="py-2 space-y-1">
                    <Link
                      href="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="leading-tight">Admin Profile & Key</p>
                        <p className="text-[10px] text-gray-400 font-normal">Edit credentials and personal details</p>
                      </div>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="leading-tight">System Settings</p>
                        <p className="text-[10px] text-gray-400 font-normal">Pricing, maintenance, and rules</p>
                      </div>
                    </Link>

                    <Link
                      href="/logs"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="leading-tight">Audit Logs</p>
                        <p className="text-[10px] text-gray-400 font-normal">Track security events & history</p>
                      </div>
                    </Link>
                  </div>

                  {/* Sign Out Action */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out Session</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider font-bold opacity-75">Exit</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
