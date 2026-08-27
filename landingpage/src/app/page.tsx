'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  ShieldCheck, 
  Users, 
  Smartphone, 
  Download, 
  Lock, 
  ArrowRight, 
  CheckCheck, 
  Menu, 
  X,
  Phone,
  Video,
  Mic,
  Camera,
  Smile,
  Sparkles,
  ChevronDown,
  Clock,
  Heart,
  Moon,
  Image as ImageIcon,
  Check,
  ExternalLink
} from 'lucide-react';
import { fetchPublicAppConfig, PublicAppConfig } from '../lib/api';
import { useLanguage, LanguageSelector } from '../lib/LanguageContext';

export default function LandingPage() {
  const { t, dict, language } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'calls' | 'status' | 'privacy'>('chats');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Dynamic system configuration fetched from Admin Panel / Backend
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

  // Dynamic typing animation in mock chat
  const [typedText, setTypedText] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);
  const fullText = language === 'es' ? '¿Seguimos en pie para la videollamada hoy?' : 'Are we still on for the video call tonight?';

  useEffect(() => {
    fetchPublicAppConfig().then(data => {
      if (data) setConfig(data);
    });
  }, []);

  useEffect(() => {
    setTypedText('');
    setTypingIndex(0);
  }, [language]);

  useEffect(() => {
    if (typingIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(prev => prev + fullText[typingIndex]);
        setTypingIndex(prev => prev + 1);
      }, 45);
      return () => clearTimeout(timeout);
    } else {
      const resetTimeout = setTimeout(() => {
        setTypedText('');
        setTypingIndex(0);
      }, 4000);
      return () => clearTimeout(resetTimeout);
    }
  }, [typingIndex, fullText]);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Determine active download target - No static fallback, strictly respect admin configuration
  const hasDownloadUrl = Boolean(config.appDownloadUrl && config.appDownloadUrl.trim() !== '');
  const downloadLink = hasDownloadUrl ? config.appDownloadUrl : '';

  return (
    <div className="min-h-screen bg-[#0b141a] text-[#e9edef] selection:bg-[#00a884] selection:text-white">
      
      {/* 1. Navigation Header */}
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
            <Link 
              href="/features" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-[#8696a0] hover:bg-[#202c33] hover:text-white transition-all"
            >
              {t('nav.features')}
            </Link>
            <Link 
              href="/faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-[#8696a0] hover:bg-[#202c33] hover:text-white transition-all"
            >
              {t('nav.faq')}
            </Link>
            <Link 
              href="/security" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-[#8696a0] hover:bg-[#202c33] hover:text-white transition-all"
            >
              {t('nav.security')}
            </Link>
            <Link 
              href="/download" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-[#00a884] hover:bg-[#202c33] font-bold transition-all"
            >
              {t('nav.download')}
            </Link>
            <Link 
              href="/about" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-[#8696a0] hover:bg-[#202c33] hover:text-white transition-all"
            >
              {t('nav.about')}
            </Link>
            <Link 
              href="/contact" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-[#8696a0] hover:bg-[#202c33] hover:text-white transition-all"
            >
              {t('nav.contact')}
            </Link>
            <Link 
              href="/privacy" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-[#8696a0] hover:bg-[#202c33] hover:text-white transition-all"
            >
              {t('nav.privacy')}
            </Link>
            <Link 
              href="/terms" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-[#8696a0] hover:bg-[#202c33] hover:text-white transition-all"
            >
              {t('nav.terms')}
            </Link>
            <div className="pt-3 border-t border-[#202c33]">
              <Link 
                href="/download"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-download-pulse w-full text-center flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-bold bg-[#00a884] text-white transition-all shadow-lg shadow-[#00a884]/20 active:scale-95"
              >
                <Download className="h-4 w-4" />
                {t('nav.downloadApk')} {config.appVersion ? `v${config.appVersion}` : ''}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
        {/* Glow ambient background effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[140px] rounded-full -z-10" />
        <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-[#53bdeb]/10 blur-[120px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Heading & Value Proposition */}
            <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111b21] border border-[#202c33] text-[#00a884] text-xs font-bold tracking-wide">
                <Sparkles className="h-4 w-4" />
                Secure Android Messenger {config.appVersion ? `(v${config.appVersion})` : ''}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]">
                Simple. Reliable. <br />
                <span className="bg-gradient-to-r from-[#00a884] via-[#25d366] to-[#53bdeb] bg-clip-text text-transparent">
                  Private Conversations.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#8696a0] max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Connect seamlessly with the people who matter most. Enjoy lightning-fast messaging, crystal-clear voice & video calls, full-quality media sharing, and expressive status updates.
              </p>

              {/* Action Buttons with dynamic admin APK download link */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                {hasDownloadUrl ? (
                  <a 
                    href={downloadLink} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-download-pulse w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#00a884] text-white font-bold text-base shadow-xl shadow-[#00a884]/25 transition-all active:scale-95"
                  >
                    <Download className="h-5 w-5" />
                    {t('hero.downloadBtn') || 'Download APK for Android'}
                  </a>
                ) : (
                  <Link 
                    href="/download"
                    className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] text-[#8696a0] hover:text-white font-bold text-base transition-all"
                  >
                    <Clock className="h-5 w-5 text-amber-400" />
                    {t('hero.noAppAvailable') || 'No App Available'}
                  </Link>
                )}
                <a 
                  href="#experience" 
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-[#111b21] hover:bg-[#202c33] border border-[#202c33] text-white font-semibold text-base transition-all hover:-translate-y-0.5"
                >
                  See How It Looks
                  <ArrowRight className="h-4 w-4 text-[#8696a0]" />
                </a>
              </div>

              {/* Key Features Quick Scannable Row */}
              <div className="pt-6 grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0 text-center lg:text-left border-t border-[#202c33]">
                <div>
                  <div className="text-2xl font-extrabold text-white">Free</div>
                  <div className="text-xs text-[#8696a0] mt-0.5">Calls & Messages</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-white">HD</div>
                  <div className="text-xs text-[#8696a0] mt-0.5">Photos & Videos</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-white">100%</div>
                  <div className="text-xs text-[#8696a0] mt-0.5">Private & Secure</div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Smartphone Device Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-[315px] h-[630px] rounded-[48px] bg-black p-3.5 border-[6px] border-[#202c33] shadow-2xl shadow-[#00a884]/15 overflow-hidden">
                
                {/* Speaker Grill / Camera Island */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-20 flex items-center justify-center">
                  <div className="w-12 h-1.5 bg-[#202c33] rounded-full" />
                </div>

                {/* Simulated Screen Interface */}
                <div className="h-full w-full bg-[#0b141a] rounded-[36px] flex flex-col justify-between overflow-hidden relative">
                  
                  {/* Chat Top Header */}
                  <div className="bg-[#111b21] pt-8 pb-3 px-3.5 border-b border-[#202c33] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#00a884] to-emerald-400 flex items-center justify-center font-bold text-sm text-white">
                          S
                        </div>
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#00a884] border-2 border-[#111b21]" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white leading-tight">Sarah Jenkins</div>
                        <div className="text-[10px] text-[#00a884]">online</div>
                      </div>
                    </div>
                    
                    {/* Action buttons on header */}
                    <div className="flex items-center gap-3 text-[#8696a0]">
                      <button className="p-1 hover:text-white transition-colors" aria-label="Video call">
                        <Video className="h-4 w-4" />
                      </button>
                      <button className="p-1 hover:text-white transition-colors" aria-label="Voice call">
                        <Phone className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Chat Bubble Scroll Area */}
                  <div className="flex-1 p-3.5 space-y-3 overflow-y-auto text-xs bg-[radial-gradient(#111b21_1px,transparent_1px)] [background-size:16px_16px]">
                    
                    {/* Privacy Tag */}
                    <div className="text-center my-1">
                      <span className="inline-flex items-center gap-1 bg-[#111b21] text-[#8696a0] text-[9px] px-2.5 py-1 rounded-full border border-[#202c33]">
                        <Lock className="h-2.5 w-2.5 text-[#00a884]" />
                        Messages are private and secured
                      </span>
                    </div>

                    {/* Received Message */}
                    <div className="flex justify-start max-w-[85%]">
                      <div className="bg-[#111b21] text-[#e9edef] p-3 rounded-2xl rounded-tl-sm border border-[#202c33] space-y-1 shadow-sm">
                        <p>Hey! Check out this snapshot from the trip today 🌴</p>
                        <div className="h-24 w-full bg-gradient-to-tr from-emerald-800/40 to-teal-900/60 rounded-lg flex items-center justify-center my-1 border border-[#202c33]">
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-300 font-medium">
                            <ImageIcon className="h-3.5 w-3.5" />
                            Sunset_Coast.jpg (HD)
                          </div>
                        </div>
                        <span className="block text-[9px] text-right text-[#8696a0]">4:20 PM</span>
                      </div>
                    </div>

                    {/* Sent Message */}
                    <div className="flex justify-end ml-auto max-w-[85%]">
                      <div className="bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-sm space-y-1 shadow-sm">
                        <p>That looks incredible! 😍 Loved the photo quality!</p>
                        <div className="flex items-center justify-end gap-1 text-[9px] text-[#8696a0]">
                          <span className="text-white/70">4:21 PM</span>
                          <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                        </div>
                      </div>
                    </div>

                    {/* Live typing message demo */}
                    {typedText && (
                      <div className="flex justify-start max-w-[85%] animate-fade-in">
                        <div className="bg-[#111b21] text-[#e9edef] p-3 rounded-2xl rounded-tl-sm border border-[#202c33] space-y-1 shadow-sm">
                          <p className="border-r-2 border-[#00a884] pr-1">{typedText}</p>
                          <span className="block text-[8px] text-right text-[#8696a0]">Typing...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Input Bottom Bar */}
                  <div className="bg-[#111b21] p-2.5 border-t border-[#202c33] flex items-center gap-2">
                    <button className="text-[#8696a0] hover:text-white" aria-label="Add emoji">
                      <Smile className="h-5 w-5" />
                    </button>
                    <div className="flex-1 bg-[#2a3942] rounded-full px-3.5 py-1.5 text-xs text-[#8696a0] flex items-center justify-between">
                      <span>Type a message...</span>
                      <button className="text-[#8696a0] hover:text-white" aria-label="Attach file">
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                    <button className="h-8 w-8 rounded-full bg-[#00a884] flex items-center justify-center text-white shrink-0 hover:scale-105 transition-transform" aria-label="Send audio">
                      <Mic className="h-4 w-4" />
                    </button>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Core User Features Grid */}
      <section id="features" className="py-20 bg-[#111b21] border-y border-[#202c33]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Everything You Need in a Chat App
            </h2>
            <p className="text-base text-[#8696a0]">
              Crafted with care to give you the most fluid, enjoyable, and private communication experience on your phone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1: Private Chats */}
            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] hover:border-[#00a884]/50 transition-all group">
              <div className="h-12 w-12 rounded-xl bg-[#00a884]/15 flex items-center justify-center text-[#00a884] mb-6 group-hover:scale-110 transition-transform">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Private & Confidential</h3>
              <p className="text-sm text-[#8696a0] leading-relaxed">
                Your personal chats and calls stay strictly between you and the person you're communicating with.
              </p>
            </div>

            {/* Feature 2: Voice & Video Calls */}
            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] hover:border-[#00a884]/50 transition-all group">
              <div className="h-12 w-12 rounded-xl bg-[#00a884]/15 flex items-center justify-center text-[#00a884] mb-6 group-hover:scale-110 transition-transform">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Crystal-Clear Calls</h3>
              <p className="text-sm text-[#8696a0] leading-relaxed">
                Make high-quality 1-on-1 voice and video calls with friends and family worldwide for free.
              </p>
            </div>

            {/* Feature 3: Group Chats */}
            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] hover:border-[#00a884]/50 transition-all group">
              <div className="h-12 w-12 rounded-xl bg-[#00a884]/15 flex items-center justify-center text-[#00a884] mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Stay Connected in Groups</h3>
              <p className="text-sm text-[#8696a0] leading-relaxed">
                Share messages, photos, and videos across family circles, project teams, and friend circles with ease.
              </p>
            </div>

            {/* Feature 4: Full HD Media */}
            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] hover:border-[#00a884]/50 transition-all group">
              <div className="h-12 w-12 rounded-xl bg-[#00a884]/15 flex items-center justify-center text-[#00a884] mb-6 group-hover:scale-110 transition-transform">
                <Camera className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">High Quality Photos & Video</h3>
              <p className="text-sm text-[#8696a0] leading-relaxed">
                Send images and videos without heavy compression so memories stay crisp and vibrant.
              </p>
            </div>

            {/* Feature 5: Status Stories */}
            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] hover:border-[#00a884]/50 transition-all group">
              <div className="h-12 w-12 rounded-xl bg-[#00a884]/15 flex items-center justify-center text-[#00a884] mb-6 group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">24-Hour Status Updates</h3>
              <p className="text-sm text-[#8696a0] leading-relaxed">
                Share text, photo, and video moments that your contacts can see and that automatically disappear after 24 hours.
              </p>
            </div>

            {/* Feature 6: Eye-Comfort Dark Mode */}
            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] hover:border-[#00a884]/50 transition-all group">
              <div className="h-12 w-12 rounded-xl bg-[#00a884]/15 flex items-center justify-center text-[#00a884] mb-6 group-hover:scale-110 transition-transform">
                <Moon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Comfortable Dark Mode</h3>
              <p className="text-sm text-[#8696a0] leading-relaxed">
                Sleek dark theme optimized for eye comfort at night and battery conservation on OLED screens.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Interactive User Experience Showcase */}
      <section id="experience" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
            <h2 className="text-3xl font-extrabold text-white">Experience {config.appName} on Your Phone</h2>
            <p className="text-sm text-[#8696a0]">
              Select a view below to preview the intuitive screens built for everyday use.
            </p>

            {/* Tabs for End Users */}
            <div className="inline-flex bg-[#111b21] p-1.5 rounded-2xl border border-[#202c33] gap-1 flex-wrap justify-center">
              <button 
                onClick={() => setActiveTab('chats')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'chats' ? 'bg-[#00a884] text-white shadow-md' : 'text-[#8696a0] hover:text-white'}`}
              >
                <MessageSquare className="h-4 w-4" />
                Chats & Groups
              </button>
              <button 
                onClick={() => setActiveTab('calls')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'calls' ? 'bg-[#00a884] text-white shadow-md' : 'text-[#8696a0] hover:text-white'}`}
              >
                <Phone className="h-4 w-4" />
                Voice & Video
              </button>
              <button 
                onClick={() => setActiveTab('status')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'status' ? 'bg-[#00a884] text-white shadow-md' : 'text-[#8696a0] hover:text-white'}`}
              >
                <Clock className="h-4 w-4" />
                Status Stories
              </button>
              <button 
                onClick={() => setActiveTab('privacy')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'privacy' ? 'bg-[#00a884] text-white shadow-md' : 'text-[#8696a0] hover:text-white'}`}
              >
                <ShieldCheck className="h-4 w-4" />
                Privacy & Lock
              </button>
            </div>
          </div>

          {/* Interactive Card Presentation */}
          <div className="bg-[#111b21] rounded-3xl border border-[#202c33] p-6 lg:p-12 shadow-2xl relative overflow-hidden">
            
            {/* Tab 1: Chats */}
            {activeTab === 'chats' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fade-in">
                <div className="lg:col-span-6 space-y-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00a884] bg-[#00a884]/15 px-3.5 py-1.5 rounded-full">
                    Instant Messaging
                  </span>
                  <h3 className="text-2xl lg:text-3xl font-extrabold text-white">
                    Conversations Made Effortless
                  </h3>
                  <p className="text-[#8696a0] text-sm leading-relaxed">
                    Chat one-on-one or organize conversations in clean group channels. Enjoy instant message delivery, real-time typing indicators, read receipts, and expressive emoji reactions.
                  </p>
                  
                  <div className="space-y-3.5">
                    {[
                      "Instant delivery ticks (Sent, Delivered, Read)",
                      "Voice notes with interactive audio seek waveforms",
                      "Rich photo & video sharing with captions",
                      "Quick pin & archive to organize important conversations"
                    ].map((feat, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-5 w-5 rounded-full bg-[#00a884]/20 flex items-center justify-center text-[#00a884]">
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-sm text-[#e9edef]">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[#0b141a] rounded-2xl p-5 border border-[#202c33] space-y-3">
                  <div className="text-xs font-bold text-white pb-3 border-b border-[#202c33] flex justify-between items-center">
                    <span>Recent Chats</span>
                    <span className="text-[#00a884] text-[11px] font-semibold">New Chat +</span>
                  </div>

                  {[
                    { name: "Family Circle 🏡", msg: "Mom: Dinner is at 7 tonight!", time: "5:12 PM", unread: 2, avatar: "F" },
                    { name: "Sarah Jenkins", msg: "Loved the photo quality!", time: "4:21 PM", unread: 0, avatar: "S" },
                    { name: "David K.", msg: "Let's catch up tomorrow morning", time: "Yesterday", unread: 0, avatar: "D" },
                  ].map((chat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#111b21] transition-colors border border-transparent hover:border-[#202c33]">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#00a884] to-emerald-500 flex items-center justify-center font-bold text-white text-sm">
                          {chat.avatar}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{chat.name}</div>
                          <div className="text-xs text-[#8696a0]">{chat.msg}</div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-[10px] text-[#8696a0]">{chat.time}</div>
                        {chat.unread > 0 && (
                          <span className="inline-block bg-[#00a884] text-white font-bold text-[10px] h-4 min-w-4 px-1 rounded-full text-center">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Calls */}
            {activeTab === 'calls' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fade-in">
                <div className="lg:col-span-6 space-y-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#53bdeb] bg-[#53bdeb]/15 px-3.5 py-1.5 rounded-full">
                    HD Voice & Video
                  </span>
                  <h3 className="text-2xl lg:text-3xl font-extrabold text-white">
                    Feel Like You're in the Same Room
                  </h3>
                  <p className="text-[#8696a0] text-sm leading-relaxed">
                    Experience crystal-clear audio and sharp video calls with minimal data usage. Whether catching up with family or calling across the globe, {config.appName} connects you reliably.
                  </p>
                  
                  <div className="space-y-3.5">
                    {[
                      "Optimized for low-bandwidth networks (2G, 3G, 4G, 5G & Wi-Fi)",
                      "Seamless camera flipping and microphone muting",
                      "Call history log with quick redial shortcuts",
                      "Zero cost international calling over the internet"
                    ].map((feat, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-5 w-5 rounded-full bg-[#53bdeb]/20 flex items-center justify-center text-[#53bdeb]">
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-sm text-[#e9edef]">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[#0b141a] rounded-2xl p-6 border border-[#202c33] text-center space-y-5">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-[#00a884] to-[#53bdeb] p-0.5 mx-auto animate-pulse">
                    <div className="h-full w-full rounded-full bg-[#111b21] flex items-center justify-center text-xl font-bold text-white">
                      SJ
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Sarah Jenkins</h4>
                    <p className="text-xs text-[#00a884] font-medium mt-0.5">Calling... (HD Audio)</p>
                  </div>

                  <div className="flex items-center justify-center gap-6 pt-4">
                    <div className="h-12 w-12 rounded-full bg-[#202c33] flex items-center justify-center text-[#8696a0]">
                      <Mic className="h-5 w-5" />
                    </div>
                    <div className="h-14 w-14 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                      <Phone className="h-6 w-6 rotate-[135deg]" />
                    </div>
                    <div className="h-12 w-12 rounded-full bg-[#202c33] flex items-center justify-center text-[#8696a0]">
                      <Video className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Status */}
            {activeTab === 'status' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fade-in">
                <div className="lg:col-span-6 space-y-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00a884] bg-[#00a884]/15 px-3.5 py-1.5 rounded-full">
                    Moments & Stories
                  </span>
                  <h3 className="text-2xl lg:text-3xl font-extrabold text-white">
                    Share Moments with Status Updates
                  </h3>
                  <p className="text-[#8696a0] text-sm leading-relaxed">
                    Share what's on your mind using quick status stories. Post text updates, photos, or short clips that disappear automatically after 24 hours.
                  </p>
                  
                  <div className="space-y-3.5">
                    {[
                      "24-hour disappearing updates for privacy and simplicity",
                      "View counters so you know which contacts saw your update",
                      "Custom privacy options to select who can view each status",
                      "Reply directly to any friend's status in a private chat"
                    ].map((feat, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-5 w-5 rounded-full bg-[#00a884]/20 flex items-center justify-center text-[#00a884]">
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-sm text-[#e9edef]">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[#0b141a] rounded-2xl p-5 border border-[#202c33] space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-[#202c33]">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-[#202c33] flex items-center justify-center font-bold text-white text-sm">
                        You
                      </div>
                      <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-[#00a884] text-white flex items-center justify-center text-[10px] font-bold">+</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">My Status</div>
                      <div className="text-xs text-[#8696a0]">Tap to add status update</div>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-[#8696a0] pt-1">Recent Updates</div>

                  {[
                    { name: "Michael Chen", time: "14 minutes ago", color: "from-purple-500 to-indigo-600" },
                    { name: "Emma Watson", time: "42 minutes ago", color: "from-amber-400 to-orange-500" },
                  ].map((st, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#111b21]">
                      <div className={`h-11 w-11 rounded-full bg-gradient-to-tr ${st.color} p-0.5`}>
                        <div className="h-full w-full rounded-full bg-[#0b141a] flex items-center justify-center text-xs font-bold text-white">
                          {st.name[0]}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{st.name}</div>
                        <div className="text-xs text-[#8696a0]">{st.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Privacy */}
            {activeTab === 'privacy' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fade-in">
                <div className="lg:col-span-6 space-y-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00a884] bg-[#00a884]/15 px-3.5 py-1.5 rounded-full">
                    Peace of Mind
                  </span>
                  <h3 className="text-2xl lg:text-3xl font-extrabold text-white">
                    Built from the Ground Up for Your Privacy
                  </h3>
                  <p className="text-[#8696a0] text-sm leading-relaxed">
                    We believe your personal messages and phone calls should always remain yours. You are always in control of your data, profile visibility, and contact permissions.
                  </p>
                  
                  <div className="space-y-3.5">
                    {[
                      "App Lock with Fingerprint / Biometric authentication",
                      "Control who can see your Last Seen, Status, and Profile Photo",
                      "Block unwanted contacts or report spam with a single tap",
                      "Zero third-party tracking or targeted ad networks"
                    ].map((feat, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-5 w-5 rounded-full bg-[#00a884]/20 flex items-center justify-center text-[#00a884]">
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-sm text-[#e9edef]">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[#0b141a] rounded-2xl p-6 border border-[#202c33] space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-[#202c33]">
                    <div className="h-10 w-10 rounded-full bg-[#00a884]/15 flex items-center justify-center text-[#00a884]">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Privacy Controls</h4>
                      <p className="text-xs text-[#8696a0]">Customize your preferences</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    {[
                      { label: "Last Seen & Online", value: "My Contacts" },
                      { label: "Profile Photo", value: "Everyone" },
                      { label: "Read Receipts", value: "Enabled" },
                      { label: "Fingerprint App Lock", value: "Active" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 rounded-lg bg-[#111b21] border border-[#202c33]">
                        <span className="text-[#e9edef] font-medium">{item.label}</span>
                        <span className="text-[#00a884] font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* 5. How It Works (3 Simple Steps for Users) */}
      <section id="how-it-works" className="py-20 bg-[#111b21] border-y border-[#202c33]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-base text-[#8696a0]">
              Starting your conversation on {config.appName} takes less than a minute.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] text-center space-y-4 relative">
              <div className="h-12 w-12 rounded-full bg-[#00a884] text-white font-extrabold text-lg flex items-center justify-center mx-auto shadow-lg shadow-[#00a884]/20">
                1
              </div>
              <h3 className="text-lg font-bold text-white">Download the App</h3>
              <p className="text-xs sm:text-sm text-[#8696a0] leading-relaxed">
                Download and install the lightweight APK directly onto your Android phone or tablet.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] text-center space-y-4 relative">
              <div className="h-12 w-12 rounded-full bg-[#00a884] text-white font-extrabold text-lg flex items-center justify-center mx-auto shadow-lg shadow-[#00a884]/20">
                2
              </div>
              <h3 className="text-lg font-bold text-white">Verify Phone Number</h3>
              <p className="text-xs sm:text-sm text-[#8696a0] leading-relaxed">
                Enter your mobile number and confirm with a fast, secure one-time verification code.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] text-center space-y-4 relative">
              <div className="h-12 w-12 rounded-full bg-[#00a884] text-white font-extrabold text-lg flex items-center justify-center mx-auto shadow-lg shadow-[#00a884]/20">
                3
              </div>
              <h3 className="text-lg font-bold text-white">Start Chatting & Calling</h3>
              <p className="text-xs sm:text-sm text-[#8696a0] leading-relaxed">
                Add contacts, start sending text or audio messages, and enjoy crystal-clear voice and video calls.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 6. FAQ Section (End-User Focused) */}
      <section id="faq" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-sm text-[#8696a0]">
              Everything you need to know about using {config.appName} on your phone.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: `Is ${config.appName} free to use for calls and messages?`,
                a: `Yes! ${config.appName} uses your phone's internet connection (Wi-Fi or cellular data) to send messages and make calls, so you don't have to pay standard SMS or cellular voice fees.`
              },
              {
                q: `How do I add friends on ${config.appName}?`,
                a: `Simply tap the 'New Chat' button inside the app and choose a contact from your address book who is on ${config.appName}, or invite them directly using your personalized invite link.`
              },
              {
                q: "Are my photos and videos shared in high quality?",
                a: `Yes. ${config.appName} is designed to preserve your media quality so that photos and videos remain clear when shared with your contacts.`
              },
              {
                q: "What devices are supported?",
                a: `${config.appName} runs on Android phones and tablets running Android 8.0 and above, with responsive design support for foldables and tablets.`
              },
              {
                q: `How does ${config.appName} protect my privacy?`,
                a: `${config.appName} ensures that your conversations stay private. We do not sell your personal data or show invasive third-party ad trackers.`
              }
            ].map((faq, index) => (
              <div 
                key={index} 
                className="bg-[#111b21] rounded-2xl border border-[#202c33] overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                >
                  <span className="text-sm sm:text-base font-bold text-white">{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 text-[#8696a0] shrink-0 transition-transform ${openFaq === index ? 'rotate-180 text-[#00a884]' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#8696a0] leading-relaxed border-t border-[#202c33]/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 7. Download App Banner (CTA) */}
      <section id="download" className="py-24 relative overflow-hidden bg-[#111b21] border-t border-[#202c33]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#00a884]/15 to-[#53bdeb]/15 blur-[140px] rounded-full -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          <div className="inline-flex h-16 w-16 rounded-3xl bg-gradient-to-tr from-[#00a884] to-[#53bdeb] p-0.5 shadow-xl shadow-[#00a884]/20 items-center justify-center mx-auto">
            <div className="h-full w-full rounded-[22px] bg-[#0b141a] flex items-center justify-center">
              <Download className="h-8 w-8 text-[#00a884]" />
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to Experience {config.appName}?
          </h2>
          <p className="text-base text-[#8696a0] max-w-xl mx-auto leading-relaxed">
            Download the Android app today and stay closer to friends and family with fast, private messaging and calls.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            {hasDownloadUrl ? (
              <a 
                href={downloadLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-download-pulse w-full text-center px-8 py-4 rounded-full bg-[#00a884] text-white font-bold text-base shadow-xl shadow-[#00a884]/25 active:scale-95 transition-all flex items-center justify-center gap-2.5"
              >
                <Download className="h-5 w-5" />
                {t('hero.downloadBtn') || 'Download APK Directly'} {config.appVersion ? `(v${config.appVersion})` : ''}
              </a>
            ) : (
              <Link 
                href="/download"
                className="w-full text-center px-8 py-4 rounded-full bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] text-[#8696a0] hover:text-white font-bold text-base transition-all flex items-center justify-center gap-2.5"
              >
                <Clock className="h-5 w-5 text-amber-400" />
                {t('hero.noAppAvailable') || 'No App Available'}
              </Link>
            )}
          </div>

          <p className="text-xs text-[#8696a0]">
            Compatible with all Android devices running Android 8.0 or newer.
          </p>
        </div>
      </section>

      {/* 8. User-Friendly Footer */}
      <footer className="bg-[#0b141a] border-t border-[#202c33] py-12 text-xs text-[#8696a0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#00a884] to-[#53bdeb] p-0.5 flex items-center justify-center">
                <div className="h-full w-full rounded-[6px] bg-[#0b141a] flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-[#00a884]" />
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
              <LanguageSelector />
              <p className="text-[#8696a0]">{t('footer.tagline')}</p>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
