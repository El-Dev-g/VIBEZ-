import { fetchUsers } from '../services/api';
import UserTable from '../components/UserTable';
import MetricsOverview from '../components/MetricsOverview';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const users = await fetchUsers();
  const fallbackCount = users?.length || 0;

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-500 font-bold mt-1">Real-time live database telemetry, network health, and user administration.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-black uppercase tracking-wider">Dynamic DB Sync Active</span>
          </div>
        </div>
      </div>

      {/* Client-Side Telemetry Metrics Grid */}
      <MetricsOverview userCountFallback={fallbackCount} />

      {/* User Management Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-slate-900 rounded-full"></div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Registered Citizen Records</h3>
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          <UserTable initialUsers={users} />
        </div>
      </div>
    </div>
  );
}

