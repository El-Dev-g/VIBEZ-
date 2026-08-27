import { fetchUserById } from '../../../services/api';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;
  const user = await fetchUserById(id);

  if (!user) {
    notFound();
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/users"
          className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          &larr; Back to Users
        </Link>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
          user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {user.status}
        </span>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm space-y-8">
        <div className="flex items-center space-x-6 border-b border-gray-100 pb-6">
          <div className="h-20 w-20 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-3xl">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-500 font-medium">{user.phoneNumber}</p>
            <p className="text-xs text-gray-400 font-mono mt-1">ID: {user.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl bg-gray-50 p-5 border border-gray-100">
            <span className="text-xs font-semibold uppercase text-gray-400">Account Joined</span>
            <p className="text-lg font-bold text-gray-800 mt-1">{user.createdAt}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-5 border border-gray-100">
            <span className="text-xs font-semibold uppercase text-gray-400">Total Messages Sent</span>
            <p className="text-lg font-bold text-gray-800 mt-1">{user.sentMessagesCount ?? 0}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-5 border border-gray-100">
            <span className="text-xs font-semibold uppercase text-gray-400">Active Conversations</span>
            <p className="text-lg font-bold text-gray-800 mt-1">{user.chatsCount ?? 0}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-md font-semibold text-gray-900">User Activity & Status</h3>
          <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 text-sm">
            <div className="flex justify-between p-4">
              <span className="text-gray-500">Last Seen</span>
              <span className="font-medium text-gray-800">{user.lastSeen || 'N/A'}</span>
            </div>
            <div className="flex justify-between p-4">
              <span className="text-gray-500">Reports Received</span>
              <span className="font-medium text-gray-800">{user.reportsReceivedCount || 0}</span>
            </div>
            <div className="flex justify-between p-4">
              <span className="text-gray-500">Bio / Description</span>
              <span className="font-medium text-gray-800">{user.bio || 'None provided'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
