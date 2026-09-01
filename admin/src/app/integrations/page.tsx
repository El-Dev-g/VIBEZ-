'use client';

import React from 'react';
import Link from 'next/link';

export default function IntegrationsPage() {
  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">System Integrations</h2>
          <p className="text-slate-500 font-bold mt-1">
            Connect and configure external service APIs, auth providers, and delivery channels.
          </p>
        </div>
      </div>

      {/* Grid of integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gmail Integration Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl shadow-slate-200/50 flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="space-y-4">
            {/* Header / Icon */}
            <div className="flex items-center justify-between">
              <div className="p-3 bg-red-50 text-red-500 rounded-2xl border border-red-100 shrink-0">
                {/* Custom Gmail Icon */}
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
              <span className="px-2.5 py-1 bg-red-50 border border-red-100 text-red-600 text-xs font-black uppercase tracking-wider rounded-lg">
                Gmail API
              </span>
            </div>

            {/* Title / Description */}
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Gmail Support Delivery</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Connect the official VIBEZ Support Email to Google OAuth2. Enables secure dispatch of account alerts, system verifications, and agent replies over Port 443 HTTPS.
              </p>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <Link
              href="/admin/gmail-oauth"
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-extrabold text-sm rounded-2xl transition shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
            >
              Configure Connection
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Placeholder: Other integrations (e.g. Stripe, AWS) */}
        <div className="bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-slate-100 text-slate-400 rounded-2xl shrink-0">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider rounded-lg">
                Billing
              </span>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-400 tracking-tight">Stripe Gateway</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                Configure credit card processing, automatic user subscription renewals, webhook signatures, and payment audits.
              </p>
            </div>
          </div>
          <div className="pt-6 mt-6 border-t border-slate-100">
            <button
              disabled
              className="w-full py-3 px-4 bg-slate-100 text-slate-400 font-bold text-sm rounded-2xl cursor-not-allowed flex items-center justify-center gap-2"
            >
              Coming Soon
            </button>
          </div>
        </div>

        {/* Placeholder: Backup Storage */}
        <div className="bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-slate-100 text-slate-400 rounded-2xl shrink-0">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider rounded-lg">
                Storage
              </span>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-400 tracking-tight">S3 Cloud Storage</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                Connect external cloud object storage buckets for user-generated media downloads, security archives, and log exports.
              </p>
            </div>
          </div>
          <div className="pt-6 mt-6 border-t border-slate-100">
            <button
              disabled
              className="w-full py-3 px-4 bg-slate-100 text-slate-400 font-bold text-sm rounded-2xl cursor-not-allowed flex items-center justify-center gap-2"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
