'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  Search, 
  ChevronDown, 
  Sparkles, 
  Download, 
  HelpCircle, 
  ShieldCheck, 
  Smartphone, 
  Phone, 
  Lock, 
  Users, 
  ArrowRight,
  Mail,
  Clock
} from 'lucide-react';
import { fetchPublicAppConfig, PublicAppConfig } from '../../lib/api';
import { useLanguage, LanguageSelector } from '../../lib/LanguageContext';

interface FaqItem {
  q: string;
  a: string;
  category: 'general' | 'calling' | 'privacy' | 'troubleshooting' | 'media';
}

export default function FaqPage() {
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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openItems, setOpenItems] = useState<{ [key: number]: boolean }>({ 0: true });

  useEffect(() => {
    fetchPublicAppConfig().then(data => {
      if (data) setConfig(data);
    });
  }, []);

  // Determine active download target - No static fallback
  const hasDownloadUrl = Boolean(config.appDownloadUrl && config.appDownloadUrl.trim() !== '');
  const downloadLink = hasDownloadUrl ? config.appDownloadUrl : '';

  const faqs: FaqItem[] = [
    {
      category: 'general',
      q: t('faq.q1', { appName: config.appName }),
      a: t('faq.a1', { appName: config.appName })
    },
    {
      category: 'general',
      q: t('faq.q2', { appName: config.appName }),
      a: t('faq.a2', { appName: config.appName })
    },
    {
      category: 'general',
      q: t('faq.q3', { appName: config.appName }),
      a: t('faq.a3', { appName: config.appName })
    },
    {
      category: 'calling',
      q: t('faq.q4', { appName: config.appName }),
      a: t('faq.a4', { appName: config.appName })
    },
    {
      category: 'calling',
      q: t('faq.q5', { appName: config.appName }),
      a: t('faq.a5', { appName: config.appName })
    },
    {
      category: 'privacy',
      q: t('faq.q6', { appName: config.appName }),
      a: t('faq.a6', { appName: config.appName })
    },
    {
      category: 'privacy',
      q: t('faq.q7', { appName: config.appName }),
      a: t('faq.a7', { appName: config.appName })
    },
    {
      category: 'media',
      q: t('faq.q8', { appName: config.appName }),
      a: t('faq.a8', { appName: config.appName })
    },
    {
      category: 'media',
      q: t('faq.q9', { appName: config.appName }),
      a: t('faq.a9', { appName: config.appName })
    },
    {
      category: 'troubleshooting',
      q: t('faq.q10', { appName: config.appName }),
      a: t('faq.a10', { appName: config.appName })
    },
    {
      category: 'troubleshooting',
      q: t('faq.q11', { appName: config.appName }),
      a: t('faq.a11', { appName: config.appName })
    },
    {
      category: 'general',
      q: t('faq.q12', { appName: config.appName }),
      a: t('faq.a12', { appName: config.appName })
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleItem = (idx: number) => {
    setOpenItems(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <div className="bg-[#0b141a] text-[#e9edef] selection:bg-[#00a884] selection:text-white">
      
      {/* Hero with Search */}
      <section className="relative pt-16 pb-16 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[130px] rounded-full -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111b21] border border-[#202c33] text-[#00a884] text-xs font-bold">
            <HelpCircle className="h-4 w-4" />
            {t('faq.badge')}
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            {t('faq.title')} <br />
            <span className="bg-gradient-to-r from-[#00a884] via-[#25d366] to-[#53bdeb] bg-clip-text text-transparent">
              {t('faq.titleGradient')}
            </span>
          </h1>

          <p className="text-base text-[#8696a0] leading-relaxed max-w-xl mx-auto">
            {t('faq.subtitle', { appName: config.appName })}
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-xl mx-auto relative">
            <Search className="h-5 w-5 text-[#8696a0] absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder={t('faq.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#111b21] border-2 border-[#202c33] text-sm text-white placeholder-[#8696a0] focus:outline-none focus:border-[#00a884] transition-all shadow-xl"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'all', label: t('faq.allTopics') },
              { id: 'general', label: t('faq.catGeneral') },
              { id: 'calling', label: t('faq.catCalling') },
              { id: 'privacy', label: t('faq.catPrivacy') },
              { id: 'media', label: t('faq.catMedia') },
              { id: 'troubleshooting', label: t('faq.catTroubleshoot') }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#00a884] text-white shadow-md scale-105'
                    : 'bg-[#111b21] text-[#8696a0] hover:text-white border border-[#202c33]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Accordion FAQ List */}
      <section className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-16 bg-[#111b21] rounded-3xl border border-[#202c33] space-y-4">
            <HelpCircle className="h-12 w-12 text-[#8696a0] mx-auto" />
            <h3 className="text-lg font-bold text-white">{t('faq.noResultsTitle')}</h3>
            <p className="text-xs text-[#8696a0] max-w-sm mx-auto">
              {t('faq.noResultsDesc', { query: searchQuery })}
            </p>
            <Link 
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00a884] text-white text-xs font-bold hover:bg-[#008f72] transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              {t('faq.contactSupportBtn')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => {
              const isOpen = !!openItems[index];
              return (
                <div 
                  key={index}
                  className="bg-[#111b21] rounded-2xl border border-[#202c33] overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 focus:outline-none"
                  >
                    <span className="text-sm sm:text-base font-bold text-white flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-[#00a884] shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown className={`h-5 w-5 text-[#8696a0] shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#00a884]' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-[#8696a0] leading-relaxed border-t border-[#202c33]/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Still Have Questions Box */}
        <div className="mt-16 bg-gradient-to-tr from-[#111b21] to-[#0b141a] p-8 rounded-3xl border border-[#202c33] text-center space-y-4 shadow-xl">
          <h3 className="text-xl font-bold text-white">{t('faq.stillHaveQuestions')}</h3>
          <p className="text-xs sm:text-sm text-[#8696a0] max-w-md mx-auto">
            {t('faq.supportSub')}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#00a884] hover:bg-[#008f72] text-white text-xs font-bold shadow-lg shadow-[#00a884]/20 transition-all hover:scale-105"
            >
              <Mail className="h-4 w-4" />
              {t('faq.sendSupportBtn')}
            </Link>
            <a 
              href={`mailto:${config.contactEmail || 'support@vibez.chat'}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#111b21] hover:bg-[#202c33] border border-[#202c33] text-white text-xs font-bold transition-all"
            >
              {t('faq.emailSupportBtn')} {config.contactEmail || 'support@vibez.chat'}
            </a>
          </div>
        </div>

      </section>

    </div>
  );
}
