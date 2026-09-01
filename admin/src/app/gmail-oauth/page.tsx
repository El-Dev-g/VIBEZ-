'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getGmailOAuthStartUrl } from '../../services/api';

function GmailOAuthContent() {
  const searchParams = useSearchParams();
  const [connecting, setConnecting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const statusParam = searchParams.get('status');
    const messageParam = searchParams.get('message');
    const emailParam = searchParams.get('email');

    if (statusParam === 'connected') {
      setMessage({
        type: 'success',
        text: `Connected: ${emailParam || 'Gmail Authorized'}`
      });
    } else if (statusParam === 'error') {
      setMessage({
        type: 'error',
        text: messageParam || 'Authorization failed'
      });
    }
  }, [searchParams]);

  const handleConnectGmail = async () => {
    setConnecting(true);
    setMessage(null);
    try {
      const url = await getGmailOAuthStartUrl();
      if (url) {
        window.location.href = url;
      } else {
        window.location.href = '/api/admin/gmail-oauth/start';
      }
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: 'Failed to initiate Google authorization.'
      });
      setConnecting(false);
    }
  };

  return (
    <div className="gmail-oauth-container min-h-[70vh] flex flex-col items-center justify-center p-6">
      <button
        onClick={handleConnectGmail}
        disabled={connecting}
        className="py-3.5 px-6 bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-900 font-semibold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 border border-gray-200 cursor-pointer"
      >
        {connecting ? (
          <>
            <svg className="animate-spin h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Sign in with Google</span>
          </>
        )}
      </button>
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
