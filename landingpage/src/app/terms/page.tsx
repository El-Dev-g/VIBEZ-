'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, FileText, ArrowLeft, CheckCircle } from 'lucide-react';
import { fetchPublicAppConfig, PublicAppConfig } from '../../lib/api';

export default function TermsPage() {
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

            <Link href="/" className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#8696a0] hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111b21] border border-[#202c33] text-[#00a884] text-xs font-bold">
            <FileText className="h-4 w-4" />
            Terms & Guidelines
          </div>
          <h1 className="text-4xl font-black text-white">Terms of Service</h1>
          <p className="text-sm text-[#8696a0]">Effective Date: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-sm text-[#8696a0] leading-relaxed">
          
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the {config.appName} application, websites, and associated services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Acceptable Use Policy</h2>
            <p>You agree to use {config.appName} responsibly. You must not:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Use the service to distribute spam, malware, phishing links, or unauthorized promotional broadcasts.</li>
              <li>Harass, threaten, stalk, or violate the legal rights of other individuals.</li>
              <li>Attempt to reverse-engineer, exploit vulnerabilities, or disrupt platform infrastructure.</li>
              <li>Impersonate any person or entity without legitimate authorization.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. User Accounts & Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your verification codes and login session. You must notify us immediately if you suspect unauthorized access to your account.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Service Availability & Updates</h2>
            <p>
              We continuously improve our platform. We may update, release new features, or perform maintenance from time to time. We strive for 99.9% uptime but do not guarantee uninterrupted operation.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Contact Information</h2>
            <p>
              For legal inquiries or questions regarding these terms, reach us at:
            </p>
            <p className="text-white font-medium">
              Email: <a href={`mailto:${config.contactEmail || 'support@vibez.chat'}`} className="text-[#00a884] underline">{config.contactEmail || 'support@vibez.chat'}</a>
            </p>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0b141a] border-t border-[#202c33] py-10 text-xs text-[#8696a0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} {config.appName}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/about" className="hover:text-white">About</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
