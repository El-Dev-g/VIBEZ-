import { fetchUsers, User } from '../../services/api';
import UserTable from '../../components/UserTable';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  let users: User[] | null = null;
  try {
    users = await fetchUsers();
  } catch (e) {
    console.error('SSR fetchUsers error:', e);
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Citizen & User Directory</h2>
          <p className="text-slate-500 font-bold mt-1">
            Real-time management of all registered VIBEZ accounts, phone signals, Google logins, and security permissions.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <UserTable initialUsers={users} />
      </div>
    </div>
  );
}
