'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Terminal, Shield, Zap, Radio, Database, ArrowRight, CheckCircle2, Play, Copy, Check } from 'lucide-react';
import { CodeBlock } from '../components/CodeBlock';

export default function OverviewPage() {
  const [activeLang, setActiveLang] = useState<'curl' | 'node' | 'kotlin' | 'python'>('curl');

  const snippets = {
    curl: `curl -X POST "https://vibez-n5h1.onrender.com/api/auth/phone/otp" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: vbz_live_9f8a42b8e6120" \\
  -d '{
    "phoneNumber": "+1234567890"
  }'`,
    node: `import { VibezClient } from '@vibez/sdk';

const vibez = new VibezClient({
  apiKey: 'vbz_live_9f8a42b8e6120',
  baseUrl: 'https://vibez-n5h1.onrender.com/api'
});

// Request authentication OTP
const response = await vibez.auth.requestPhoneOtp({
  phoneNumber: '+1234567890'
});

console.log('OTP Status:', response.status);`,
    kotlin: `import com.example.data.network.NetworkClient
import com.example.data.network.PhoneAuthRequest

val apiService = NetworkClient.apiService

val response = apiService.requestPhoneOtp(
    PhoneAuthRequest(phoneNumber = "+1234567890")
)

if (response.isSuccessful) {
    println("Auth Challenge Dispatched: \${response.body()?.message}")
}`,
    python: `import requests

url = "https://vibez-n5h1.onrender.com/api/auth/phone/otp"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "vbz_live_9f8a42b8e6120"
}
payload = {
    "phoneNumber": "+1234567890"
}

res = requests.post(url, json=payload, headers=headers)
print("Response:", res.json())`
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 border-b border-slate-800/80 bg-gradient-to-b from-[#0e1626] to-[#090d16]">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>VIBEZ API ENGINE v2.4</span>
            <span className="text-slate-500">|</span>
            <span>Powered by PRIGID GROUP</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl leading-tight">
            Build Real-Time Communication & Messaging with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">VIBEZ APIs</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl leading-relaxed">
            Integrate ultra-low latency real-time messaging, end-to-end phone authentication, WebRTC calls, verified badges, and automated webhooks into your applications.
          </p>

          <div className="mt-10 flex flex-wrap gap-4 items-center">
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm uppercase tracking-wider hover:opacity-95 shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 active:scale-95"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Launch Developer Dashboard</span>
            </Link>

            <Link
              href="/server-codes"
              className="px-6 py-3 rounded-xl bg-slate-900 border border-emerald-500/50 text-white font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Developer Server Codes</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </Link>

            <Link
              href="/explorer"
              className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm hover:border-emerald-500/50 transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              <span>API Explorer Sandbox</span>
            </Link>

            <Link
              href="/register"
              className="px-6 py-3 rounded-xl bg-slate-800/80 text-slate-300 font-bold text-sm hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2"
            >
              <span>Create Account & Keys</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Quickstart & Code Switcher */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-800 text-emerald-400 font-mono text-xs font-bold uppercase">
              Quickstart in 60 seconds
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              One Unified API for Chats, Calls, and Auth
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Authenticate via standard JSON Web Tokens or API keys, dispatch messages across channels, listen for real-time WebSocket socket events, and verify digital identities.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">End-to-End Authentication</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Phone number OTP, Google Identity credential manager, and Admin JWT tokens.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <Radio className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">WebSocket Real-Time Engine</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Socket.IO event streams for instant delivery, typing indicators, and WebRTC call signaling.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <Database className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Citizen & Community Graph</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Manage groups, user directories, broadcast channels, and verified digital receipts.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="text-xs font-mono font-bold text-slate-300">
                  POST /api/auth/phone/otp
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  {(['curl', 'node', 'kotlin', 'python'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setActiveLang(lang)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase transition-all ${
                        activeLang === lang
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <CodeBlock code={snippets[activeLang]} language={activeLang} title={`Sample Request (${activeLang.toUpperCase()})`} />

              <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                  <span>Sample 200 OK Response</span>
                  <span className="text-emerald-400 font-bold">200 OK (38ms)</span>
                </div>
                <pre className="text-xs font-mono text-emerald-300 overflow-x-auto p-2 bg-slate-950 rounded-lg">
{`{
  "success": true,
  "message": "OTP sent to +1234567890",
  "data": {
    "verificationId": "vfy_89b21e04a9",
    "expiresIn": 300,
    "provider": "PRIGID_TELCO_GATEWAY"
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Capabilities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Developer Ecosystem Modules
          </h3>
          <p className="text-slate-400 text-sm mt-3">
            Everything you need to build connected experiences backed by PRIGID GROUP infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
              💬
            </div>
            <h4 className="text-base font-black text-white">Messaging & Channels</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Send text, audio voice notes, images, stickers, and system broadcasts. Query message history with offset pagination.
            </p>
            <Link href="/docs#messaging" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold mt-4 hover:underline">
              <span>View Messaging Endpoints</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-teal-500/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
              📞
            </div>
            <h4 className="text-base font-black text-white">WebRTC & Call Signaling</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Ultra-fast audio & video call handshakes, SDP offer/answer exchanges, ICE candidate multiplexing, and call telemetry logs.
            </p>
            <Link href="/docs#calls" className="inline-flex items-center gap-1.5 text-xs text-teal-400 font-bold mt-4 hover:underline">
              <span>View Call Signaling Specs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
              🛡️
            </div>
            <h4 className="text-base font-black text-white">Identity & Verification</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Verify digital badges, process verification checkout payments, validate phone numbers, and issue encrypted tokens.
            </p>
            <Link href="/docs#verification" className="inline-flex items-center gap-1.5 text-xs text-purple-400 font-bold mt-4 hover:underline">
              <span>View Identity Endpoints</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-emerald-500/40 hover:border-emerald-400 transition-all group shadow-lg shadow-emerald-500/5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
              ⚡
            </div>
            <h4 className="text-base font-black text-white flex items-center gap-2">
              <span>Server Codebases</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded-full font-mono font-bold">New</span>
            </h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Complete backend boilerplates in Node.js, Python, Go, Kotlin, Rust & Java with live HMAC verification and token runners.
            </p>
            <Link href="/server-codes" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-black mt-4 hover:underline">
              <span>Explore Server Codes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Powered by PRIGID GROUP Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-[#0a1220] to-slate-900 border border-slate-800 p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black uppercase tracking-widest">
              Enterprise Grade Infrastructure
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              Built on PRIGID GROUP Global Cloud Architecture
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              High-throughput Node.js microservices, Prisma ORM, Redis Pub/Sub, PostgreSQL storage, and real-time Socket.IO clusters designed for maximum reliability.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href="/explorer"
              className="px-6 py-3.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <span>Test API Live in Sandbox</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
