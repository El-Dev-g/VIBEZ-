'use client';

import React, { useState } from 'react';
import { Radio, RefreshCw, Send, ShieldAlert, CheckCircle2, RotateCcw, Play, Check } from 'lucide-react';

interface EventItem {
  id: string;
  eventType: string;
  targetUrl: string;
  status: 'delivered' | 'failed' | 'retrying';
  httpStatus: number;
  attempts: number;
  payload: any;
  timestamp: string;
}

const SAMPLE_EVENTS: EventItem[] = [
  {
    id: 'evt_99182',
    eventType: 'message.created',
    targetUrl: 'https://api.yourdomain.com/webhooks/vibez',
    status: 'delivered',
    httpStatus: 200,
    attempts: 1,
    payload: {
      event: 'message.created',
      messageId: 'msg_881920',
      senderId: 'usr_001',
      recipientId: 'usr_002',
      content: 'Meeting rescheduled to 3 PM',
    },
    timestamp: '2 mins ago',
  },
  {
    id: 'evt_99181',
    eventType: 'payment.verified',
    targetUrl: 'https://api.yourdomain.com/webhooks/vibez',
    status: 'delivered',
    httpStatus: 200,
    attempts: 1,
    payload: {
      event: 'payment.verified',
      transactionId: 'tx_pay_998124',
      badgeTier: 'gold',
      amount: 9.99,
      currency: 'USD',
    },
    timestamp: '15 mins ago',
  },
  {
    id: 'evt_99180',
    eventType: 'user.registered',
    targetUrl: 'https://api.yourdomain.com/webhooks/vibez',
    status: 'failed',
    httpStatus: 504,
    attempts: 3,
    payload: {
      event: 'user.registered',
      userId: 'usr_99182_new',
      phoneNumber: '+15550192834',
    },
    timestamp: '42 mins ago',
  },
];

export const EventReplayStudio: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>(SAMPLE_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<EventItem>(SAMPLE_EVENTS[0]);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replaySuccess, setReplaySuccess] = useState(false);
  const [wsStatus, setWsStatus] = useState<'connected' | 'reconnecting'>('connected');

  const handleReplay = (id: string) => {
    setIsReplaying(true);
    setTimeout(() => {
      setIsReplaying(false);
      setReplaySuccess(true);
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: 'delivered', httpStatus: 200, attempts: e.attempts + 1 } : e))
      );
      if (selectedEvent.id === id) {
        setSelectedEvent({ ...selectedEvent, status: 'delivered', httpStatus: 200, attempts: selectedEvent.attempts + 1 });
      }
      setTimeout(() => setReplaySuccess(false), 2500);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-black uppercase tracking-wider text-white">
              WebSocket & Webhook Event Replay Studio
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulate real-time payloads, replay failed webhooks, and inspect HMAC SHA-256 signatures • Powered by <span className="text-emerald-400 font-bold">PRIGID GROUP</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-300 font-bold">WS: wss://vibez-n5h1.onrender.com/ws</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Events History List */}
        <div className="lg:col-span-6 rounded-2xl bg-[#070b14] border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Recent Dispatched Events</span>
            <span className="text-[11px] font-mono text-emerald-400">DLQ Active</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {events.map((evt) => {
              const isSelected = selectedEvent.id === evt.id;
              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-4 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-emerald-500/10 border-l-4 border-emerald-500' : 'hover:bg-slate-900/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">{evt.eventType}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                          evt.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {evt.httpStatus} {evt.status}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 truncate max-w-xs">{evt.targetUrl}</div>
                  </div>

                  <div className="text-right font-mono text-[11px] text-slate-500 shrink-0">
                    <div>{evt.timestamp}</div>
                    <div className="text-slate-400">Attempts: {evt.attempts}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Event Payload & Replay Button */}
        <div className="lg:col-span-6 rounded-2xl bg-[#070b14] border border-slate-800 shadow-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="space-y-0.5">
              <span className="text-xs font-mono text-emerald-400 font-bold">{selectedEvent.eventType}</span>
              <div className="text-xs font-mono text-slate-500">{selectedEvent.id}</div>
            </div>

            <button
              type="button"
              onClick={() => handleReplay(selectedEvent.id)}
              disabled={isReplaying}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {isReplaying ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : replaySuccess ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              <span>{replaySuccess ? 'Dispatched!' : isReplaying ? 'Replaying...' : 'Replay Event'}</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Payload Preview</span>
            <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-56">
              {JSON.stringify(selectedEvent.payload, null, 2)}
            </pre>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs font-mono">
            <div className="text-slate-400 font-bold uppercase text-[10px]">HMAC Signature Header</div>
            <div className="text-slate-300 truncate text-[11px]">
              X-Vibez-Signature: sha256=9f83ac018b2910fa88271...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
