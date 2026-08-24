'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import { usePathname } from 'next/navigation';

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Mobile Menu Toggle */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
          <h1 className="text-xl font-bold text-emerald-600">VIBEZ</h1>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 focus:outline-none"
          >
            <span className="text-2xl">☰</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
