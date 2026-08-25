import { fetchUsers } from '@/services/api';
import UserTable from '@/components/UserTable';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const users = await fetchUsers();

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">User Directory</h2>
          <p className="text-slate-500 font-bold mt-1">Manage all registered VIBEZ users and their account security status.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80 group">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 shadow-sm"
            />
          </div>
          <button className="hidden md:flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
            Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <UserTable initialUsers={users} />
      </div>
    </div>
  );
}
