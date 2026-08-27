'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  ShieldCheck, 
  Lock, 
  Fingerprint, 
  Key, 
  EyeOff, 
  Database, 
  Server, 
  Download, 
  Sparkles, 
  Check, 
  ShieldAlert, 
  Smartphone,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { fetchPublicAppConfig, PublicAppConfig } from '../../lib/api';

export default function SecurityPage() {
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

            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/" className="text-[#8696a0] hover:text-white transition-colors">Home</Link>
              <Link href="/features" className="text-[#8696a0] hover:text-white transition-colors">Features</Link>
              <Link href="/faq" className="text-[#8696a0] hover:text-white transition-colors">FAQ</Link>
              <Link href="/security" className="text-[#00a884] font-bold">Security</Link>
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
                Download App
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
            <ShieldCheck className="h-4 w-4" />
            Security & Cryptographic Architecture
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Built from the Core for <br />
            <span className="bg-gradient-to-r from-[#00a884] via-[#25d366] to-[#53bdeb] bg-clip-text text-transparent">
              Zero-Compromise Security
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#8696a0] leading-relaxed max-w-2xl mx-auto">
            Explore how {config.appName} safeguards your communications through layered privacy controls, biometric app locking, and data-minimized cloud routing.
          </p>
        </div>
      </section>

      {/* 4 Pillars of Security */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="bg-[#111b21] p-8 rounded-3xl border border-[#202c33] space-y-4">
            <div className="h-12 w-12 rounded-xl bg-[#00a884]/15 flex items-center justify-center text-[#00a884]">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Private Direct Routing</h3>
            <p className="text-xs sm:text-sm text-[#8696a0] leading-relaxed">
              Messages and media pass through hardened transport layers directly between authorized recipients. We do not inspect message payloads for commercial analytics or ad profiling.
            </p>
            <div className="space-y-2 pt-2 text-xs text-[#e9edef]">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#00a884]" />
                <span>TLS 1.3 encrypted transport for all in-flight packets</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#00a884]" />
                <span>Zero message logging for ad targeting or tracking</span>
              </div>
            </div>
          </div>

          <div className="bg-[#111b21] p-8 rounded-3xl border border-[#202c33] space-y-4">
            <div className="h-12 w-12 rounded-xl bg-[#53bdeb]/15 flex items-center justify-center text-[#53bdeb]">
              <Fingerprint className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">On-Device Biometric Lock</h3>
            <p className="text-xs sm:text-sm text-[#8696a0] leading-relaxed">
              Integrates directly with Android's secure hardware Keystore and BiometricPrompt API. Your chats remain locked even if someone physically picks up your unlocked device.
            </p>
            <div className="space-y-2 pt-2 text-xs text-[#e9edef]">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#53bdeb]" />
                <span>Hardware-backed biometric verification (Fingerprint & Face)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#53bdeb]" />
                <span>Customizable auto-lock timeout intervals</span>
              </div>
            </div>
          </div>

          <div className="bg-[#111b21] p-8 rounded-3xl border border-[#202c33] space-y-4">
            <div className="h-12 w-12 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
              <EyeOff className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Granular Visibility Controls</h3>
            <p className="text-xs sm:text-sm text-[#8696a0] leading-relaxed">
              You decide who can see your online status, Last Seen timestamp, profile avatar, and status updates. Customize visibility individually per contact.
            </p>
            <div className="space-y-2 pt-2 text-xs text-[#e9edef]">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-purple-400" />
                <span>Selectable audience rules (Everyone, My Contacts, Nobody)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-purple-400" />
                <span>Instant block & spam reporting with immediate isolation</span>
              </div>
            </div>
          </div>

          <div className="bg-[#111b21] p-8 rounded-3xl border border-[#202c33] space-y-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Data Minimization Principle</h3>
            <p className="text-xs sm:text-sm text-[#8696a0] leading-relaxed">
              We collect the absolute minimum telemetry necessary to authenticate accounts and maintain service reliability. We do not harvest contacts for secondary marketing.
            </p>
            <div className="space-y-2 pt-2 text-xs text-[#e9edef]">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-400" />
                <span>24-hour status stories automatically vanish</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-400" />
                <span>Full account erasure options available upon request</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Security Checklist */}
      <section className="py-16 bg-[#111b21] border-y border-[#202c33]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Our Security Guarantee</h2>
            <p className="text-sm text-[#8696a0]">Transparency at every layer of the application.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "Zero third-party tracking or behavioral advertising SDKs",
              "Biometric lock backed by Android Hardware Keymaster",
              "Secure WebRTC P2P direct audio/video streaming",
              "Automatic 24-hour media cleanup for ephemeral statuses",
              "Encrypted SQLite local database cache on Android",
              "No selling, renting, or brokering of phone numbers or chat logs"
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-[#0b141a] border border-[#202c33]">
                <CheckCircle2 className="h-5 w-5 text-[#00a884] shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-[#e9edef] font-medium">{item}</span>
              </div>
            ))}
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
