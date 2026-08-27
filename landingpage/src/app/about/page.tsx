'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  ShieldCheck, 
  Users, 
  Download, 
  ArrowLeft, 
  Sparkles, 
  Heart, 
  Zap, 
  Globe, 
  Lock,
  Award,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { fetchPublicAppConfig, PublicAppConfig } from '../../lib/api';
import { useLanguage } from '../../lib/LanguageContext';

export default function AboutPage() {
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
    fetchPublicAppConfig().then(data => {
      if (data) setConfig(data);
    });
  }, []);

  // Determine active download target - No static fallback
  const hasDownloadUrl = Boolean(config.appDownloadUrl && config.appDownloadUrl.trim() !== '');
  const downloadLink = hasDownloadUrl ? config.appDownloadUrl : '';

  return (
    <div className="bg-[#0b141a] text-[#e9edef] selection:bg-[#00a884] selection:text-white">
      
      {/* Hero */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[130px] rounded-full -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111b21] border border-[#202c33] text-[#00a884] text-xs font-bold">
            <Sparkles className="h-4 w-4" />
            {t('about.badge')}
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            {t('about.title')} <br />
            <span className="bg-gradient-to-r from-[#00a884] via-[#25d366] to-[#53bdeb] bg-clip-text text-transparent">
              {t('about.titleGradient')}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#8696a0] leading-relaxed max-w-2xl mx-auto">
            {t('about.subtitle', { appName: config.appName })}
          </p>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-16 bg-[#111b21] border-y border-[#202c33]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl font-extrabold text-white">{t('about.standForTitle')}</h2>
            <p className="text-sm text-[#8696a0]">{t('about.standForSub')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] space-y-4">
              <div className="h-12 w-12 rounded-xl bg-[#00a884]/15 flex items-center justify-center text-[#00a884]">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">{t('about.val1Title')}</h3>
              <p className="text-sm text-[#8696a0] leading-relaxed">
                {t('about.val1Desc')}
              </p>
            </div>

            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] space-y-4">
              <div className="h-12 w-12 rounded-xl bg-[#53bdeb]/15 flex items-center justify-center text-[#53bdeb]">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">{t('about.val2Title')}</h3>
              <p className="text-sm text-[#8696a0] leading-relaxed">
                {t('about.val2Desc')}
              </p>
            </div>

            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] space-y-4">
              <div className="h-12 w-12 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">{t('about.val3Title')}</h3>
              <p className="text-sm text-[#8696a0] leading-relaxed">
                {t('about.val3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story & Evolution */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white">{t('about.storyTitle', { appName: config.appName })}</h2>
            <p className="text-base text-[#8696a0] leading-relaxed">
              {t('about.storyP1', { appName: config.appName })}
            </p>
            <p className="text-base text-[#8696a0] leading-relaxed">
              {t('about.storyP2', { appName: config.appName })}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-8 rounded-2xl bg-[#111b21] border border-[#202c33] text-center">
            <div>
              <div className="text-3xl font-black text-white">99.9%</div>
              <div className="text-xs text-[#8696a0] mt-1">{t('about.uptime')}</div>
            </div>
            <div>
              <div className="text-3xl font-black text-[#00a884]">0 Ads</div>
              <div className="text-xs text-[#8696a0] mt-1">{t('about.noAds')}</div>
            </div>
            <div>
              <div className="text-3xl font-black text-white">HD</div>
              <div className="text-xs text-[#8696a0] mt-1">{t('about.hdAudioVideo')}</div>
            </div>
            <div>
              <div className="text-3xl font-black text-[#53bdeb]">{config.appVersion || 'v1.0.0'}</div>
              <div className="text-xs text-[#8696a0] mt-1">{t('about.latestRelease')}</div>
            </div>
          </div>

          <div className="pt-8 text-center">
            <h3 className="text-xl font-bold text-white mb-4">{t('about.readyToChat')}</h3>
            {hasDownloadUrl ? (
              <a 
                href={downloadLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-download-pulse inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#00a884] hover:bg-[#008f72] text-white font-bold text-sm shadow-xl shadow-[#00a884]/20 transition-all hover:scale-105"
              >
                <Download className="h-4 w-4" />
                {t('hero.downloadBtn')}
              </a>
            ) : (
              <Link 
                href="/download"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] text-[#8696a0] hover:text-white font-bold text-sm transition-all"
              >
                <Clock className="h-4 w-4 text-amber-400" />
                {t('hero.noAppAvailable')}
              </Link>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
