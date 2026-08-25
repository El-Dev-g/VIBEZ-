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
      <div className="overflow-x-auto rounded-lg border-2 border-gray-300 bg-white">
        <table className="min-w-full divide-y-2 divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-black">Name</th>
              <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-black">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-black">Status</th>
              <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-black">Joined At</th>
              <th className="px-6 py-3 text-right text-xs font-black uppercase tracking-wider text-black">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-black text-black">{user.name}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-bold text-black">{user.phoneNumber}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-black leading-5 ${
                    user.status === 'Active' ? 'bg-green-200 text-black border border-green-400' : 'bg-red-200 text-black border border-red-400'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-black">
                  {user.createdAt}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-black">
                  <button 
                    onClick={() => handleView(user)}
                    className="text-emerald-700 hover:text-emerald-900 mr-4 font-black"
                  >
                    View
                  </button>
                  {user.status === 'Active' ? (
                    <button 
                      onClick={() => handleBan(user.id)}
                      className="text-red-700 hover:text-red-900 font-black"
                    >
                      Ban
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleUnban(user.id)}
                      className="text-emerald-700 hover:text-emerald-900 font-black"
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
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-6 text-black border-2 border-gray-400">
            <div className="flex items-center justify-between border-b-2 border-gray-200 pb-4">
              <h3 className="text-xl font-black text-black">User Details</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-black hover:text-red-600 text-2xl font-black"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-black text-xl border-2 border-emerald-300">
                  {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h4 className="text-lg font-black text-black">{selectedUser.name}</h4>
                  <p className="text-sm font-bold text-gray-900">{selectedUser.phoneNumber}</p>
                  <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-black ${
                    selectedUser.status === 'Active' ? 'bg-green-200 text-black border border-green-400' : 'bg-red-200 text-black border border-red-400'
                  }`}>
                    {selectedUser.status}
                  </span>
                </div>
              </div>

              {loadingUser ? (
                <div className="py-4 text-center text-sm font-bold text-black animate-pulse">Loading user metadata...</div>
              ) : (
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-100 border-2 border-gray-300 p-4 text-sm">
                  <div>
                    <span className="text-xs text-black font-black uppercase tracking-wider block">User ID</span>
                    <span className="font-mono text-xs text-black font-bold truncate block">{selectedUser.id}</span>
                  </div>
                  <div>
                    <span className="text-xs text-black font-black uppercase tracking-wider block">Joined</span>
                    <span className="text-black font-black">{selectedUser.createdAt}</span>
                  </div>
                  <div>
                    <span className="text-xs text-black font-black uppercase tracking-wider block">Messages Sent</span>
                    <span className="text-black font-black">{selectedUser.sentMessagesCount ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-xs text-black font-black uppercase tracking-wider block">Active Chats</span>
                    <span className="text-black font-black">{selectedUser.chatsCount ?? 0}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t-2 border-gray-200">
              {selectedUser.status === 'Active' ? (
                <button
                  onClick={() => handleBan(selectedUser.id)}
                  className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800 transition-colors shadow"
                >
                  Ban User
                </button>
              ) : (
                <button
                  onClick={() => handleUnban(selectedUser.id)}
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 transition-colors shadow"
                >
                  Unban User
                </button>
              )}
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-bold text-black hover:bg-gray-100 transition-colors"
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
