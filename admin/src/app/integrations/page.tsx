'use client';
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { fetchGmailOAuthStatus, disconnectGmailOAuth, getGmailOAuthStartUrl, GmailOAuthStatus } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function IntegrationsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<GmailOAuthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  useEffect(() => {
    const statusParam = searchParams.get('status');
    const messageParam = searchParams.get('message');
    const emailParam = searchParams.get('email');

    if (statusParam === 'connected') {
      setNotification({
        type: 'success',
        text: `Successfully Connected support account: ${emailParam || 'Gmail Authorized'}`
      });
    } else if (statusParam === 'error') {
      setNotification({
        type: 'error',
        text: messageParam || 'Authorization failed'
      });
    }
  }, [searchParams]);

  const handleConnectGmail = async () => {
    if (!isAdmin) return;
    setActionLoading(true);
    setNotification(null);
    try {
      const url = await getGmailOAuthStartUrl();
      if (url) {
        window.location.href = url;
      } else {
        setNotification({
          type: 'error',
          text: 'Failed to initiate Google OAuth. Please check server configuration.'
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: 'error',
        text: 'Failed to connect to Google OAuth.'
      });
    } finally {
      setActionLoading(false);
    }
  };

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
        setNotification({
          type: 'success',
          text: 'Successfully disconnected and uninstalled the Gmail Support Delivery integration.'
        });
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
  const healthOk = status?.health?.ok !== false;
  const healthMessage = status?.health?.message;

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

      {/* Dynamic Toast/Banner Notification */}
      {notification && (
        <div className={`p-5 rounded-3xl border ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
            : 'bg-red-50 text-red-800 border-red-100'
        } shadow-md flex items-center justify-between gap-4 animate-fadeIn`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <svg className="w-6 h-6 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p className="font-extrabold text-sm">{notification.text}</p>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Grid of integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Gmail Integration Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl shadow-slate-200/50 flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden">
          {/* Status Indicator Bar */}
          {isConnected && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500 animate-pulse" />
          )}

          <div className="space-y-4">
            {/* Header / Icon */}
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-white shadow-md shadow-slate-100 rounded-2xl border border-slate-100 shrink-0 flex items-center justify-center">
                {/* Official Gmail Multicolor SVG Icon */}
                <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none">
                  <path d="M20 4H18V13.5L12 18L6 13.5V4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" fill="#EAEAEA" />
                  <path d="M22 6V13.5L18 10.5V4H20C21.1 4 22 4.9 22 6Z" fill="#C5221F" />
                  <path d="M2 6V13.5L6 10.5V4H4C2.9 4 2 4.9 2 6Z" fill="#B31412" />
                  <path d="M18 4H15V11L12 13L9 11V4H6V13.5L12 18L18 13.5V4Z" fill="#EA4335" />
                  <path d="M12 13L6 8.5V4L12 8.5L18 4V8.5L12 13Z" fill="#F83A22" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                {loading ? (
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
                ) : isConnected ? (
                  healthOk ? (
                    <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Active
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-red-50 border border-red-100 text-red-600 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      Issue
                    </span>
                  )
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
                <div className="mt-2 space-y-2">
                  <div className="text-xs text-slate-400 font-bold bg-slate-50 border border-slate-100 rounded-lg p-2 flex items-center gap-1.5">
                    <span className="text-slate-400">Account:</span>
                    <span className="text-slate-600 truncate font-mono">{status.userEmail}</span>
                  </div>
                  {!healthOk && (
                    <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-[10px] font-black text-red-600 uppercase tracking-tight flex items-start gap-2">
                      <span className="text-sm">⚠️</span>
                      <div>
                        <p>Connection Issue</p>
                        <p className="opacity-70 normal-case font-bold">{healthMessage || 'Token has been expired or revoked.'}</p>
                        <p className="mt-1 underline cursor-pointer" onClick={handleConnectGmail}>Click to Re-authenticate</p>
                      </div>
                    </div>
                  )}
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
              <button
                onClick={handleConnectGmail}
                disabled={actionLoading}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-extrabold text-sm rounded-2xl transition shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Initiating...
                  </>
                ) : (
                  <>
                    Configure Connection
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Placeholder: Stripe Integration Card */}
        <div className="bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header / Icon */}
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-white shadow-md shadow-slate-100 rounded-2xl border border-slate-100 shrink-0 flex items-center justify-center">
                {/* Official Stripe SVG */}
                <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none">
                  <path d="M13.958 10.37c0-.7-.523-1.124-1.396-1.124-.954 0-1.865.261-2.617.653V7.27c.883-.326 1.897-.49 2.871-.49 2.502 0 4.103 1.157 4.103 3.493v6.791c0 .85.163 1.404.49 1.73v.164h-2.906a1.992 1.992 0 0 1-.163-.75c-.588.587-1.47.914-2.481.914-2.155 0-3.624-1.142-3.624-2.905 0-2.318 1.991-3.134 4.54-3.134.718 0 1.501.098 2.181.229v-.05zm0 1.959a4.802 4.802 0 0 0-1.436-.196c-1.339 0-2.09.424-2.09 1.257 0 .75.62 1.143 1.485 1.143.833 0 1.502-.327 1.874-.75v-1.454z" fill="#635BFF" />
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1.47 14.153c0 .882-.718 1.143-1.893 1.143-.882 0-1.73-.228-2.384-.522v-1.991c.653.326 1.404.49 2.057.49.522 0 .783-.13.783-.424 0-.816-3.46-.685-3.46-3.003 0-1.502 1.306-2.481 3.264-2.481.784 0 1.502.13 2.122.392v1.893c-.555-.261-1.175-.392-1.763-.392-.457 0-.686.13-.686.392 0 .816 3.46.62 3.46 2.945v.057z" fill="#635BFF" />
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

        {/* Placeholder: PayPal Integration Card */}
        <div className="bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header / Icon */}
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-white shadow-md shadow-slate-100 rounded-2xl border border-slate-100 shrink-0 flex items-center justify-center">
                {/* Official PayPal Overlapping P SVG */}
                <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none">
                  <path d="M8 2.21C8.21 2.07 8.46 2 8.71 2H15.5C18.5 2 20.5 3.5 20.5 6.5C20.5 9.15 18.8 11.21 16.2 11.75C15.9 11.81 15.65 12 15.5 12.25L13.5 17.5C13.36 17.81 13.04 18 12.71 18H9.5C9.15 18 8.85 17.75 8.79 17.4L6.15 4.54C6.08 4.19 6.27 3.84 6.6 3.73L8 3.21V2.21Z" fill="#003087" opacity="0.15" />
                  <path d="M14.5 7.5C14.5 9.43 12.93 11 11 11H8.5L7.22 4.6C7.15 4.25 7.42 3.92 7.78 3.92H11C12.93 3.92 14.5 5.49 14.5 7.5Z" fill="#003087" />
                  <path d="M17.5 10.5C17.5 12.43 15.93 14 14 14H11.5L10.22 7.6C10.15 7.25 10.42 6.92 10.78 6.92H14C15.93 6.92 17.5 8.49 17.5 10.5Z" fill="#0079C1" />
                </svg>
              </div>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider rounded-lg">
                Billing
              </span>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-400 tracking-tight">PayPal Platform</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                Connect your business PayPal merchant ID to support direct standard Express Checkout, smart debit/credit buttons, and invoice generation.
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

        {/* Placeholder: Backup Storage S3 */}
        <div className="bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header / Icon */}
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-white shadow-md shadow-slate-100 rounded-2xl border border-slate-100 shrink-0 flex items-center justify-center">
                {/* Official AWS S3 Bucket SVG */}
                <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 4.24 2 7V17C2 19.76 6.48 22 12 22C17.52 22 22 19.76 22 17V7C22 4.24 17.52 2 12 2ZM20 7C20 8.04 16.42 9.5 12 9.5C7.58 9.5 4 8.04 4 7C4 5.96 7.58 4.5 12 4.5C16.42 4.5 20 5.96 20 7ZM4 9.82C5.91 10.87 8.84 11.5 12 11.5C15.16 11.5 18.09 10.87 20 9.82V12C20 13.04 16.42 14.5 12 14.5C7.58 14.5 4 13.04 4 12V9.82ZM4 14.82C5.91 15.87 8.84 16.5 12 16.5C15.16 16.5 18.09 15.87 20 14.82V17C20 18.04 16.42 19.5 12 19.5C7.58 19.5 4 18.04 4 17V14.82Z" fill="#FF9900" />
                  <ellipse cx="12" cy="7" rx="5" ry="1.5" fill="#E07700" />
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

export default function IntegrationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        </div>
      }
    >
      <IntegrationsContent />
    </Suspense>
  );
}
