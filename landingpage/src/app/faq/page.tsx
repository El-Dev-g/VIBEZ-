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
      q: `Is ${config.appName} free to download and use?`,
      a: `Yes! ${config.appName} is completely free. It uses your device's internet connection (Wi-Fi or cellular data) to send messages and place calls. Standard data rates from your mobile carrier may apply if using cellular data without an unlimited plan.`
    },
    {
      category: 'general',
      q: `How do I install ${config.appName} on my Android device?`,
      a: `Tap the "Download APK" button on our website. Once downloaded, tap the APK file in your Downloads folder. If prompted, enable "Install from Unknown Sources" or "Allow from this source" in your Android Settings, and tap "Install". The app will be ready in seconds!`
    },
    {
      category: 'general',
      q: `Which Android versions and devices are supported?`,
      a: `${config.appName} runs on all Android devices running Android 8.0 (Oreo) and above. It is fully optimized for smartphones, tablets, foldables, and Chromebooks running the Android runtime.`
    },
    {
      category: 'calling',
      q: 'Can I make international voice and video calls for free?',
      a: `Yes! As long as both you and the person you are calling have an active internet connection, international voice and video calls on ${config.appName} carry zero long-distance or international calling fees.`
    },
    {
      category: 'calling',
      q: 'Does calling consume a lot of mobile data?',
      a: `${config.appName} uses adaptive Opus audio and lightweight H.264/VP8 video codecs designed specifically to deliver crystal-clear quality even on constrained 2G/3G/4G connections while keeping data usage minimal.`
    },
    {
      category: 'privacy',
      q: `How does ${config.appName} protect my messages and privacy?`,
      a: `We believe in total privacy. Your chats are strictly between you and your recipients. We never sell your personal data, profile info, or conversations to advertisers or third-party data brokers.`
    },
    {
      category: 'privacy',
      q: 'How does the Biometric App Lock work?',
      a: `In ${config.appName} Settings ➔ Privacy, you can enable "Fingerprint / Biometric Lock". When active, you will be prompted to unlock the app using your device's fingerprint sensor or facial recognition whenever you open it.`
    },
    {
      category: 'media',
      q: 'What is the maximum file size for sharing photos and videos?',
      a: `You can share high-definition photos, video clips, and audio notes. Photos are kept in high resolution without heavy compression artifacts so your memories look vibrant.`
    },
    {
      category: 'media',
      q: 'How long do status updates stay visible?',
      a: `Status stories (text updates, photos, and short videos) automatically disappear after 24 hours. You can see who viewed your status and delete any update at any time.`
    },
    {
      category: 'troubleshooting',
      q: 'I am not receiving notifications when new messages arrive. How do I fix this?',
      a: `On Android, battery optimization settings can sometimes put background apps to sleep. Go to Android Settings ➔ Apps ➔ ${config.appName} ➔ Battery ➔ Select "Unrestricted". Also ensure "Do Not Disturb" is turned off.`
    },
    {
      category: 'troubleshooting',
      q: 'How do I backup or transfer my chats to a new phone?',
      a: `Your profile and conversations are tied to your registered phone number. When you log in on a new device and complete the SMS verification, your chats and contact connections will sync over seamlessly.`
    },
    {
      category: 'general',
      q: 'How do I create and manage group chats?',
      a: `Tap the "New Chat" icon in the app and select "New Group". Choose contacts from your address book, assign a group name and photo. As the group creator, you can promote other admins, edit group info, or invite members with a direct link.`
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
    <div className="min-h-screen bg-[#0b141a] text-[#e9edef] selection:bg-[#00a884] selection:text-white">
      
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#0b141a]/85 border-b border-[#202c33]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#00a884] to-[#53bdeb] p-0.5 flex items-center justify-center">
                <div className="h-full w-full rounded-[8px] bg-[#0b141a] flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-[#00a884]" />
                </div>
              </div>
              <span className="text-xl font-black tracking-tight text-white">{config.appName}</span>
            </Link>

            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/" className="text-[#8696a0] hover:text-white transition-colors">{t('nav.home') || 'Home'}</Link>
              <Link href="/features" className="text-[#8696a0] hover:text-white transition-colors">{t('nav.features')}</Link>
              <Link href="/faq" className="text-[#00a884] font-bold">{t('nav.faq')}</Link>
              <Link href="/security" className="text-[#8696a0] hover:text-white transition-colors">{t('nav.security')}</Link>
              <Link href="/about" className="text-[#8696a0] hover:text-white transition-colors">{t('nav.about')}</Link>
              <Link href="/contact" className="text-[#8696a0] hover:text-white transition-colors">{t('nav.contact')}</Link>
            </div>

            <div className="flex items-center gap-3">
              <LanguageSelector />
              {hasDownloadUrl ? (
                <a 
                  href={downloadLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-download-pulse flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-[#00a884] text-white transition-all shadow-md active:scale-95"
                >
                  <Download className="h-3.5 w-3.5" />
                  {t('nav.downloadApk')}
                </a>
              ) : (
                <Link 
                  href="/download"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#202c33] text-[#8696a0] hover:text-white border border-[#2a3942] transition-colors"
                >
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  {t('hero.noAppAvailable') || 'No App Available'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero with Search */}
      <section className="relative pt-16 pb-16 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[130px] rounded-full -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111b21] border border-[#202c33] text-[#00a884] text-xs font-bold">
            <HelpCircle className="h-4 w-4" />
            Help & Knowledge Base
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Frequently Asked <br />
            <span className="bg-gradient-to-r from-[#00a884] via-[#25d366] to-[#53bdeb] bg-clip-text text-transparent">
              Questions & Answers
            </span>
          </h1>

          <p className="text-base text-[#8696a0] leading-relaxed max-w-xl mx-auto">
            Find immediate answers regarding {config.appName} installation, calls, messaging, security, and account settings.
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-xl mx-auto relative">
            <Search className="h-5 w-5 text-[#8696a0] absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search questions (e.g. video calls, APK install, privacy)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#111b21] border-2 border-[#202c33] text-sm text-white placeholder-[#8696a0] focus:outline-none focus:border-[#00a884] transition-all shadow-xl"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'all', label: 'All Topics' },
              { id: 'general', label: 'General & Setup' },
              { id: 'calling', label: 'Calls & Voice' },
              { id: 'privacy', label: 'Privacy & Security' },
              { id: 'media', label: 'Media & Status' },
              { id: 'troubleshooting', label: 'Troubleshooting' }
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
            <h3 className="text-lg font-bold text-white">No Matching Questions Found</h3>
            <p className="text-xs text-[#8696a0] max-w-sm mx-auto">
              We couldn't find an answer matching "{searchQuery}". Reach out to our support team directly for assistance!
            </p>
            <Link 
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00a884] text-white text-xs font-bold hover:bg-[#008f72] transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              Contact Support
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
          <h3 className="text-xl font-bold text-white">Still have questions?</h3>
          <p className="text-xs sm:text-sm text-[#8696a0] max-w-md mx-auto">
            Our support engineers are available to help you with setup, bug reports, or feature recommendations.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#00a884] hover:bg-[#008f72] text-white text-xs font-bold shadow-lg shadow-[#00a884]/20 transition-all hover:scale-105"
            >
              <Mail className="h-4 w-4" />
              Send a Support Message
            </Link>
            <a 
              href={`mailto:${config.contactEmail || 'support@vibez.chat'}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#111b21] hover:bg-[#202c33] border border-[#202c33] text-white text-xs font-bold transition-all"
            >
              Email {config.contactEmail || 'support@vibez.chat'}
            </a>
          </div>
        </div>

      </section>

      {/* Footer */}
      <footer className="bg-[#0b141a] border-t border-[#202c33] py-10 text-xs text-[#8696a0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} {config.appName}. {t('footer.rights')}</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/" className="hover:text-white">{t('nav.home') || 'Home'}</Link>
            <Link href="/features" className="hover:text-white">{t('footer.features')}</Link>
            <Link href="/faq" className="hover:text-white">{t('footer.faq')}</Link>
            <Link href="/security" className="hover:text-white">{t('footer.security')}</Link>
            <Link href="/about" className="hover:text-white">{t('footer.about')}</Link>
            <Link href="/contact" className="hover:text-white">{t('footer.contact')}</Link>
            <Link href="/privacy" className="hover:text-white">{t('footer.privacy')}</Link>
            <Link href="/terms" className="hover:text-white">{t('footer.terms')}</Link>
            <LanguageSelector />
          </div>
        </div>
      </footer>

    </div>
  );
}
