'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

interface SubItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface NavGroup {
  category: string;
  icon: React.ReactNode;
  items: SubItem[];
}

const navGroups: NavGroup[] = [
  {
    category: 'Core Portal',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    items: [
      { name: 'Dashboard', href: '/', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )},
      { name: 'Analytics', href: '/analytics', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2zm9 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )}
    ]
  },
  {
    category: 'User Hub',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    items: [
      { name: 'Users List', href: '/users', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )},
      { name: 'Team Management', href: '/team', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )},
      { name: 'Communities', href: '/communities', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      )},
      { name: 'Official System', href: '/official-community', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )},
      { name: 'Broadcasts', href: '/broadcasts', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )}
    ]
  },
  {
    category: 'Auditing Hub',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    items: [
      { name: 'Inquiries', href: '/inquiries', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )},
      { name: 'Reports logs', href: '/reports', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      )},
      { name: 'Audit Logs', href: '/logs', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
    ]
  },
  {
    category: 'Ecosystem Config',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    items: [
      { name: 'Integrations', href: '/integrations', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
        </svg>
      )},
      { name: 'Payments', href: '/payments', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )},
      { name: 'Badges & Revenue', href: '/badges', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )},
      { name: 'App Security', href: '/security', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )},
      { name: 'Storage Settings', href: '/storage', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      )},
      { name: 'Policy Links', href: '/policy', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )},
      { name: 'App Updates', href: '/updates', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )},
      { name: 'Global Settings', href: '/settings', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )}
    ]
  }
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem('vibez_sidebar_collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    localStorage.setItem('vibez_sidebar_collapsed', String(nextVal));
  };

  let pathname = '';
  try {
    pathname = usePathname() || '';
  } catch (e) {
    pathname = '';
  }

  // Auto-expand any category that contains the currently selected path
  useEffect(() => {
    if (pathname) {
      const activeGroup = navGroups.find(group => 
        group.items.some(item => item.href === pathname)
      );
      if (activeGroup) {
        setExpandedGroups(prev => ({
          ...prev,
          [activeGroup.category]: true
        }));
      }
    }
  }, [pathname]);

  const toggleGroup = (category: string) => {
    // If the sidebar is collapsed, clicking on a category expands the sidebar first for rich visibility!
    if (isCollapsed) {
      setIsCollapsed(false);
      localStorage.setItem('vibez_sidebar_collapsed', 'false');
      setExpandedGroups(prev => ({
        ...prev,
        [category]: true
      }));
      return;
    }

    setExpandedGroups(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  if (pathname === '/login') return null;

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
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col bg-[#0f172a] text-white transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
        isCollapsed ? 'lg:w-20' : 'lg:w-72'
      } ${
        isOpen ? 'w-72 translate-x-0 shadow-2xl' : 'w-72 -translate-x-full lg:translate-x-0'
      }`}>
        {/* Branding */}
        <div className={`flex h-20 items-center justify-between border-b border-white/5 transition-all duration-300 ${
          isCollapsed ? 'px-4 justify-center' : 'px-8'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#008069] to-[#25d366] p-0.5 shadow-lg shadow-emerald-500/20 overflow-hidden shrink-0">
              <img 
                src="/logo.jpg" 
                alt="VIBEZ Logo" 
                className="h-full w-full object-cover rounded-[10px]"
              />
            </div>
            {!isCollapsed && (
              <h1 className="text-xl font-black tracking-tight text-white animate-fadeIn">
                VIBEZ <span className="text-emerald-500 text-xs font-bold uppercase tracking-widest ml-1">Admin</span>
              </h1>
            )}
          </div>
          
          {/* Collapse/Expand Toggle Button for Desktop */}
          <button 
            onClick={toggleCollapse}
            className="hidden lg:flex rounded-xl p-2 hover:bg-white/5 text-gray-400 hover:text-white transition-all active:scale-95 border border-transparent hover:border-white/5 cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
              </svg>
            )}
          </button>

          <button 
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-white/5 transition-colors lg:hidden text-gray-400"
            aria-label="Close navigation menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l18 18" />
            </svg>
          </button>
        </div>

        {/* Navigation Categories and Dropdowns */}
        <nav className={`flex-1 overflow-y-auto py-6 scrollbar-hide space-y-4 ${
          isCollapsed ? 'px-2' : 'px-4'
        }`}>
          {navGroups.map((group) => {
            const isExpanded = !!expandedGroups[group.category];
            const hasActiveChild = group.items.some(item => pathname === item.href);

            return (
              <div key={group.category} className="space-y-1">
                {/* Category Header Dropdown Trigger */}
                <button
                  onClick={() => toggleGroup(group.category)}
                  title={isCollapsed ? group.category : undefined}
                  className={`w-full group flex items-center justify-between rounded-xl py-3 text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    hasActiveChild 
                      ? 'text-emerald-400 bg-white/5' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  } ${
                    isCollapsed ? 'justify-center px-0' : 'px-4'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`transition-colors shrink-0 ${
                      hasActiveChild ? 'text-emerald-400' : 'text-gray-500 group-hover:text-emerald-400'
                    }`}>
                      {group.icon}
                    </div>
                    {!isCollapsed && <span className="animate-fadeIn">{group.category}</span>}
                  </div>
                  
                  {!isCollapsed && (
                    <svg 
                      className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-emerald-400' : 'text-gray-500'}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>

                {/* Dropdown Items List with smooth collapsible heights */}
                {!isCollapsed && (
                  <div className={`transition-all duration-300 overflow-hidden ${
                    isExpanded ? 'max-h-[350px] opacity-100 mt-1 space-y-1 pl-4 border-l border-white/5 ml-6' : 'max-h-0 opacity-0'
                  }`}>
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={onClose}
                          className={`group flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                              : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                          }`}
                        >
                          <div className={`transition-colors shrink-0 ${
                            isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-emerald-400'
                          }`}>
                            {item.icon}
                          </div>
                          <span className="truncate">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className={`mt-auto transition-all duration-300 ${
          isCollapsed ? 'p-2' : 'p-4'
        }`}>
          <div className={`bg-white/5 rounded-2xl border border-white/5 shadow-sm transition-all duration-300 ${
            isCollapsed ? 'p-2' : 'p-4'
          }`}>
            <div className={`flex items-center gap-3 ${
              isCollapsed ? 'flex-col justify-center text-center' : ''
            }`}>
              <div className="relative shrink-0">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-emerald-500/20">
                  {initials}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0f172a] rounded-full"></div>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 animate-fadeIn">
                  <p className="text-sm font-black text-white truncate">{displayName}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{displayRole}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-[11px] font-medium text-gray-400 truncate">{displayEmail}</span>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => logout()}
              title={isCollapsed ? "Sign Out Session" : undefined}
              className={`w-full mt-4 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/10 text-xs font-black text-white hover:text-red-400 transition-all border border-white/5 hover:border-red-500/20 group cursor-pointer ${
                isCollapsed ? 'p-2.5' : 'px-4 py-2.5 gap-2'
              }`}
            >
              {!isCollapsed && <span>Sign Out</span>}
              <svg className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
            
            {!isCollapsed && (
              <div className="mt-3 text-center animate-fadeIn">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Powered by <span className="text-emerald-400 font-extrabold">PRIGID GROUP</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

