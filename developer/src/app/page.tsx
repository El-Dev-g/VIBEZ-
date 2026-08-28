'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Terminal, Shield, Zap, Radio, Database, ArrowRight, Play, Server, BookOpen, CheckCircle2 } from 'lucide-react';
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
    <div className="space-y-16 pb-20 text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-16 border-b border-slate-800/60 bg-[#030712]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>VIBEZ DEVELOPER PLATFORM</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-normal">PRIGID GROUP</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-3xl leading-[1.1]">
            Build Real-Time Messaging & APIs with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">VIBEZ</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
            A unified suite of REST APIs, WebSocket real-time streams, WebRTC call signaling, and phone authentication built for high reliability.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 items-center">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Launch Console</span>
            </Link>

            <Link
              href="/explorer"
              className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-white font-bold text-xs transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              <span>Sandbox API Explorer</span>
            </Link>

            <Link
              href="/docs"
              className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>API Reference</span>
            </Link>

            <Link
              href="/server-codes"
              className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-300 font-bold text-xs transition-all flex items-center gap-2"
            >
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Server Boilerplates</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Quickstart & Code Preview */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-5">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Quick Integration
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              One Unified API Architecture
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Use standard API keys, JSON payloads, and instant WebSocket events across Node.js, Android Kotlin, Python, or raw cURL.
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Phone & OTP Authentication</h4>
                  <p className="text-xs text-slate-400 mt-0.5">End-to-end SMS OTP dispatch and JWT session verification.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Real-Time WebSocket Messaging</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Socket.IO real-time event streaming and typing status.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">WebRTC Voice & Video Signaling</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Peer-to-peer SDP exchanges and ICE candidate relay.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="text-xs font-mono font-bold text-slate-300">
                  POST /api/auth/phone/otp
                </div>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  {(['curl', 'node', 'kotlin', 'python'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setActiveLang(lang)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase transition-all ${
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

              <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1.5">
                  <span>Response</span>
                  <span className="text-emerald-400 font-bold">200 OK (38ms)</span>
                </div>
                <pre className="text-xs font-mono text-emerald-300 overflow-x-auto p-2">
{`{
  "success": true,
  "message": "OTP dispatched successfully",
  "data": {
    "verificationId": "vfy_89b21e04a9",
    "expiresIn": 300
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Modules */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h3 className="text-2xl font-black text-white tracking-tight">
            Developer Ecosystem Modules
          </h3>
          <p className="text-slate-400 text-xs mt-1.5">
            Everything you need to configure and manage your integration.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/docs#messaging" className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-emerald-500/40 transition-all group">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-base mb-3 group-hover:scale-105 transition-transform">
              💬
            </div>
            <h4 className="text-sm font-bold text-white">Messaging API</h4>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Send messages, voice notes, stickers, and system notifications with pagination.
            </p>
            <div className="inline-flex items-center gap-1 text-xs text-emerald-400 font-bold mt-4">
              <span>Explore Docs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link href="/docs#calls" className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-teal-500/40 transition-all group">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-base mb-3 group-hover:scale-105 transition-transform">
              📞
            </div>
            <h4 className="text-sm font-bold text-white">Call Engine</h4>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              WebRTC SDP offers/answers, ICE relays, and audio/video call status telemetry.
            </p>
            <div className="inline-flex items-center gap-1 text-xs text-teal-400 font-bold mt-4">
              <span>View Specs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link href="/webhooks" className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-purple-500/40 transition-all group">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-base mb-3 group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <h4 className="text-sm font-bold text-white">Webhooks</h4>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Subscribe to real-time events with HMAC SHA-256 signature verification.
            </p>
            <div className="inline-flex items-center gap-1 text-xs text-purple-400 font-bold mt-4">
              <span>Configure Webhooks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link href="/server-codes" className="p-5 rounded-2xl bg-slate-900/40 border border-emerald-500/30 hover:border-emerald-400 transition-all group">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-base mb-3 group-hover:scale-105 transition-transform">
              🛠️
            </div>
            <h4 className="text-sm font-bold text-white">Server Codes</h4>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Starter code for Node.js, Python, Kotlin, Go, Rust, and Java.
            </p>
            <div className="inline-flex items-center gap-1 text-xs text-emerald-400 font-bold mt-4">
              <span>Get Boilerplates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* Enterprise Architecture Banner */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="text-xs font-mono font-bold text-emerald-400 uppercase">
              Enterprise Infrastructure
            </div>
            <h3 className="text-lg font-bold text-white">
              High-Availability Global API Architecture
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Node.js microservices, PostgreSQL storage, Redis Pub/Sub, and Socket.IO real-time clusters.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 transition-all shrink-0"
          >
            Open Developer Console
          </Link>
        </div>
      </section>
    </div>
  );
}
