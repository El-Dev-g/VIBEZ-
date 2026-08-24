'use client';

import { User, banUser } from '@/services/api';
import { useState } from 'react';

interface UserTableProps {
  initialUsers: User[];
}

export default function UserTable({ initialUsers }: UserTableProps) {
  const [users, setUsers] = useState(initialUsers);

  const handleBan = async (userId: string) => {
    if (confirm('Are you sure you want to ban this user?')) {
      const success = await banUser(userId);
      if (success) {
        setUsers(users.map(u => u.id === userId ? { ...u, status: 'Banned' as const } : u));
      }
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Phone</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Joined At</th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
              <td className="whitespace-nowrap px-6 py-4">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="text-sm text-gray-500">{user.phoneNumber}</div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                  user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {user.createdAt}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <button className="text-emerald-600 hover:text-emerald-900 mr-4">View</button>
                {user.status === 'Active' && (
                  <button 
                    onClick={() => handleBan(user.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Ban
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
