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
  Phone, 
  Video, 
  Mic, 
  Camera, 
  Smile, 
  Sparkles, 
  Clock, 
  Moon, 
  ArrowLeft, 
  Check, 
  Zap, 
  HardDrive, 
  Fingerprint, 
  Share2, 
  BellOff, 
  Search,
  CheckCheck
} from 'lucide-react';
import { fetchPublicAppConfig, PublicAppConfig } from '../../lib/api';

export default function FeaturesPage() {
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

  const [activeCategory, setActiveCategory] = useState<'all' | 'messaging' | 'calling' | 'privacy' | 'media'>('all');

  useEffect(() => {
    fetchPublicAppConfig().then(data => {
      if (data) setConfig(data);
    });
  }, []);

  const downloadLink = config.appDownloadUrl && config.appDownloadUrl.trim() !== ''
    ? config.appDownloadUrl
    : 'https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app';

  const featureList = [
    {
      category: 'messaging',
      icon: MessageSquare,
      title: 'Instant Private Messaging',
      tag: 'Core Communication',
      desc: 'Send lightning-fast text and formatted messages with real-time delivery ticks (Sent, Delivered, Read Receipts).',
      bullets: [
        'Real-time typing and online status indicators',
        'Message search across all your chat histories',
        'Pin important chats to the top of your list',
        'Swipe-to-reply functionality for swift context'
      ]
    },
    {
      category: 'calling',
      icon: Phone,
      title: 'Crystal-Clear HD Voice Calls',
      tag: 'Low-Latency Audio',
      desc: 'Connect with anyone worldwide with high-fidelity Opus audio compression optimized for low-bandwidth networks.',
      bullets: [
        'Zero international fees over Wi-Fi and mobile data',
        'Adaptive bitrates for 2G, 3G, 4G, 5G connections',
        'Seamless microphone muting and speakerphone toggle',
        'Detailed call duration and history logging'
      ]
    },
    {
      category: 'calling',
      icon: Video,
      title: 'One-on-One HD Video Calls',
      tag: 'Face-to-Face',
      desc: 'Enjoy crisp, jitter-free video conversations with automatic frame rate adjustment and smooth camera switching.',
      bullets: [
        'High dynamic range camera support',
        'Instant front and back camera toggles',
        'Low battery and reduced data usage modes',
        'Direct connection security'
      ]
    },
    {
      category: 'media',
      icon: Camera,
      title: 'Full Quality Photo & Video Sharing',
      tag: 'Media Preserved',
      desc: 'Share special moments without harsh compression. Send high-resolution images, original videos, and large documents.',
      bullets: [
        'Send uncompressed HD pictures and video clips',
        'In-chat photo preview gallery and pinch-to-zoom',
        'Caption support for shared media',
        'Direct gallery and camera integration'
      ]
    },
    {
      category: 'media',
      icon: Mic,
      title: 'High-Fidelity Voice Notes',
      tag: 'Audio Messages',
      desc: 'Record and send clear voice memos with visual audio waveforms and variable speed playback.',
      bullets: [
        'Interactive waveform scrubber for quick seeking',
        'Background recording noise cancellation',
        'Hands-free recording lock mode',
        'Instant playback speeds (1x, 1.5x, 2x)'
      ]
    },
    {
      category: 'messaging',
      icon: Clock,
      title: '24-Hour Disappearing Status Stories',
      tag: 'Moments',
      desc: 'Share your daily highlights with photos, text captions, and short videos that automatically disappear after 24 hours.',
      bullets: [
        'Custom status viewer privacy controls',
        'Real-time viewer lists and view counts',
        'Direct chat replies to contact status updates',
        'Automatic 24-hour cleanup to save device space'
      ]
    },
    {
      category: 'privacy',
      icon: Fingerprint,
      title: 'Biometric App Lock',
      tag: 'On-Device Security',
      desc: 'Protect your chats from prying eyes with built-in fingerprint and biometric authentication.',
      bullets: [
        'Instant lock upon app minimization',
        'Custom timeout settings (Immediately, 1 min, 15 min)',
        'Biometric authentication support for all Android devices',
        'Hidden message previews on lock screens'
      ]
    },
    {
      category: 'messaging',
      icon: Users,
      title: 'Organized Group Chats',
      tag: 'Communities',
      desc: 'Create group channels for family, friend circles, coworkers, and community clubs up to 1,024 members.',
      bullets: [
        'Group admin controls (add, remove, manage permissions)',
        'Custom group avatars, group descriptions, and topics',
        'Shared media repository for group photos and files',
        'Mute group notifications for custom durations'
      ]
    },
    {
      category: 'privacy',
      icon: Moon,
      title: 'Eye-Safe Dark Mode & Customization',
      tag: 'Ergonomics',
      desc: 'Designed with deep OLED blacks to protect your eyes at night and extend your battery life.',
      bullets: [
        'High contrast dark theme built for night reading',
        'Dynamic Material 3 UI theming support',
        'Custom font scaling and accessibility adjustments',
        'Minimalist layout free of banner ads or clutter'
      ]
    }
  ];

  const filteredFeatures = activeCategory === 'all' 
    ? featureList 
    : featureList.filter(f => f.category === activeCategory);

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
              <Link href="/" className="text-[#8696a0] hover:text-white transition-colors">Home</Link>
              <Link href="/features" className="text-[#00a884] font-bold">Features</Link>
              <Link href="/faq" className="text-[#8696a0] hover:text-white transition-colors">FAQ</Link>
              <Link href="/security" className="text-[#8696a0] hover:text-white transition-colors">Security</Link>
              <Link href="/about" className="text-[#8696a0] hover:text-white transition-colors">About</Link>
              <Link href="/contact" className="text-[#8696a0] hover:text-white transition-colors">Contact</Link>
            </div>

            <div className="flex items-center gap-3">
              <a 
                href={downloadLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-[#00a884] hover:bg-[#008f72] text-white transition-all shadow-md hover:scale-105"
              >
                <Download className="h-3.5 w-3.5" />
                Download APK
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[140px] rounded-full -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111b21] border border-[#202c33] text-[#00a884] text-xs font-bold">
            <Sparkles className="h-4 w-4" />
            Powerful, Lightweight & Privacy-First
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Features Crafted for <br />
            <span className="bg-gradient-to-r from-[#00a884] via-[#25d366] to-[#53bdeb] bg-clip-text text-transparent">
              Everyday Conversations
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#8696a0] leading-relaxed max-w-2xl mx-auto">
            Discover all the built-in capabilities that make {config.appName} the fastest and most reliable way to stay in touch with friends, family, and communities.
          </p>

          {/* Filter Tabs */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'all', label: 'All Features' },
              { id: 'messaging', label: 'Messaging & Groups' },
              { id: 'calling', label: 'Voice & Video' },
              { id: 'media', label: 'Media & Voice Notes' },
              { id: 'privacy', label: 'Privacy & Security' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as any)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeCategory === tab.id
                    ? 'bg-[#00a884] text-white shadow-lg shadow-[#00a884]/20 scale-105'
                    : 'bg-[#111b21] text-[#8696a0] hover:text-white border border-[#202c33]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-12 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div 
                key={idx}
                className="bg-[#111b21] rounded-2xl border border-[#202c33] p-7 space-y-5 hover:border-[#00a884]/50 transition-all group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-xl bg-[#00a884]/15 flex items-center justify-center text-[#00a884] group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8696a0] bg-[#0b141a] px-2.5 py-1 rounded-full border border-[#202c33]">
                      {feat.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-[#00a884] transition-colors">
                    {feat.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#8696a0] leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-[#202c33]/70">
                  {feat.bullets.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-start gap-2.5 text-xs text-[#e9edef]">
                      <div className="h-4 w-4 rounded-full bg-[#00a884]/20 flex items-center justify-center text-[#00a884] shrink-0 mt-0.5">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#111b21] border-t border-[#202c33] text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Experience All Features on {config.appName}
          </h2>
          <p className="text-sm sm:text-base text-[#8696a0] max-w-xl mx-auto">
            Download the Android APK today and enjoy zero ads, crystal-clear calls, and private messaging.
          </p>
          <div className="pt-2">
            <a 
              href={downloadLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#00a884] hover:bg-[#008f72] text-white font-bold text-sm shadow-xl shadow-[#00a884]/20 transition-all hover:scale-105"
            >
              <Download className="h-4 w-4" />
              Download APK for Android {config.appVersion ? `(v${config.appVersion})` : ''}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0b141a] border-t border-[#202c33] py-10 text-xs text-[#8696a0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} {config.appName}. All rights reserved.</p>
          <div className="flex flex-wrap gap-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/features" className="hover:text-white">Features</Link>
            <Link href="/faq" className="hover:text-white">FAQ</Link>
            <Link href="/security" className="hover:text-white">Security</Link>
            <Link href="/about" className="hover:text-white">About</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
