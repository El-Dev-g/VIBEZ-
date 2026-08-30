'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Code, Terminal, Smartphone, Server, Cpu } from 'lucide-react';
import { CodeBlock } from '../../components/CodeBlock';

type SdkType = 'kotlin' | 'ts' | 'python' | 'go';

const VALID_SDKS: SdkType[] = ['kotlin', 'ts', 'python', 'go'];

function SdksContent() {
  const searchParams = useSearchParams();
  const [selectedSdk, setSelectedSdk] = useState<SdkType>('kotlin');

  useEffect(() => {
    const sdkParam = searchParams?.get('sdk') as SdkType;
    if (sdkParam && VALID_SDKS.includes(sdkParam)) {
      setSelectedSdk(sdkParam);
      return;
    }

    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '') as SdkType;
      if (hash && VALID_SDKS.includes(hash)) {
        setSelectedSdk(hash);
        return;
      }

      const saved = localStorage.getItem('vibez_active_sdk') as SdkType;
      if (saved && VALID_SDKS.includes(saved)) {
        setSelectedSdk(saved);
      }
    }
  }, [searchParams]);

  const handleSelectSdk = (sdk: SdkType) => {
    setSelectedSdk(sdk);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vibez_active_sdk', sdk);
      const url = new URL(window.location.href);
      url.searchParams.set('sdk', sdk);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const sdkDetails = {
    kotlin: {
      name: 'Android Kotlin SDK',
      version: 'v2.4.0',
      badge: 'Official Mobile SDK',
      install: `// app/build.gradle.kts
dependencies {
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("io.socket:socket.io-client:2.1.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")
}`,
      code: `package com.example.data.network

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import io.socket.client.IO
import io.socket.client.Socket

object VibezClient {
    private const val BASE_URL = "https://vibez-n5h1.onrender.com/api/"
    
    val api: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }

    fun createSocket(token: String): Socket {
        val options = IO.Options().apply {
            query = "token=$token"
            transports = arrayOf("websocket")
        }
        return IO.socket("https://vibez-n5h1.onrender.com", options)
    }
}`
    },
    ts: {
      name: 'TypeScript / Node.js SDK',
      version: 'v2.4.0',
      badge: 'Official Web & Backend SDK',
      install: `npm install @vibez/sdk socket.io-client axios`,
      code: `import { VibezClient } from '@vibez/sdk';
import { io } from 'socket.io-client';

const vibez = new VibezClient({
  apiKey: process.env.VIBEZ_API_KEY,
  baseUrl: 'https://vibez-n5h1.onrender.com/api'
});

// 1. Dispatch message
async function sendNotification(recipientId: string, text: string) {
  const message = await vibez.messages.send({
    recipientId,
    content: text,
    type: 'TEXT'
  });
  console.log('Delivered message ID:', message.id);
}

// 2. Listen to real-time events
const socket = io('https://vibez-n5h1.onrender.com', {
  auth: { token: 'YOUR_JWT_OR_API_KEY' },
  transports: ['websocket']
});

socket.on('message:received', (payload) => {
  console.log('Real-time message received:', payload);
});`
    },
    python: {
      name: 'Python Client',
      version: 'v2.4.0',
      badge: 'Official Python Client',
      install: `pip install requests python-socketio[client]`,
      code: `import requests
import socketio

BASE_URL = "https://vibez-n5h1.onrender.com/api"
API_KEY = "vbz_live_your_token_here"

headers = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY
}

# 1. Send OTP Request
def request_otp(phone_number: str):
    res = requests.post(f"{BASE_URL}/auth/phone/otp", json={"phoneNumber": phone_number}, headers=headers)
    return res.json()

# 2. Real-time Socket.IO listener
sio = socketio.Client()

@sio.event
def connect():
    print("Connected to VIBEZ real-time cluster (Powered by PRIGID GROUP)")

@sio.on("message:received")
def on_message(data):
    print("Inbound message:", data)

sio.connect("https://vibez-n5h1.onrender.com", headers={"X-API-Key": API_KEY})`
    },
    go: {
      name: 'Go Client',
      version: 'v2.4.0',
      badge: 'Official Go Library',
      install: `go get github.com/vibez-network/vibez-go-sdk`,
      code: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type OTPRequest struct {
	PhoneNumber string \`json:"phoneNumber"\`
}

func main() {
	url := "https://vibez-n5h1.onrender.com/api/auth/phone/otp"
	payload := OTPRequest{PhoneNumber: "+1234567890"}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", "vbz_live_your_token_here")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	fmt.Println("HTTP Status:", resp.Status)
}`
    }
  };

  const active = sdkDetails[selectedSdk];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold mb-2">
            <Code className="w-3.5 h-3.5" />
            <span>Developer SDKs</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Software Development Kits (SDKs)</h1>
          <p className="text-slate-400 text-sm mt-1">
            Official libraries and native integrations across platforms • Powered by <span className="text-emerald-400 font-bold">PRIGID GROUP</span>
          </p>
        </div>
      </div>

      {/* SDK Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { id: 'kotlin', name: 'Android / Kotlin', icon: Smartphone },
          { id: 'ts', name: 'TypeScript / Node', icon: Server },
          { id: 'python', name: 'Python', icon: Cpu },
          { id: 'go', name: 'Go', icon: Terminal },
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = selectedSdk === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectSdk(item.id as any)}
              className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                isSelected
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-white shadow-lg shadow-emerald-500/10'
                  : 'bg-[#070b14] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className={`p-2 rounded-xl ${isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider">{item.name}</div>
                <div className="text-[10px] text-slate-500 font-mono">v2.4.0</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active SDK Details */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-white">{active.name}</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
              {active.badge}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Installation & Setup</h4>
          <CodeBlock code={active.install} language="bash" title="Package Installation" />
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Usage Example</h4>
          <CodeBlock code={active.code} language={selectedSdk === 'kotlin' ? 'kotlin' : selectedSdk === 'ts' ? 'typescript' : selectedSdk === 'python' ? 'python' : 'go'} title={`${active.name} Snippet`} />
        </div>
      </div>
    </div>
  );
}

export default function SdksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading SDK packages...</span>
        </div>
      </div>
    }>
      <SdksContent />
    </Suspense>
  );
}
