import { fetchUsers } from '@/services/api';
import UserTable from '@/components/UserTable';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const users = await fetchUsers();

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-500">Manage all registered VIBEZ users and their account status.</p>
        </div>
        <div className="flex space-x-3">
          <input 
            type="text" 
            placeholder="Search users..." 
            className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
          <button className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            Search
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <UserTable initialUsers={users} />
      </div>
    </div>
  );
}
