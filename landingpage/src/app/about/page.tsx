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
  CheckCircle2
} from 'lucide-react';
import { fetchPublicAppConfig, PublicAppConfig } from '../../lib/api';

export default function AboutPage() {
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

  const downloadLink = config.appDownloadUrl && config.appDownloadUrl.trim() !== ''
    ? config.appDownloadUrl
    : 'https://ais-dev-knzemx4apbas7ltgs7fl4d-259298733495.europe-west2.run.app';

  return (
    <div className="min-h-screen bg-[#0b141a] text-[#e9edef] selection:bg-[#00a884] selection:text-white">
      
      {/* Header */}
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

            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#8696a0] hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
              <a 
                href={downloadLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-[#00a884] hover:bg-[#008f72] text-white transition-all shadow-md"
              >
                <Download className="h-3.5 w-3.5" />
                Download App
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[130px] rounded-full -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111b21] border border-[#202c33] text-[#00a884] text-xs font-bold">
            <Sparkles className="h-4 w-4" />
            Our Vision & Mission
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Connecting People Worldwide with <br />
            <span className="bg-gradient-to-r from-[#00a884] via-[#25d366] to-[#53bdeb] bg-clip-text text-transparent">
              Speed, Simplicity & Privacy
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#8696a0] leading-relaxed max-w-2xl mx-auto">
            {config.appName} was built with a single mission: to provide everyone around the globe with seamless, ad-free, private communication without friction or subscription walls.
          </p>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-16 bg-[#111b21] border-y border-[#202c33]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl font-extrabold text-white">What We Stand For</h2>
            <p className="text-sm text-[#8696a0]">Our foundational values guide every line of code we craft.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] space-y-4">
              <div className="h-12 w-12 rounded-xl bg-[#00a884]/15 flex items-center justify-center text-[#00a884]">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Uncompromising Privacy</h3>
              <p className="text-sm text-[#8696a0] leading-relaxed">
                Your conversations are private. We don't track your location, read your chat content, or sell advertising profiles to third-party data brokers.
              </p>
            </div>

            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] space-y-4">
              <div className="h-12 w-12 rounded-xl bg-[#53bdeb]/15 flex items-center justify-center text-[#53bdeb]">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Blazing Speed & Reliability</h3>
              <p className="text-sm text-[#8696a0] leading-relaxed">
                Engineered for maximum battery efficiency and fluid message delivery even on low-bandwidth networks (2G/3G/4G/5G).
              </p>
            </div>

            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] space-y-4">
              <div className="h-12 w-12 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Built for People</h3>
              <p className="text-sm text-[#8696a0] leading-relaxed">
                An intuitive, clutter-free experience that feels effortless for everyone, from tech enthusiasts to grandparents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story & Evolution */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white">The {config.appName} Story</h2>
            <p className="text-base text-[#8696a0] leading-relaxed">
              Modern messaging shouldn't be overloaded with invasive advertising, bloated algorithms, or complicated lock-in ecosystems. We created {config.appName} as a clean alternative where conversation takes center stage.
            </p>
            <p className="text-base text-[#8696a0] leading-relaxed">
              Today, {config.appName} delivers instant text messaging, high-definition voice and video calls, disappearing 24-hour status updates, and rich multimedia sharing across all modern Android devices.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-8 rounded-2xl bg-[#111b21] border border-[#202c33] text-center">
            <div>
              <div className="text-3xl font-black text-white">99.9%</div>
              <div className="text-xs text-[#8696a0] mt-1">Uptime Reliability</div>
            </div>
            <div>
              <div className="text-3xl font-black text-[#00a884]">0 Ads</div>
              <div className="text-xs text-[#8696a0] mt-1">No Annoying Popups</div>
            </div>
            <div>
              <div className="text-3xl font-black text-white">HD</div>
              <div className="text-xs text-[#8696a0] mt-1">Audio & Video</div>
            </div>
            <div>
              <div className="text-3xl font-black text-[#53bdeb]">{config.appVersion || 'v1.0.0'}</div>
              <div className="text-xs text-[#8696a0] mt-1">Latest Release</div>
            </div>
          </div>

          <div className="pt-8 text-center">
            <h3 className="text-xl font-bold text-white mb-4">Ready to start chatting?</h3>
            <a 
              href={downloadLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#00a884] hover:bg-[#008f72] text-white font-bold text-sm shadow-xl shadow-[#00a884]/20 transition-all hover:scale-105"
            >
              <Download className="h-4 w-4" />
              Download APK for Android
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0b141a] border-t border-[#202c33] py-10 text-xs text-[#8696a0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} {config.appName}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
