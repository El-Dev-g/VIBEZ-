'use client';

import { useState, useEffect } from 'react';
import { fetchBroadcasts, sendBroadcastApi, BroadcastItem } from '@/services/api';

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
        audience: item.targetAudience,
        sentAt: item.sentAt,
        status: 'Delivered',
        recipientCount: item.targetAudience === 'ALL' ? 'All Users' : 'Targeted'
      })));
    } else {
      setBroadcastHistory([
        { id: 'b1', title: 'System Maintenance Notice', audience: 'ALL', sentAt: '2026-08-24 14:00', status: 'Delivered', recipientCount: 'All Users' },
        { id: 'b2', title: 'Green Checkmark Badge Special', audience: 'VERIFIED_ONLY', sentAt: '2026-08-20 09:30', status: 'Delivered', recipientCount: 'Verified Users' },
      ]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      setToast({ text: 'Please fill in both the broadcast title and message body.', isError: true });
      return;
    }

    setIsSending(true);
    const result = await sendBroadcastApi(title, message, targetAudience);
    setIsSending(false);

    if (result.success) {
      setTitle('');
      setMessage('');
      setToast({ text: result.message || `Broadcast "${title}" successfully sent!`, isError: false });
      loadData();
      setTimeout(() => setToast(null), 4000);
    } else {
      setToast({ text: 'Failed to send broadcast announcement.', isError: true });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen text-black">
      <div>
        <h1 className="text-3xl font-black text-black">Broadcasts & System Alerts</h1>
        <p className="text-sm font-semibold text-gray-900 mt-1">
          Send global push notifications, announcements, or maintenance notices directly to VIBEZ app users.
        </p>
      </div>

      {toast && (
        <div className={`p-4 rounded-xl text-sm font-black ${
          toast.isError ? 'bg-red-200 text-black border-l-4 border-red-600' : 'bg-emerald-200 text-black border-l-4 border-emerald-600'
        }`}>
          {toast.text}
        </div>
      )}

      {/* Broadcast Composer */}
      <div className="bg-white p-6 rounded-2xl border-2 border-gray-300 shadow-sm space-y-4">
        <h2 className="text-lg font-black text-black border-b-2 border-gray-200 pb-3">
          📢 Compose New System Broadcast
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-black uppercase tracking-wider text-black">Notification Title</label>
            <input
              type="text"
              placeholder="e.g., Important Security Update"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white font-bold text-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-wider text-black">Target Audience</label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white font-bold text-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All VIBEZ Users</option>
              <option value="VERIFIED_ONLY">Verified Users Only (Green Badge)</option>
              <option value="ADMINS">System Administrators</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-wider text-black">Broadcast Message</label>
          <textarea
            rows={4}
            placeholder="Type your message to be broadcasted to all active devices..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white font-bold text-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSendBroadcast}
            disabled={isSending}
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {isSending ? 'Sending Notification...' : '🚀 Send Push Broadcast'}
          </button>
        </div>
      </div>

      {/* Broadcast History Table */}
      <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-sm overflow-hidden">
        <div className="p-4 border-b-2 border-gray-200 bg-gray-100">
          <h3 className="font-black text-black text-base">Past Broadcast History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y-2 divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left font-black text-black uppercase tracking-wider text-xs">Title</th>
                <th className="px-6 py-3 text-left font-black text-black uppercase tracking-wider text-xs">Target Audience</th>
                <th className="px-6 py-3 text-left font-black text-black uppercase tracking-wider text-xs">Recipients</th>
                <th className="px-6 py-3 text-left font-black text-black uppercase tracking-wider text-xs">Sent Date</th>
                <th className="px-6 py-3 text-left font-black text-black uppercase tracking-wider text-xs">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {broadcastHistory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-black text-black">{item.title}</td>
                  <td className="px-6 py-4 font-bold text-black">{item.audience}</td>
                  <td className="px-6 py-4 font-black text-emerald-800">{item.recipientCount} users</td>
                  <td className="px-6 py-4 font-bold text-black">{item.sentAt}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-green-200 text-black border border-green-400 rounded-full text-xs font-black">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
