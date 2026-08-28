import { fetchContactInquiries } from '../../services/api';

export const dynamic = 'force-dynamic';

export default async function InquiriesPage() {
  const inquiries = await fetchContactInquiries();

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Support Inquiries</h2>
          <p className="text-slate-500 font-bold mt-1">Review and manage contact and support form submissions from the Vibez landing page.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sender</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Subject</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Message</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Date</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {inquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No support inquiries received yet.</p>
                  </td>
                </tr>
              ) : (
                inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="group hover:bg-slate-50/50 transition-all duration-200">
                    <td className="whitespace-nowrap px-8 py-6">
                      <div className="text-sm font-black text-slate-900">{inquiry.name}</div>
                      <div className="text-xs font-medium text-slate-500">{inquiry.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-8 py-6">
                      <div className="text-sm font-bold text-slate-800">{inquiry.subject}</div>
                    </td>
                    <td className="px-8 py-6 max-w-xs">
                      <p className="text-sm font-medium text-slate-600 line-clamp-2">{inquiry.message}</p>
                    </td>
                    <td className="whitespace-nowrap px-8 py-6">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                        inquiry.status === 'UNREAD' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          inquiry.status === 'UNREAD' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}></span>
                        {inquiry.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-8 py-6 text-xs font-mono font-bold text-slate-500">
                      {new Date(inquiry.createdAt).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-8 py-6 text-right">
                      <a 
                        href={`mailto:${inquiry.email}?subject=Re: ${encodeURIComponent(inquiry.subject)}`}
                        className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                      >
                        Reply via Email
                      </a>
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
