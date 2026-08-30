'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { fetchBroadcasts, sendBroadcastApi, deleteBroadcast, BroadcastItem } from '../../services/api';

export default function BroadcastsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('ALL');
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ text: string; isError: boolean } | null>(null);

  const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchBroadcasts();
    if (data && data.length > 0) {
      setBroadcastHistory(data.map(item => ({
        id: item.id,
        title: item.title,
        message: item.message,
        audience: item.targetAudience,
        sentAt: item.sentAt,
        status: 'Delivered',
        recipientCount: item.targetAudience === 'ALL' ? 'All Users' : 'Targeted'
      })));
    } else {
      setBroadcastHistory([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this broadcast log?')) return;
    try {
      const ok = await deleteBroadcast(id);
      if (ok) {
        setBroadcastHistory(prev => prev.filter(b => b.id !== id));
        setToast({ text: 'Broadcast transmission deleted from archive.', isError: false });
        setTimeout(() => setToast(null), 4000);
      } else {
        setToast({ text: 'Failed to delete broadcast transmission.', isError: true });
      }
    } catch (err) {
      setToast({ text: 'Network error deleting broadcast.', isError: true });
    }
  };

  const handleSendBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      setToast({ text: 'Fill in both the broadcast title and message body.', isError: true });
      return;
    }

    setIsSending(true);
    const result = await sendBroadcastApi(title, message, targetAudience);
    setIsSending(false);

    if (result.success) {
      setTitle('');
      setMessage('');
      setToast({ text: `Broadcast Protocol "${title}" successfully initiated!`, isError: false });
      loadData();
      setTimeout(() => setToast(null), 4000);
    } else {
      setToast({ text: 'Broadcast protocol failure.', isError: true });
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Broadcasts</h2>
          <p className="text-slate-500 font-bold mt-1">Deploy global push notifications and system announcements.</p>
        </div>
      </div>

      {toast && (
        <div className={`p-4 rounded-2xl text-sm font-black border animate-fadeIn ${
          toast.isError ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
        }`}>
          {toast.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Composer */}
        <div className="lg:col-span-2 space-y-8 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.167H3.38a1.345 1.345 0 01-1.345-1.344v-3.322A1.345 1.345 0 013.38 7.655h1.874l2.147-6.167a1.76 1.76 0 013.417.592z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 8a5 5 0 010 8" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.73 5.27a10 10 0 010 13.46" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Compose System Alert</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Broadcast Title</label>
              <input
                type="text"
                placeholder="e.g., Critical Protocol Update"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900/10 focus:bg-white transition-all placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Target Classification</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900/10 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="ALL">Global (All Signals)</option>
                <option value="VERIFIED_ONLY">Verified Units (Green Badge)</option>
                <option value="ADMINS">Administrative Core</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Transmission Message</label>
            <textarea
              rows={5}
              placeholder="Input global message parameters..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900/10 focus:bg-white transition-all placeholder:text-slate-300 resize-none"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSendBroadcast}
              disabled={isSending}
              className="px-10 py-5 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 active:scale-95 flex items-center gap-3"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Broadcasting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Initiate Broadcast
                </>
              )}
            </button>
          </div>
        </div>

        {/* History / Tips */}
        <div className="space-y-6">
          <div className="bg-emerald-500 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-500/20">
            <h4 className="text-sm font-black uppercase tracking-widest opacity-80">Protocol Status</h4>
            <div className="mt-4 flex items-center gap-4">
              <div className="text-4xl font-black">Online</div>
              <div className="w-3 h-3 bg-white rounded-full animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.8)]"></div>
            </div>
            <p className="mt-4 text-xs font-bold leading-relaxed opacity-90">
              Broadcast services are operational. All transmissions are encrypted and delivered via global mesh protocol.
            </p>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Archived Transmissions</h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto scrollbar-hide">
              {broadcastHistory.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-slate-400">
                  No transmissions recorded yet.
                </div>
              ) : (
                broadcastHistory.map((item) => (
                  <div key={item.id} className="p-6 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{item.recipientCount}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">{item.sentAt?.split(' ')[0] || item.sentAt}</span>
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
                          title="Delete transmission log"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 leading-tight">{item.title}</h4>
                    {item.message && (
                      <p className="mt-1 text-xs text-slate-500 font-medium line-clamp-2">{item.message}</p>
                    )}
                    <div className="mt-3 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
