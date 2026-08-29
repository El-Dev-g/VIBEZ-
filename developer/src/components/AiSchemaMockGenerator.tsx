'use client';

import React, { useState } from 'react';
import { Sparkles, Code2, Copy, Check, Wand2, ArrowRight, Layers } from 'lucide-react';

export const AiSchemaMockGenerator: React.FC = () => {
  const [endpointType, setEndpointType] = useState('Messaging & Chat');
  const [targetSdk, setTargetSdk] = useState<'Kotlin' | 'TypeScript' | 'Python' | 'Go'>('Kotlin');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mockOutput, setMockOutput] = useState('// Generator ready. Select an endpoint and target SDK to begin.');

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      if (targetSdk === 'Kotlin') {
        setMockOutput(`// Auto-Generated Kotlin Data Model & Mock Response
package com.example.vibez.model

import kotlinx.serialization.Serializable

@Serializable
data class ${endpointType.replace(/[^a-zA-Z]/g, '')}Response(
    val status: String = "success",
    val messageId: String = "msg_${Math.random().toString(36).substring(2, 10)}",
    val timestamp: Long = System.currentTimeMillis(),
    val senderVerified: Boolean = true,
    val prigidSignature: String = "sha256_${Math.random().toString(36).substring(2, 14)}"
)`);
      } else if (targetSdk === 'TypeScript') {
        setMockOutput(`// Auto-Generated TypeScript Interface & Mock
export interface Vibez${endpointType.replace(/[^a-zA-Z]/g, '')}Payload {
  status: 'success' | 'pending';
  id: string;
  sender: {
    userId: string;
    verifiedBadge: boolean;
  };
  dispatchedAt: number;
}

export const mock${endpointType.replace(/[^a-zA-Z]/g, '')}: Vibez${endpointType.replace(/[^a-zA-Z]/g, '')}Payload = {
  status: 'success',
  id: 'evt_${Math.random().toString(36).substring(2, 10)}',
  sender: {
    userId: 'usr_mock_991',
    verifiedBadge: true
  },
  dispatchedAt: Date.now()
};`);
      } else if (targetSdk === 'Python') {
        setMockOutput(`# Auto-Generated Python Pydantic Model & Mock
from pydantic import BaseModel, Field
import time

class ${endpointType.replace(/[^a-zA-Z]/g, '')}Schema(BaseModel):
    status: str = "success"
    transaction_id: str = "tx_${Math.random().toString(36).substring(2, 10)}"
    timestamp: float = Field(default_factory=time.time)
    verified: bool = True

mock_data = ${endpointType.replace(/[^a-zA-Z]/g, '')}Schema().dict()`);
      } else {
        setMockOutput(`// Auto-Generated Go Struct & Mock Factory
package vibez

type ${endpointType.replace(/[^a-zA-Z]/g, '')}Payload struct {
    Status    string \`json:"status"\`
    EventID   string \`json:"event_id"\`
    Timestamp int64  \`json:"timestamp"\`
    Verified  bool   \`json:"verified"\`
}

func NewMock${endpointType.replace(/[^a-zA-Z]/g, '')}() ${endpointType.replace(/[^a-zA-Z]/g, '')}Payload {
    return ${endpointType.replace(/[^a-zA-Z]/g, '')}Payload{
        Status:    "success",
        EventID:   "go_evt_${Math.random().toString(36).substring(2, 8)}",
        Timestamp: 1787923500,
        Verified:  true,
    }
}`);
      }
    }, 600);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(mockOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-black uppercase tracking-wider text-white">
              AI Schema & Mock Generator
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-generate strongly-typed models, test fixtures, and mock payloads for all 4 SDKs • Powered by <span className="text-emerald-400 font-bold">PRIGID GROUP</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['Kotlin', 'TypeScript', 'Python', 'Go'] as const).map((sdk) => (
            <button
              key={sdk}
              type="button"
              onClick={() => setTargetSdk(sdk)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                targetSdk === sdk
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {sdk}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Generator Controls */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-4 shadow-xl">
          <div>
            <label className="block text-xs font-mono text-slate-300 font-bold mb-2">Endpoint Schema Category</label>
            <select
              value={endpointType}
              onChange={(e) => setEndpointType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
            >
              <option value="Messaging & Chat">Messaging & Chat (POST /api/messages)</option>
              <option value="Phone OTP Authentication">Phone OTP Authentication (POST /api/auth/phone/otp)</option>
              <option value="Statuses & Stories">Statuses & Stories (POST /api/statuses)</option>
              <option value="Verified Badge Checkout">Verified Badge Checkout (POST /api/verification/checkout)</option>
              <option value="WebRTC Signaling">WebRTC Signaling (WS /api/calls/signaling)</option>
            </select>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono text-slate-400">
            <div className="text-white font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target: {targetSdk} Architecture</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Generates serialization decorators, constructors, and PRIGID signature verifiers ready for immediate drop-in integration.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10"
          >
            <Wand2 className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generating Schema...' : 'Generate Schema & Mock'}</span>
          </button>
        </div>

        {/* Code Output */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#070b14] border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Generated Code Preview</span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs font-mono text-emerald-400 hover:text-emerald-300 font-bold"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-72 leading-relaxed">
            {mockOutput}
          </pre>
        </div>
      </div>
    </div>
  );
};
