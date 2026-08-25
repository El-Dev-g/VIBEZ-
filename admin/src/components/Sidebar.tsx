'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Users', href: '/users', icon: '👥' },
  { name: 'Communities & Groups', href: '/communities', icon: '🌐' },
  { name: 'Badges & Revenue', href: '/badges', icon: '✅' },
  { name: 'Broadcasts & Alerts', href: '/broadcasts', icon: '📢' },
  { name: 'Calls & Analytics', href: '/analytics', icon: '📈' },
  { name: 'Media & Storage', href: '/storage', icon: '💾' },
  { name: 'Reports', href: '/reports', icon: '🚩' },
  { name: 'Audit Logs', href: '/logs', icon: '📝' },
  { name: 'System Settings', href: '/settings', icon: '⚙️' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-gray-900 text-white transition-transform duration-300 lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-20 items-center justify-between px-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-emerald-500">VIBEZ Admin</h1>
          <button 
            onClick={onClose}
            className="rounded-md p-1 hover:bg-gray-800 lg:hidden"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-800 text-emerald-400'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold">
              AD
            </div>
            <div>
              <p className="text-sm font-medium">Administrator</p>
              <p className="text-xs text-gray-400">admin@vibez.app</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
