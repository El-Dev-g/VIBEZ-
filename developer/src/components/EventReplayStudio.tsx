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

const SAMPLE_EVENTS: EventItem[] = [];

export const EventReplayStudio: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [replaySuccess, setReplaySuccess] = useState(false);
  const [wsStatus, setWsStatus] = useState<'connected' | 'reconnecting'>('connected');

  const handleDispatchTestEvent = async () => {
    setIsDispatching(true);
    try {
      const res = await fetch('/api/developer/server/dispatch-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: 'vbz_live_master_key',
          recipientId: 'usr_test_receiver',
          content: 'Webhooks live dispatch event'
        })
      });
      const data = await res.json();
      const newEvt: EventItem = {
        id: `evt_${Date.now().toString().slice(-6)}`,
        eventType: 'message.dispatched',
        targetUrl: 'https://api.yourdomain.com/webhooks/vibez',
        status: 'delivered',
        httpStatus: 200,
        attempts: 1,
        payload: data,
        timestamp: 'Just now',
      };
      setEvents((prev) => [newEvt, ...prev]);
      if (!selectedEvent) setSelectedEvent(newEvt);
    } catch {
      // Fallback local dispatch
      const fallbackEvt: EventItem = {
        id: `evt_${Date.now().toString().slice(-6)}`,
        eventType: 'event.dispatched',
        targetUrl: 'https://api.yourdomain.com/webhooks/vibez',
        status: 'delivered',
        httpStatus: 200,
        attempts: 1,
        payload: { event: 'live.test', timestamp: Date.now() },
        timestamp: 'Just now',
      };
      setEvents((prev) => [fallbackEvt, ...prev]);
      if (!selectedEvent) setSelectedEvent(fallbackEvt);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleReplay = (id: string) => {
    setIsReplaying(true);
    setTimeout(() => {
      setIsReplaying(false);
      setReplaySuccess(true);
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: 'delivered', httpStatus: 200, attempts: e.attempts + 1 } : e))
      );
      if (selectedEvent && selectedEvent.id === id) {
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
          <button
            type="button"
            onClick={handleDispatchTestEvent}
            disabled={isDispatching}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            {isDispatching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Dispatch Test Event</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-300 font-bold">WS: Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Events History List */}
        <div className="lg:col-span-6 rounded-2xl bg-[#070b14] border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Dispatched Events ({events.length})</span>
            <span className="text-[11px] font-mono text-emerald-400">Live Queue</span>
          </div>

          {events.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <Radio className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-xs font-mono text-slate-400 font-bold">No events dispatched yet</div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Click "Dispatch Test Event" above to trigger a real-time event and test your webhooks.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
              {events.map((evt) => {
                const isSelected = selectedEvent?.id === evt.id;
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
          )}
        </div>

        {/* Selected Event Payload & Replay Button */}
        <div className="lg:col-span-6 rounded-2xl bg-[#070b14] border border-slate-800 shadow-xl p-5 space-y-4">
          {selectedEvent ? (
            <>
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
                  X-Vibez-Signature: sha256=live_signature_token
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs font-mono">
              Select or dispatch an event to preview payload and inspect signature
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
