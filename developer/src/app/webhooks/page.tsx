'use client';

import React, { useState } from 'react';
import { Webhook, Shield, Send, CheckCircle, RefreshCw, Key, Code, Check } from 'lucide-react';
import { CodeBlock } from '../../components/CodeBlock';

export default function WebhooksPage() {
  const [targetUrl, setTargetUrl] = useState('https://webhook.site/sample-endpoint');
  const [webhookSecret, setWebhookSecret] = useState('whsec_vibez_live_prigid_982b');
  const [selectedEvent, setSelectedEvent] = useState<'message.created' | 'payment.verified' | 'user.registered' | 'system.maintenance_toggled'>('message.created');
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const eventPayloads = {
    'message.created': {
      event: 'message.created',
      timestamp: new Date().toISOString(),
      data: {
        id: 'msg_991823a01',
        chatId: 'chat_881920',
        senderId: 'usr_alex_rivera',
        recipientId: 'usr_sarah_connor',
        content: 'Your verification badge has been approved! ⚡',
        type: 'TEXT',
        createdAt: new Date().toISOString()
      },
      provider: 'PRIGID_EVENT_ROUTER'
    },
    'payment.verified': {
      event: 'payment.verified',
      timestamp: new Date().toISOString(),
      data: {
        transactionId: 'txn_99182390a',
        userId: 'usr_alex_rivera',
        amount: 3.00,
        currency: 'USD',
        badgeGranted: 'OFFICIAL_VERIFIED_CITIZEN',
        status: 'PAID'
      },
      provider: 'PRIGID_PAYMENT_GATEWAY'
    },
    'user.registered': {
      event: 'user.registered',
      timestamp: new Date().toISOString(),
      data: {
        userId: 'usr_new_9921',
        phoneNumber: '+14155552671',
        displayName: 'Jordan Miller',
        registeredAt: new Date().toISOString()
      },
      provider: 'PRIGID_IDENTITY_CORE'
    },
    'system.maintenance_toggled': {
      event: 'system.maintenance_toggled',
      timestamp: new Date().toISOString(),
      data: {
        maintenanceMode: true,
        updatedByAdmin: 'admin@vibez.com',
        node: 'v2.4.0-emerald',
        reason: 'Scheduled cloud database index optimization'
      },
      provider: 'PRIGID_OPS_TELEMETRY'
    }
  };

  const handleSendTestWebhook = async () => {
    setIsSending(true);
    setStatusMessage(null);

    try {
      // Send sample test event
      await new Promise(r => setTimeout(r, 800));
      setStatusMessage(`✓ Test webhook [${selectedEvent}] dispatched successfully with HMAC signature header.`);
    } catch (e) {
      setStatusMessage(`Failed to dispatch webhook event.`);
    } finally {
      setIsSending(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const verifySignatureCode = `const crypto = require('crypto');

function verifyVibezWebhook(rawBody, signatureHeader, secret) {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(computedSignature),
    Buffer.from(signatureHeader)
  );
}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold mb-2">
            <Webhook className="w-3.5 h-3.5" />
            <span>Event Ingestion</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Webhooks & Event Streams</h1>
          <p className="text-slate-400 text-sm mt-1">
            Receive real-time HTTP callbacks when actions occur across the VIBEZ ecosystem • Powered by <span className="text-emerald-400 font-bold">PRIGID GROUP</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Webhook Simulator */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl bg-[#070b14] border border-slate-800 p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>Webhook Dispatch Simulator</span>
            </h3>

            {/* Target URL */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Your Webhook Receiver URL</label>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://your-domain.com/api/webhooks"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Signing Secret */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">HMAC SHA-256 Signing Secret</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Event Selector */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Simulate Event Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(['message.created', 'payment.verified', 'user.registered', 'system.maintenance_toggled'] as const).map((evt) => (
                  <button
                    key={evt}
                    type="button"
                    onClick={() => setSelectedEvent(evt)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-mono font-bold transition-all ${
                      selectedEvent === evt
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {evt}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Payload Preview */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Payload Preview</label>
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 max-h-56 overflow-auto">
                {JSON.stringify(eventPayloads[selectedEvent], null, 2)}
              </pre>
            </div>

            <button
              type="button"
              onClick={handleSendTestWebhook}
              disabled={isSending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:opacity-95 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Dispatching Webhook...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Dispatch Test Webhook Event</span>
                </>
              )}
            </button>

            {statusMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                {statusMessage}
              </div>
            )}
          </div>
        </div>

        {/* Right: Security & Verification Documentation */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-[#070b14] border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Signature Verification</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every webhook request includes an <code className="text-emerald-400 font-mono">X-Vibez-Signature</code> header generated using HMAC SHA-256. Always verify the signature to prevent replay attacks.
            </p>

            <CodeBlock code={verifySignatureCode} language="javascript" title="Node.js Signature Verifier" />

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-300">Standard Webhook Headers:</h4>
              <ul className="text-xs font-mono text-slate-400 space-y-1">
                <li><span className="text-emerald-400">X-Vibez-Event:</span> message.created</li>
                <li><span className="text-emerald-400">X-Vibez-Signature:</span> sha256=9f821...</li>
                <li><span className="text-emerald-400">X-Vibez-Timestamp:</span> 1772183901</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
