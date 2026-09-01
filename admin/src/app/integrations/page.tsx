'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchGmailOAuthStatus, disconnectGmailOAuth, GmailOAuthStatus } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function IntegrationsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<GmailOAuthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const adminRoles = ['SUPERADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'];
  const isAdmin = !!user?.role && adminRoles.includes(user.role.toUpperCase());

  const loadStatus = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await fetchGmailOAuthStatus();
      setStatus(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [user]);

  const handleUninstall = async () => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to disconnect and uninstall the Gmail Support Delivery integration?')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await disconnectGmailOAuth();
      if (res?.success) {
        await loadStatus();
      } else {
        alert(res?.error || 'Failed to disconnect integration.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to process uninstallation.');
    } finally {
      setActionLoading(false);
    }
  };

  const isConnected = status?.authorized === true;

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
        <div className="p-4 bg-red-50 text-red-500 rounded-3xl border border-red-100 mb-4 shadow-sm">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Access Denied</h3>
        <p className="text-slate-500 font-bold max-w-sm mt-2 text-sm leading-relaxed">
          You do not have the necessary permissions to configure system integrations. Only authorized administrators can access this system.
        </p>
      </div>
    );
  }

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
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl shadow-slate-200/50 flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden">
          {/* Status Indicator Bar */}
          {isConnected && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500 animate-pulse" />
          )}

          <div className="space-y-4">
            {/* Header / Icon */}
            <div className="flex items-center justify-between">
              <div className="p-3 bg-red-50 text-red-500 rounded-2xl border border-red-100 shrink-0">
                {/* Custom Gmail Icon */}
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                {loading ? (
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
                ) : isConnected ? (
                  <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Connected
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-red-50 border border-red-100 text-red-600 text-xs font-black uppercase tracking-wider rounded-lg">
                    Gmail API
                  </span>
                )}
              </div>
            </div>

            {/* Title / Description */}
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Gmail Support Delivery</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Connect the official VIBEZ Support Email to Google OAuth2. Enables secure dispatch of account alerts, system verifications, and agent replies over Port 443 HTTPS.
              </p>
              {isConnected && status?.userEmail && (
                <div className="mt-2 text-xs text-slate-400 font-bold bg-slate-50 border border-slate-100 rounded-lg p-2 flex items-center gap-1.5">
                  <span className="text-slate-400">Account:</span>
                  <span className="text-slate-600 truncate font-mono">{status.userEmail}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100">
            {loading ? (
              <button
                disabled
                className="w-full py-3 px-4 bg-slate-100 text-slate-400 font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2"
              >
                <svg className="animate-spin h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking status...
              </button>
            ) : isConnected ? (
              <button
                onClick={handleUninstall}
                disabled={actionLoading}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold text-sm rounded-2xl transition shadow-lg shadow-red-600/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uninstalling...
                  </>
                ) : (
                  <>
                    Uninstall
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </>
                )}
              </button>
            ) : (
              <Link
                href="/admin/gmail-oauth"
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-extrabold text-sm rounded-2xl transition shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
              >
                Configure Connection
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {/* Placeholder: Other integrations (e.g. Stripe, AWS) */}
        <div className="bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header / Icon */}
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
            {/* Header / Icon */}
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
