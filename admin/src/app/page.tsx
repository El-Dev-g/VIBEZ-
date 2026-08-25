import { fetchSystemMetrics, fetchUsers } from '@/services/api';
import UserTable from '@/components/UserTable';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const metrics = await fetchSystemMetrics();
  const users = await fetchUsers();

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen text-black">
      <div>
        <h2 className="text-3xl font-black text-black">Dashboard Overview</h2>
        <p className="text-gray-900 font-bold">Welcome back! Here's what's happening with VIBEZ today.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard 
          title="Active Users" 
          value={metrics.activeUsers.toLocaleString()} 
          change="+12%" 
          trend="up" 
          icon="👥"
        />
        <MetricCard 
          title="Total Chats" 
          value={metrics.totalChats.toLocaleString()} 
          change="+5.4%" 
          trend="up" 
          icon="💬"
        />
        <MetricCard 
          title="Total Messages" 
          value={metrics.totalMessages.toLocaleString()} 
          icon="✉️"
        />
        <MetricCard 
          title="System Status" 
          value={metrics.systemStatus} 
          status={metrics.systemStatus}
          icon="🛡️"
        />
        <MetricCard 
          title="Avg Latency" 
          value={`${metrics.latencyMs}ms`} 
          change="-2ms" 
          trend="down" 
          icon="⚡"
        />
      </div>

      {/* User Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-black">Registered Users</h3>
          <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 transition-colors">
            Export Data
          </button>
        </div>
        <UserTable initialUsers={users} />
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
  icon 
}: { 
  title: string; 
  value: string; 
  change?: string; 
  trend?: 'up' | 'down';
  status?: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border-2 border-gray-300 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {change && (
          <span className={`text-xs font-black ${trend === 'up' ? 'text-green-800' : 'text-blue-800'}`}>
            {change}
          </span>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-black">{title}</h3>
        <p className={`mt-1 text-2xl font-black ${status === 'Healthy' ? 'text-emerald-700' : 'text-black'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
