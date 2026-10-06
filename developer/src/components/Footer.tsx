import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Footer: React.FC = () => {
  const { pathname } = useLocation();

  // Hide footer on dashboard pages
  if (pathname?.startsWith('/dashboard')) {
    return null;
  }

  return (
    <footer className="border-t border-slate-800/80 bg-[#060911] text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 text-xs font-black">
                ⚡
              </div>
              <span className="text-white font-black tracking-wider text-base">VIBEZ DEVELOPER</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enterprise developer ecosystem, real-time communication APIs, WebSockets, and integration tooling.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 mb-3">API Resources</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/docs" className="hover:text-emerald-400 transition-colors">REST API Reference</Link></li>
              <li><Link to="/sdks" className="hover:text-emerald-400 transition-colors">SDKs & Client Libraries</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 mb-3">SDKs & Guides</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/sdks" className="hover:text-emerald-400 transition-colors">Android & Kotlin SDK</Link></li>
              <li><Link to="/sdks" className="hover:text-emerald-400 transition-colors">TypeScript / Node.js</Link></li>
              <li><Link to="/sdks" className="hover:text-emerald-400 transition-colors">Python Client</Link></li>
              <li><Link to="/sdks" className="hover:text-emerald-400 transition-colors">Go Library</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 mb-3">Support & Legal</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/docs" className="hover:text-emerald-400 transition-colors">Developer Help Center</Link></li>
              <li><a href="mailto:support@vibez.chat" className="hover:text-emerald-400 transition-colors">Developer Support</a></li>
              <li><Link to="/docs" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/docs" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} VIBEZ Ecosystem. All rights reserved. • <span className="text-emerald-400 font-bold">Powered by PRIGID GROUP</span></p>
          <p className="font-mono text-[11px]">API Version: 2.4.0 • Node Environment</p>
        </div>
      </div>
    </footer>
  );
};
