'use client';

import React, { useState, useEffect } from 'react';
import DashboardShell from './DashboardShell';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { usePathname } from 'next/navigation';
import { Zap } from 'lucide-react';

function AuthenticatedContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0b1120]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#008069] to-[#25d366] flex items-center justify-center shadow-2xl shadow-emerald-500/30 animate-pulse">
            <Zap className="text-white w-8 h-8 fill-white/20" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></div>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Verifying Admin Access</p>
        </div>
      </div>
    );
  }

  // If not logged in and not on login page, don't flash dashboard while redirecting
  if (!isAuthenticated && !isLoginPage) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0b1120]">
        <div className="text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">
          Redirecting to Admin Login...
        </div>
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return <DashboardShell>{children}</DashboardShell>;
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-screen bg-gray-50">{children}</div>;
  }

  return (
    <AuthProvider>
      <AuthenticatedContent>{children}</AuthenticatedContent>
    </AuthProvider>
  );
}
