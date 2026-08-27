'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  Download, 
  Smartphone, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowLeft, 
  HelpCircle, 
  Sparkles, 
  FileText, 
  Settings, 
  AlertTriangle,
  Layers,
  Cpu,
  Clock
} from 'lucide-react';
import { fetchPublicAppConfig, PublicAppConfig } from '../../lib/api';

export default function DownloadPage() {
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
              <Link href="/features" className="text-[#8696a0] hover:text-white transition-colors">Features</Link>
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

      {/* Hero Download Card */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[140px] rounded-full -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111b21] border border-[#202c33] text-[#00a884] text-xs font-bold">
            <Sparkles className="h-4 w-4" />
            Official Release Center
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Download {config.appName} for <br />
            <span className="bg-gradient-to-r from-[#00a884] via-[#25d366] to-[#53bdeb] bg-clip-text text-transparent">
              Android Smartphone & Tablet
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#8696a0] leading-relaxed max-w-2xl mx-auto">
            Get the latest official APK package directly to your Android device. Fast installation, zero bloat, and automatic background updates.
          </p>

          {/* Download Box */}
          <div className="pt-6 max-w-xl mx-auto">
            <div className="bg-[#111b21] p-8 rounded-3xl border-2 border-[#00a884]/40 shadow-2xl space-y-6">
              
              <div className="flex items-center justify-between text-left border-b border-[#202c33] pb-5">
                <div>
                  <div className="text-xs text-[#8696a0] font-medium">Package Version</div>
                  <div className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{config.appName} APK</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#00a884]/20 text-[#00a884]">{config.appVersion || 'v1.0.0'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#8696a0] font-medium">Platform</div>
                  <div className="text-sm font-bold text-[#53bdeb]">Android 8.0+</div>
                </div>
              </div>

              <a 
                href={downloadLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-8 rounded-2xl bg-[#00a884] hover:bg-[#008f72] text-white font-black text-base shadow-xl shadow-[#00a884]/30 transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="h-5 w-5" />
                Download Direct APK Now
              </a>

              <div className="flex items-center justify-center gap-6 text-[11px] text-[#8696a0]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#00a884]" />
                  <span>100% Virus & Malware Free</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#00a884]" />
                  <span>Official Signed Binary</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 3 Step Installation Guide */}
      <section className="py-16 bg-[#111b21] border-y border-[#202c33]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white">How to Install in 3 Easy Steps</h2>
            <p className="text-sm text-[#8696a0]">Follow this quick guide to install the APK on your Android device.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] space-y-4 relative">
              <div className="h-10 w-10 rounded-full bg-[#00a884] text-white font-black flex items-center justify-center text-base">
                1
              </div>
              <h3 className="text-lg font-bold text-white">Download APK</h3>
              <p className="text-xs sm:text-sm text-[#8696a0] leading-relaxed">
                Tap the "Download APK" button above. Your browser will prompt you to save the <span className="text-white font-mono text-xs">vibez.apk</span> file.
              </p>
            </div>

            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] space-y-4 relative">
              <div className="h-10 w-10 rounded-full bg-[#53bdeb] text-white font-black flex items-center justify-center text-base">
                2
              </div>
              <h3 className="text-lg font-bold text-white">Allow Unknown Sources</h3>
              <p className="text-xs sm:text-sm text-[#8696a0] leading-relaxed">
                When prompted by Android, tap <strong>Settings</strong> and toggle on <strong>"Allow from this source"</strong> for Chrome or your File Manager.
              </p>
            </div>

            <div className="bg-[#0b141a] p-8 rounded-2xl border border-[#202c33] space-y-4 relative">
              <div className="h-10 w-10 rounded-full bg-purple-500 text-white font-black flex items-center justify-center text-base">
                3
              </div>
              <h3 className="text-lg font-bold text-white">Launch & Register</h3>
              <p className="text-xs sm:text-sm text-[#8696a0] leading-relaxed">
                Tap <strong>Install</strong>. Once finished, open {config.appName}, enter your phone number to receive your instant verification code, and start chatting!
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* System Requirements */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center">System Requirements</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#111b21] p-6 rounded-2xl border border-[#202c33] space-y-2">
            <Smartphone className="h-6 w-6 text-[#00a884]" />
            <div className="text-xs text-[#8696a0]">OS Version</div>
            <div className="text-sm font-bold text-white">Android 8.0 (Oreo) or higher</div>
          </div>

          <div className="bg-[#111b21] p-6 rounded-2xl border border-[#202c33] space-y-2">
            <Cpu className="h-6 w-6 text-[#53bdeb]" />
            <div className="text-xs text-[#8696a0]">Processor</div>
            <div className="text-sm font-bold text-white">ARM64, ARMv7, x86_64</div>
          </div>

          <div className="bg-[#111b21] p-6 rounded-2xl border border-[#202c33] space-y-2">
            <Layers className="h-6 w-6 text-purple-400" />
            <div className="text-xs text-[#8696a0]">RAM</div>
            <div className="text-sm font-bold text-white">1 GB RAM (2 GB recommended)</div>
          </div>

          <div className="bg-[#111b21] p-6 rounded-2xl border border-[#202c33] space-y-2">
            <Clock className="h-6 w-6 text-amber-400" />
            <div className="text-xs text-[#8696a0]">Storage</div>
            <div className="text-sm font-bold text-white">~45 MB free storage</div>
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
