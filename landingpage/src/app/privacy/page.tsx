'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, ShieldCheck, ArrowLeft, Lock, EyeOff, Database, Key } from 'lucide-react';
import { fetchPublicAppConfig, PublicAppConfig } from '../../lib/api';

export default function PrivacyPage() {
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
    <div className="bg-[#0b141a] text-[#e9edef] selection:bg-[#00a884] selection:text-white">
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111b21] border border-[#202c33] text-[#00a884] text-xs font-bold">
            <ShieldCheck className="h-4 w-4" />
            Your Privacy is Our Priority
          </div>
          <h1 className="text-4xl font-black text-white">Privacy Policy</h1>
          <p className="text-sm text-[#8696a0]">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-sm text-[#8696a0] leading-relaxed">
          
          <div className="bg-[#111b21] p-6 rounded-2xl border border-[#202c33] space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#00a884]" />
              1. Our Privacy Commitment
            </h2>
            <p>
              At {config.appName}, we believe that your personal communications should remain private and secure. We operate with a strict principle of data minimization: we collect only what is necessary to route your messages, establish audio/video calls, and authenticate your account.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Information We Process</h2>
            <p>To provide {config.appName} services, we process:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white">Account Information:</strong> Your registered phone number and optional display name/profile photo to identify you to other users in your address book.</li>
              <li><strong className="text-white">Messages & Media:</strong> Messages and media files sent through our platform are transmitted directly to the recipient and are not indexed, scanned for ads, or monetized.</li>
              <li><strong className="text-white">Status Updates:</strong> 24-hour status stories posted to your contacts are automatically purged from active display after 24 hours.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Zero Targeted Ads & No Data Brokering</h2>
            <p>
              We do not sell, rent, or trade your personal information to marketing firms or advertising networks. There are no tracking pixels or cross-site profiling scripts integrated into our client applications.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Your Rights and Data Controls</h2>
            <p>
              You have full ownership of your data. Within the {config.appName} Android application, you can at any time:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Manage who can see your Last Seen, Status, and Profile details.</li>
              <li>Block and report malicious or harassing accounts.</li>
              <li>Request full account deletion and erasure of your profile.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Contact Our Privacy Officer</h2>
            <p>
              If you have any questions regarding this Privacy Policy or your data protection rights, please contact us at:
            </p>
            <p className="text-white font-medium">
              Email: <a href={`mailto:${config.contactEmail || 'support@vibez.chat'}`} className="text-[#00a884] underline">{config.contactEmail || 'support@vibez.chat'}</a><br />
              Address: {config.supportAddress || 'San Francisco, CA, USA'}
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
