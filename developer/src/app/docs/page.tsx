'use client';

import React, { useState } from 'react';
import { Shield, MessageSquare, Radio, Users, CheckCircle, Server, Copy, Check, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { CodeBlock } from '../../components/CodeBlock';

interface Endpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  category: string;
  summary: string;
  description: string;
  authRequired: boolean;
  requestBody?: string;
  responseBody: string;
  curlExample: string;
}

export default function DocsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({
    'auth-otp': true,
    'msg-send': true,
    'system-status': true
  });

  const toggleEndpoint = (id: string) => {
    setExpandedEndpoints(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const endpoints: Endpoint[] = [
    {
      id: 'auth-otp',
      method: 'POST',
      path: '/api/auth/phone/otp',
      category: 'Authentication',
      summary: 'Request Phone OTP Challenge',
      description: 'Sends a one-time verification code via SMS or cellular gateway to verify citizen phone number.',
      authRequired: false,
      requestBody: JSON.stringify({
        phoneNumber: "+1234567890"
      }, null, 2),
      responseBody: JSON.stringify({
        success: true,
        message: "OTP sent successfully",
        data: {
          verificationId: "vfy_891bc029f",
          expiresIn: 300
        }
      }, null, 2),
      curlExample: `curl -X POST "https://vibez-n5h1.onrender.com/api/auth/phone/otp" \\
  -H "Content-Type: application/json" \\
  -d '{"phoneNumber": "+1234567890"}'`
    },
    {
      id: 'auth-verify',
      method: 'POST',
      path: '/api/auth/phone/verify',
      category: 'Authentication',
      summary: 'Verify Phone OTP & Issue JWT',
      description: 'Verifies the OTP token and returns an authenticated user profile with a bearer JWT.',
      authRequired: false,
      requestBody: JSON.stringify({
        phoneNumber: "+1234567890",
        code: "123456",
        displayName: "Alex Rivera",
        about: "Hey there! I am using VIBEZ"
      }, null, 2),
      responseBody: JSON.stringify({
        success: true,
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        user: {
          id: "usr_991823a",
          phoneNumber: "+1234567890",
          name: "Alex Rivera",
          isVerified: true
        }
      }, null, 2),
      curlExample: `curl -X POST "https://vibez-n5h1.onrender.com/api/auth/phone/verify" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phoneNumber": "+1234567890",
    "code": "123456",
    "displayName": "Alex Rivera"
  }'`
    },
    {
      id: 'msg-send',
      method: 'POST',
      path: '/api/messages',
      category: 'Messaging',
      summary: 'Dispatch Direct or Group Message',
      description: 'Creates and delivers an encrypted message to a recipient or group channel with real-time WebSocket fanout.',
      authRequired: true,
      requestBody: JSON.stringify({
        recipientId: "usr_551982b",
        chatId: "chat_001928",
        content: "Hello from the VIBEZ API! 🚀",
        type: "TEXT"
      }, null, 2),
      responseBody: JSON.stringify({
        success: true,
        data: {
          id: "msg_7721839a",
          chatId: "chat_001928",
          senderId: "usr_991823a",
          content: "Hello from the VIBEZ API! 🚀",
          type: "TEXT",
          status: "SENT",
          createdAt: "2026-08-28T06:12:00.000Z"
        }
      }, null, 2),
      curlExample: `curl -X POST "https://vibez-n5h1.onrender.com/api/messages" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \\
  -d '{
    "recipientId": "usr_551982b",
    "content": "Hello from VIBEZ API! 🚀",
    "type": "TEXT"
  }'`
    },
    {
      id: 'msg-list',
      method: 'GET',
      path: '/api/chats/:chatId/messages',
      category: 'Messaging',
      summary: 'Retrieve Chat History',
      description: 'Fetches paginated chronological messages for a specific conversation.',
      authRequired: true,
      responseBody: JSON.stringify({
        success: true,
        data: [
          {
            id: "msg_7721839a",
            senderId: "usr_991823a",
            content: "Hey, are you free for a call?",
            type: "TEXT",
            createdAt: "2026-08-28T06:10:00.000Z"
          }
        ],
        pagination: {
          cursor: "msg_7721839a",
          hasMore: false
        }
      }, null, 2),
      curlExample: `curl -X GET "https://vibez-n5h1.onrender.com/api/chats/chat_001928/messages?limit=20" \\
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"`
    },
    {
      id: 'status-create',
      method: 'POST',
      path: '/api/statuses',
      category: 'Statuses',
      summary: 'Publish 24h Expiring Status',
      description: 'Publishes a temporary text or media status broadcast visible to contacts.',
      authRequired: true,
      requestBody: JSON.stringify({
        content: "Working on new APIs with PRIGID GROUP!",
        mediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
        backgroundColor: "#10b981",
        caption: "Launch day!"
      }, null, 2),
      responseBody: JSON.stringify({
        success: true,
        data: {
          id: "st_8819234",
          expiresAt: "2026-08-29T06:12:00.000Z",
          status: "ACTIVE"
        }
      }, null, 2),
      curlExample: `curl -X POST "https://vibez-n5h1.onrender.com/api/statuses" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \\
  -d '{
    "content": "Working with PRIGID GROUP!",
    "backgroundColor": "#10b981"
  }'`
    },
    {
      id: 'verification-checkout',
      method: 'POST',
      path: '/api/verification/checkout',
      category: 'Verification & Badges',
      summary: 'Initiate Badge Verification Checkout',
      description: 'Generates an encrypted checkout session to purchase official VIBEZ verified citizen status.',
      authRequired: true,
      requestBody: JSON.stringify({
        paymentMethod: "STRIPE_CHECKOUT",
        returnUrl: "https://vibez-app.com/verified/success"
      }, null, 2),
      responseBody: JSON.stringify({
        success: true,
        data: {
          checkoutUrl: "https://checkout.stripe.com/pay/cs_live_9921a",
          sessionId: "cs_live_9921a",
          price: 3.00,
          currency: "USD"
        }
      }, null, 2),
      curlExample: `curl -X POST "https://vibez-n5h1.onrender.com/api/verification/checkout" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \\
  -d '{"paymentMethod": "STRIPE_CHECKOUT"}'`
    },
    {
      id: 'system-status',
      method: 'GET',
      path: '/api/system/status',
      category: 'Telemetry',
      summary: 'Query System Operational Mode',
      description: 'Returns real-time operational status (All Systems Operational vs Scheduled Maintenance) and global node metadata.',
      authRequired: false,
      responseBody: JSON.stringify({
        success: true,
        status: "OPERATIONAL",
        maintenanceMode: false,
        allowNewRegistrations: true,
        node: "v2.4.0-emerald",
        poweredBy: "PRIGID GROUP",
        timestamp: "2026-08-28T06:12:00.000Z"
      }, null, 2),
      curlExample: `curl -X GET "https://vibez-n5h1.onrender.com/api/system/status"`
    }
  ];

  const categories = ['all', 'Authentication', 'Messaging', 'Statuses', 'Verification & Badges', 'Telemetry'];

  const filteredEndpoints = selectedCategory === 'all'
    ? endpoints
    : endpoints.filter(e => e.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-8 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold mb-2">
            REST API v2.4 Reference
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">API Documentation & Endpoints</h1>
          <p className="text-slate-400 text-sm mt-1">
            Complete OpenAPI 3.0 specifications for the VIBEZ backend services • Powered by <span className="text-emerald-400 font-bold">PRIGID GROUP</span>
          </p>
        </div>

        {/* Base URL indicator */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300">
          <span className="text-slate-500 font-bold">Base URL:</span>
          <span className="text-emerald-400 font-bold">https://vibez-n5h1.onrender.com</span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 my-8">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedCategory === cat
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat === 'all' ? 'All Endpoints' : cat}
          </button>
        ))}
      </div>

      {/* Endpoints List */}
      <div className="space-y-6">
        {filteredEndpoints.map((ep) => {
          const isExpanded = Boolean(expandedEndpoints[ep.id]);
          const methodColors = {
            GET: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            POST: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            PUT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            PATCH: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
          };

          return (
            <div
              key={ep.id}
              className="rounded-2xl border border-slate-800 bg-[#070b14] overflow-hidden transition-all shadow-xl"
            >
              {/* Header Bar */}
              <button
                type="button"
                onClick={() => toggleEndpoint(ep.id)}
                className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-900/50 transition-colors text-left"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-black border ${methodColors[ep.method]}`}>
                    {ep.method}
                  </span>
                  <span className="font-mono text-sm font-bold text-white tracking-wide">
                    {ep.path}
                  </span>
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                    — {ep.summary}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {ep.authRequired ? (
                    <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                      <Shield className="w-3 h-3" />
                      <span>Bearer Auth</span>
                    </span>
                  ) : (
                    <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                      Public
                    </span>
                  )}
                  {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                </div>
              </button>

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="p-5 border-t border-slate-800 bg-[#050810] space-y-6">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Description</h4>
                    <p className="text-sm text-slate-300">{ep.description}</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Request Schema */}
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                        {ep.requestBody ? 'Request Body (JSON)' : 'Request Parameters'}
                      </h4>
                      {ep.requestBody ? (
                        <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto">
                          {ep.requestBody}
                        </pre>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500 italic">
                          No request body required (GET endpoint)
                        </div>
                      )}

                      <div className="mt-4">
                        <CodeBlock code={ep.curlExample} language="bash" title="cURL Command" />
                      </div>
                    </div>

                    {/* Right: Response Schema */}
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                        200 OK Response Payload
                      </h4>
                      <pre className="p-3.5 rounded-xl bg-slate-950 border border-emerald-900/30 text-xs font-mono text-emerald-300 overflow-x-auto">
                        {ep.responseBody}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
