'use client';

export default function AnalyticsPage() {
  const metrics = [
    { label: 'Active Voice Calls', value: '14', change: '+12% vs last hour', color: 'emerald' },
    { label: 'Active Video Calls', value: '8', change: '+25% vs last hour', color: 'blue' },
    { label: 'Avg Call Quality (MOS)', value: '4.85 / 5.0', change: 'Excellent stability', color: 'purple' },
    { label: 'Bandwidth Consumed', value: '14.2 GB/hr', change: 'Normal throughput', color: 'indigo' },
  ];

  const recentCalls = [
    { id: 'call_101', type: 'Voice Call', duration: '04:12', caller: 'John Doe (+15550192)', receiver: 'Sarah Miller', status: 'Completed', latency: '32ms' },
    { id: 'call_102', type: 'Video Call', duration: '12:45', caller: 'Alex Rivera', receiver: 'Tech Team Group', status: 'Completed', latency: '48ms' },
    { id: 'call_103', type: 'Video Call', duration: '08:10', caller: 'David Chen', receiver: 'Elena Rostova', status: 'Ongoing', latency: '28ms' },
    { id: 'call_104', type: 'Voice Call', duration: '00:45', caller: 'Maria Garcia', receiver: 'Carlos Ruiz', status: 'Completed', latency: '35ms' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calls & Audio/Video Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor WebRTC voice/video session traffic, network latency, media stream quality, and active call channels.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase">{m.label}</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-2">{m.value}</p>
            <p className="text-xs font-semibold text-emerald-600 mt-1">{m.change}</p>
          </div>
        ))}
      </div>

      {/* Network & Protocol Status */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
          ⚡ Real-time WebRTC & Socket Relay Health
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">TURN / STUN Servers</span>
              <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-800 rounded-full font-bold">Online</span>
            </div>
            <p className="text-xs text-gray-500">Latency: 12ms | Packet Loss: 0.01%</p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">Socket.IO Signaling Node</span>
              <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-800 rounded-full font-bold">Connected</span>
            </div>
            <p className="text-xs text-gray-500">Active Connections: 482 devices</p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">Audio Codec (Opus)</span>
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full font-bold">HD 48kHz</span>
            </div>
            <p className="text-xs text-gray-500">Video Codec: VP8 / H.264 dynamic</p>
          </div>
        </div>
      </div>

      {/* Call Session Logs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <h3 className="font-bold text-gray-900 text-sm">Recent Voice & Video Call Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-500">Call ID</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-500">Type</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-500">Caller</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-500">Receiver</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-500">Duration</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-500">Latency</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {recentCalls.map((call) => (
                <tr key={call.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{call.id}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{call.type}</td>
                  <td className="px-6 py-4 text-gray-900">{call.caller}</td>
                  <td className="px-6 py-4 text-gray-900">{call.receiver}</td>
                  <td className="px-6 py-4 font-medium text-gray-700">{call.duration}</td>
                  <td className="px-6 py-4 text-emerald-600 font-medium">{call.latency}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      call.status === 'Ongoing' ? 'bg-blue-100 text-blue-800 animate-pulse' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {call.status}
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
