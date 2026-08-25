'use client';

import { User, UserDetails, banUser, unbanUser, fetchUserById } from '@/services/api';
import { useState } from 'react';

interface UserTableProps {
  initialUsers: User[];
}

export default function UserTable({ initialUsers }: UserTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleView = async (user: User) => {
    setLoadingUser(true);
    setIsModalOpen(true);
    // Set basic user info first
    setSelectedUser({ ...user });
    // Fetch full details
    const details = await fetchUserById(user.id);
    if (details) {
      setSelectedUser(details);
    }
    setLoadingUser(false);
  };

  const handleBan = async (userId: string) => {
    if (confirm('Are you sure you want to ban this user?')) {
      const success = await banUser(userId);
      if (success) {
        setUsers(users.map(u => u.id === userId ? { ...u, status: 'Banned' as const } : u));
        if (selectedUser?.id === userId) {
          setSelectedUser({ ...selectedUser, status: 'Banned' });
        }
      }
    }
  };

  const handleUnban = async (userId: string) => {
    if (confirm('Are you sure you want to unban this user?')) {
      const success = await unbanUser(userId);
      if (success) {
        setUsers(users.map(u => u.id === userId ? { ...u, status: 'Active' as const } : u));
        if (selectedUser?.id === userId) {
          setSelectedUser({ ...selectedUser, status: 'Active' });
        }
      }
    }
  };

  return (
    <>
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
                  <button 
                    onClick={() => handleView(user)}
                    className="text-emerald-600 hover:text-emerald-900 mr-4 font-semibold"
                  >
                    View
                  </button>
                  {user.status === 'Active' ? (
                    <button 
                      onClick={() => handleBan(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Ban
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleUnban(user.id)}
                      className="text-emerald-600 hover:text-emerald-900"
                    >
                      Unban
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900">User Details</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl">
                  {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">{selectedUser.name}</h4>
                  <p className="text-sm text-gray-500">{selectedUser.phoneNumber}</p>
                  <span className={`mt-1 inline-flex rounded-full px-2 text-xs font-semibold ${
                    selectedUser.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedUser.status}
                  </span>
                </div>
              </div>

              {loadingUser ? (
                <div className="py-4 text-center text-sm text-gray-500">Loading user metadata...</div>
              ) : (
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 text-sm">
                  <div>
                    <span className="text-xs text-gray-400 uppercase tracking-wider block">User ID</span>
                    <span className="font-mono text-xs text-gray-700 truncate block">{selectedUser.id}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 uppercase tracking-wider block">Joined</span>
                    <span className="text-gray-700 font-medium">{selectedUser.createdAt}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 uppercase tracking-wider block">Messages Sent</span>
                    <span className="text-gray-700 font-medium">{selectedUser.sentMessagesCount ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 uppercase tracking-wider block">Active Chats</span>
                    <span className="text-gray-700 font-medium">{selectedUser.chatsCount ?? 0}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
              {selectedUser.status === 'Active' ? (
                <button
                  onClick={() => handleBan(selectedUser.id)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                >
                  Ban User
                </button>
              ) : (
                <button
                  onClick={() => handleUnban(selectedUser.id)}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                >
                  Unban User
                </button>
              )}
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
