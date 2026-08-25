import { fetchReports } from '@/services/api';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const reports = await fetchReports();

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">User Reports</h2>
          <p className="text-slate-500 font-bold mt-1">Review and moderate flagged user behavior and reported content.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Report ID</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Reporter</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Target Signal</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Infraction</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Commands</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No active infractions reported.</p>
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="group hover:bg-slate-50/50 transition-all duration-200">
                    <td className="whitespace-nowrap px-8 py-6 font-mono text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {report.id}
                    </td>
                    <td className="whitespace-nowrap px-8 py-6">
                      <div className="text-sm font-black text-slate-900">{report.reporterName}</div>
                    </td>
                    <td className="whitespace-nowrap px-8 py-6">
                      <div className="text-sm font-bold text-slate-600">{report.reportedUserName}</div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-slate-500 max-w-xs truncate">{report.reason}</p>
                    </td>
                    <td className="whitespace-nowrap px-8 py-6">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                        report.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 
                        report.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-100'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          report.status === 'Pending' ? 'bg-amber-500' : 
                          report.status === 'Resolved' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}></span>
                        {report.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all">
                          Resolve
                        </button>
                        <button className="px-4 py-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all">
                          Dismiss
                        </button>
                      </div>
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
