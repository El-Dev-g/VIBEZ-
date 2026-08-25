import { fetchAuditLogs } from '@/services/api';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage() {
  const logs = await fetchAuditLogs();

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Audit Logs</h2>
          <p className="text-slate-500 font-bold mt-1">Track administrative actions and signal modifications across the ecosystem.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Administrative Unit</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Protocol Action</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Target Vector</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No administrative audit events recorded.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="group hover:bg-slate-50/50 transition-all duration-200">
                    <td className="whitespace-nowrap px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-[10px]">
                          {log.adminEmail.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm font-black text-slate-900">{log.adminEmail}</div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-8 py-6">
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-100">
                        <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                        {log.action}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-8 py-6">
                      <div className="text-sm font-bold text-slate-600">{log.target}</div>
                    </td>
                    <td className="whitespace-nowrap px-8 py-6 text-right font-mono text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {log.timestamp}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
