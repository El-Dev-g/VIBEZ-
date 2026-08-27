'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { fetchPublicAppConfig, PublicAppConfig } from '../lib/api';

export default function Footer() {
  const { t } = useLanguage();
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
    <footer className="bg-[#0b141a] border-t border-[#202c33] py-12 text-xs text-[#8696a0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#008069] to-[#25d366] p-0.5 flex items-center justify-center">
              <div className="h-full w-full rounded-[6px] bg-[#0b141a] flex items-center justify-center">
                <Zap className="h-4 w-4 text-[#008069] fill-[#008069]/20" />
              </div>
            </div>
            <span className="text-base font-black tracking-tight text-white">{config.appName}</span>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6 text-xs font-medium">
            <Link href="/features" className="hover:text-white transition-colors">{t('footer.features')}</Link>
            <Link href="/faq" className="hover:text-white transition-colors">{t('footer.faq')}</Link>
            <Link href="/security" className="hover:text-white transition-colors">{t('footer.security')}</Link>
            <Link href="/download" className="hover:text-white transition-colors">{t('footer.download')}</Link>
            <Link href="/about" className="hover:text-white transition-colors">{t('footer.about')}</Link>
            <Link href="/contact" className="hover:text-white transition-colors">{t('footer.contact')}</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">{t('footer.privacy')}</Link>
            <Link href="/terms" className="hover:text-white transition-colors">{t('footer.terms')}</Link>
          </div>
        </div>

        <div className="border-t border-[#202c33] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p>&copy; {new Date().getFullYear()} {config.appName}. {t('footer.rights')}</p>
          <div className="flex items-center justify-center gap-4">
            <p className="text-[#8696a0]">{t('footer.tagline')}</p>
          </div>
        </div>

      </div>
    </footer>
  );
}
