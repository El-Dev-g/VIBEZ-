'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  fetchGmailOAuthStatus,
  getGmailOAuthStartUrl,
  sendGmailOAuthTestEmail,
  GmailOAuthStatus
} from '../../services/api';

function GmailOAuthContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<GmailOAuthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [testEmail, setTestEmail] = useState<string>('prigidcollection@gmail.com');
  const [sendingTest, setSendingTest] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  const [bannerAlert, setBannerAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    const data = await fetchGmailOAuthStatus();
    setStatus(data);
    setLoading(false);
  };

  useEffect(() => {
    loadStatus();

    // Check URL parameters for status
    const statusParam = searchParams.get('status');
    const messageParam = searchParams.get('message');
    const emailParam = searchParams.get('email');

    if (statusParam === 'connected') {
      setBannerAlert({
        type: 'success',
        message: `Gmail authorization successful! Connected account: ${emailParam || 'prigidcollection@gmail.com'}. VIBEZ can now send support emails via Gmail REST API.`
      });
    } else if (statusParam === 'error') {
      setBannerAlert({
        type: 'error',
        message: `Google OAuth Authorization Failed: ${messageParam || 'An error occurred during Google authorization.'}`
      });
    }
  }, [searchParams]);

  const handleConnectGmail = async () => {
    setConnecting(true);
    try {
      const url = await getGmailOAuthStartUrl();
      if (url) {
        window.location.href = url;
      } else {
        // Fallback to direct navigation to backend start endpoint
        window.location.href = '/api/admin/gmail-oauth/start';
      }
    } catch (err) {
      console.error(err);
      setBannerAlert({
        type: 'error',
        message: 'Failed to initiate Google OAuth authorization flow.'
      });
      setConnecting(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testEmail.trim()) return;

    setSendingTest(true);
    setTestResult(null);

    const res = await sendGmailOAuthTestEmail(testEmail.trim());
    setTestResult(res);
    setSendingTest(false);
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
            Hidden Administration & Verification Tool
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Gmail API OAuth Authorization</h1>
          <p className="text-gray-400 text-sm mt-1">
            Authorize VIBEZ Support Email (<code className="text-indigo-300">prigidcollection@gmail.com</code>) to send customer replies and system notifications via Gmail REST API.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/inquiries"
            className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition border border-gray-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Support Inquiries
          </Link>
          <button
            onClick={loadStatus}
            disabled={loading}
            className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition border border-gray-700"
            title="Refresh Status"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dynamic Status Alert Banner */}
      {bannerAlert && (
        <div
          className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
            bannerAlert.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/40 border-red-500/40 text-red-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {bannerAlert.type === 'success' ? (
              <svg className="w-6 h-6 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <div className="text-sm font-medium">{bannerAlert.message}</div>
          </div>
          <button onClick={() => setBannerAlert(null)} className="text-gray-400 hover:text-white text-sm font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Critical Security & Purpose Banner */}
      <div className="bg-gradient-to-r from-indigo-950/50 via-purple-950/30 to-gray-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-600/20 border border-indigo-500/40 rounded-xl text-indigo-400 shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-white">OAuth Scope Verification Context</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              <strong>VIBEZ Administrator Authentication:</strong> Administrators authenticate exclusively via standard email/password and optional 2FA credentials at <code className="text-indigo-300">/api/admin/login</code>. Google OAuth is <strong>NOT</strong> used for admin login.
            </p>
            <p className="text-sm text-gray-300 leading-relaxed">
              <strong>Purpose of Sensitive Scope (<code className="text-indigo-300">gmail.send</code>):</strong> Google OAuth authorization is strictly used to obtain a refresh token for the official customer-support email (<code className="text-indigo-300">prigidcollection@gmail.com</code>). This enables the VIBEZ backend to reliably dispatch user support replies and account verifications over Port 443 HTTPS.
            </p>
          </div>
        </div>
      </div>

      {/* Integration Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Connection Status */}
        <div className="lg:col-span-1 bg-gray-900/80 border border-gray-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Connection State</span>
              {loading ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-400 animate-pulse">
                  Checking...
                </span>
              ) : status?.authorized ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Active & Connected
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-600/40">
                  Not Authorized
                </span>
              )}
            </div>

            <div className="space-y-4 text-sm">
              <div className="p-3.5 bg-gray-950/70 border border-gray-800 rounded-xl space-y-1">
                <div className="text-xs text-gray-400">Authorized Sender</div>
                <div className="font-mono text-xs text-indigo-300 font-semibold truncate">
                  {status?.userEmail || 'prigidcollection@gmail.com'}
                </div>
              </div>

              <div className="p-3.5 bg-gray-950/70 border border-gray-800 rounded-xl space-y-1">
                <div className="text-xs text-gray-400">Granted OAuth Scope</div>
                <div className="font-mono text-xs text-emerald-400 font-semibold break-all">
                  https://www.googleapis.com/auth/gmail.send
                </div>
              </div>

              <div className="p-3.5 bg-gray-950/70 border border-gray-800 rounded-xl space-y-1">
                <div className="text-xs text-gray-400">Delivery Protocol</div>
                <div className="font-mono text-xs text-purple-300 font-semibold">
                  Gmail REST API (Port 443 HTTPS)
                </div>
              </div>

              {status?.lastAuthorized && (
                <div className="p-3.5 bg-gray-950/70 border border-gray-800 rounded-xl space-y-1">
                  <div className="text-xs text-gray-400">Last Authorized</div>
                  <div className="font-mono text-xs text-gray-300">
                    {new Date(status.lastAuthorized).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleConnectGmail}
            disabled={connecting}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {connecting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Redirecting to Google...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                {status?.authorized ? 'Re-authorize Gmail Account' : 'Connect Gmail Account'}
              </>
            )}
          </button>
        </div>

        {/* Right Column: Interactive Test Console & Reviewer Verification Steps */}
        <div className="lg:col-span-2 space-y-6">
          {/* Real-time Email Test Console */}
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Interactive Gmail API Test Console</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Send a live test verification email directly through the Gmail API (<code className="text-indigo-300">gmail.send</code>).
                </p>
              </div>
              <span className="px-2.5 py-1 bg-purple-950/60 border border-purple-600/30 text-purple-300 text-xs font-mono rounded-lg">
                Port 443 HTTPS
              </span>
            </div>

            <form onSubmit={handleSendTestEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Destination Recipient Email
                </label>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    required
                    placeholder="Enter email to receive test message..."
                    className="flex-1 px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 font-mono transition"
                  />
                  <button
                    type="submit"
                    disabled={sendingTest || !testEmail}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50 shrink-0"
                  >
                    {sendingTest ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending via API...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send Test Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Test Result Display */}
            {testResult && (
              <div
                className={`p-4 rounded-xl border text-sm ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/40 border-red-500/40 text-red-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {testResult.success ? (
                    <>
                      <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Test Email Dispatched Successfully!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Delivery Failed
                    </>
                  )}
                </div>
                <div className="font-mono text-xs text-gray-300 break-all pl-7">
                  {testResult.message || testResult.error}
                </div>
              </div>
            )}
          </div>

          {/* Verification Video Demonstration Instructions */}
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Google Reviewer Demonstration Checklist
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-300">
              <div className="p-3 bg-gray-950/70 border border-gray-800 rounded-xl space-y-1">
                <div className="font-bold text-indigo-400">1. Admin Authentication</div>
                <p className="text-gray-400">
                  Log in to VIBEZ Admin with your administrator account.
                </p>
              </div>

              <div className="p-3 bg-gray-950/70 border border-gray-800 rounded-xl space-y-1">
                <div className="font-bold text-indigo-400">2. OAuth Consent Flow</div>
                <p className="text-gray-400">
                  Click "Connect Gmail Account" to open Google OAuth screen showing project <code className="text-gray-200">vibez-506519</code>.
                </p>
              </div>

              <div className="p-3 bg-gray-950/70 border border-gray-800 rounded-xl space-y-1">
                <div className="font-bold text-indigo-400">3. Grant Scope</div>
                <p className="text-gray-400">
                  Grant the <code className="text-gray-200">gmail.send</code> permission for customer-support response delivery.
                </p>
              </div>

              <div className="p-3 bg-gray-950/70 border border-gray-800 rounded-xl space-y-1">
                <div className="font-bold text-indigo-400">4. Live Verification</div>
                <p className="text-gray-400">
                  Use the test console or reply to a customer inquiry in <Link href="/inquiries" className="text-indigo-400 underline">Inquiries</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GmailOAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        </div>
      }
    >
      <GmailOAuthContent />
    </Suspense>
  );
}
