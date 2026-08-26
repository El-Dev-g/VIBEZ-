import { fetchSystemMetrics, fetchUsers } from '@/services/api';
import UserTable from '@/components/UserTable';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const metrics = await fetchSystemMetrics();
  const users = await fetchUsers();

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

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard 
          title="Active Users" 
          value={(metrics?.activeUsers || 0).toLocaleString()} 
          change={`${users?.length || 0} registered`} 
          trend="up" 
          icon={(
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )}
          color="bg-blue-500"
        />
        <MetricCard 
          title="Total Chats" 
          value={(metrics?.totalChats || 0).toLocaleString()} 
          change="Real-time P2P" 
          trend="up" 
          icon={(
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
          color="bg-emerald-500"
        />
        <MetricCard 
          title="Messages Sent" 
          value={(metrics?.totalMessages || 0).toLocaleString()} 
          change="E2E Encrypted"
          icon={(
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )}
          color="bg-purple-500"
        />
        <MetricCard 
          title="Pending Reports" 
          value={(metrics?.pendingReports || 0).toString()} 
          change={metrics?.pendingReports > 0 ? "Requires review" : "All cleared"}
          trend={metrics?.pendingReports > 0 ? "up" : "down"}
          icon={(
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          color={metrics?.pendingReports > 0 ? "bg-rose-500" : "bg-teal-500"}
        />
        <MetricCard 
          title="System Health" 
          value={metrics.systemStatus} 
          status={metrics.systemStatus}
          icon={(
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          )}
          color="bg-slate-700"
        />
        <MetricCard 
          title="Avg Query Latency" 
          value={`${metrics.latencyMs}ms`} 
          change="Direct Engine" 
          trend="down" 
          icon={(
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
          color="bg-amber-500"
        />
      </div>

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

function MetricCard({ 
  title, 
  value, 
  change, 
  trend, 
  status,
  icon,
  color
}: { 
  title: string; 
  value: string; 
  change?: string; 
  trend?: 'up' | 'down';
  status?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="relative group overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1">
      <div className="absolute -right-4 -top-4 w-20 h-20 opacity-5 transition-transform group-hover:scale-150 group-hover:rotate-12">
        <div className={`w-full h-full rounded-full ${color}`}></div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg shadow-current/20 transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        {change && (
          <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
            trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
          }`}>
            {trend === 'up' && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
            {change}
          </div>
        )}
      </div>
      
      <div className="mt-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</h3>
        <p className={`mt-1 text-3xl font-black tracking-tight ${status === 'Healthy' ? 'text-emerald-600' : 'text-slate-900'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
