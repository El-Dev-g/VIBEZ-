'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  Download, 
  Menu, 
  X
} from 'lucide-react';
import { useLanguage, LanguageSelector } from '../lib/LanguageContext';
import { fetchPublicAppConfig, PublicAppConfig } from '../lib/api';

export default function Header() {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [config, setConfig] = useState<PublicAppConfig>({
    appName: 'VIBEZ',
    appVersion: '1.0.0',
    appDownloadUrl: '',
    contactEmail: 'support@vibez.chat',
    contactPhone: '+1 (800) 555-0199',
    supportAddress: 'San Francisco, CA, USA',
    maintenanceMode: false,
    allowNewRegistrations: true
  });

  useEffect(() => {
    const loadConfig = async () => {
      const data = await fetchPublicAppConfig();
      setConfig(data);
    };
    loadConfig();
  }, []);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#0b141a]/85 border-b border-[#202c33] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#00a884] to-[#53bdeb] p-0.5 shadow-lg shadow-[#00a884]/15 flex items-center justify-center">
              <div className="h-full w-full rounded-[10px] bg-[#0b141a] flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-[#00a884]" />
              </div>
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              {config.appName}
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/features" className="text-[#8696a0] hover:text-[#00a884] transition-colors">{t('nav.features')}</Link>
            <Link href="/faq" className="text-[#8696a0] hover:text-[#00a884] transition-colors">{t('nav.faq')}</Link>
            <Link href="/security" className="text-[#8696a0] hover:text-[#00a884] transition-colors">{t('nav.security')}</Link>
            <Link href="/download" className="text-[#8696a0] hover:text-[#00a884] transition-colors">{t('nav.download')}</Link>
            <Link href="/about" className="text-[#8696a0] hover:text-[#00a884] transition-colors">{t('nav.about')}</Link>
            <Link href="/contact" className="text-[#8696a0] hover:text-[#00a884] transition-colors">{t('nav.contact')}</Link>
          </div>

          {/* Call to Action Button & Language Selector */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSelector />
            <Link 
              href="/download"
              className="btn-download-pulse flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-[#00a884] text-white transition-all shadow-lg shadow-[#00a884]/20 active:scale-95"
            >
              <Download className="h-4 w-4" />
              {t('nav.downloadApk')} {config.appVersion ? `v${config.appVersion}` : ''}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSelector />
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-[#202c33] text-[#8696a0] hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#111b21] border-b border-[#202c33] py-4 px-4 space-y-2 animate-fade-in">
          <Link href="/features" className="block py-2 text-[#8696a0] hover:text-[#00a884] transition-colors" onClick={() => setMobileMenuOpen(false)}>{t('nav.features')}</Link>
          <Link href="/faq" className="block py-2 text-[#8696a0] hover:text-[#00a884] transition-colors" onClick={() => setMobileMenuOpen(false)}>{t('nav.faq')}</Link>
          <Link href="/security" className="block py-2 text-[#8696a0] hover:text-[#00a884] transition-colors" onClick={() => setMobileMenuOpen(false)}>{t('nav.security')}</Link>
          <Link href="/download" className="block py-2 text-[#8696a0] hover:text-[#00a884] transition-colors" onClick={() => setMobileMenuOpen(false)}>{t('nav.download')}</Link>
          <Link href="/about" className="block py-2 text-[#8696a0] hover:text-[#00a884] transition-colors" onClick={() => setMobileMenuOpen(false)}>{t('nav.about')}</Link>
          <Link href="/contact" className="block py-2 text-[#8696a0] hover:text-[#00a884] transition-colors" onClick={() => setMobileMenuOpen(false)}>{t('nav.contact')}</Link>
          <div className="pt-2 border-t border-[#202c33]">
            <Link 
              href="/download"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-[#00a884] text-white font-bold transition-all shadow-lg shadow-[#00a884]/20"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Download className="h-4 w-4" />
              {t('nav.downloadApk')}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
