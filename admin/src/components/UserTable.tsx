'use client';

import { User, UserDetails, banUser, unbanUser, deleteUser, fetchUserById } from '@/services/api';
import { useState } from 'react';

interface UserTableProps {
  initialUsers?: User[] | null;
}

export default function UserTable({ initialUsers }: UserTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers || []);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleView = async (user: User) => {
    setLoadingUser(true);
    setIsModalOpen(true);
    // Set basic user info first
    setSelectedUser({ ...user } as UserDetails);
    // Fetch full details
    const details = await fetchUserById(user.id);
    if (details) {
      setSelectedUser(details);
    }
    setLoadingUser(false);
  };

  const handleBan = async (userId: string) => {
    if (confirm('Are you sure you want to terminate access for this signal? The user will be disconnected immediately.')) {
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
    const success = await unbanUser(userId);
    if (success) {
      setUsers(users.map(u => u.id === userId ? { ...u, status: 'Active' as const } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, status: 'Active' });
      }
    }
  };

  const handleDelete = async (userId: string) => {
    if (confirm('Are you sure you want to permanently delete this user? All their chats, statuses, and data will be erased forever. This action is irreversible.')) {
      const success = await deleteUser(userId);
      if (success) {
        setUsers(users.filter(u => u.id !== userId));
        setIsModalOpen(false);
        setSelectedUser(null);
      } else {
        alert('Failed to delete user.');
      }
    }
  };

  return (
    <>
      <div className="overflow-x-auto scrollbar-hide">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">User Identity</th>
              <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Connection</th>
              <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
              <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Registration</th>
              <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Commands</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {users.map((user) => (
              <tr key={user.id} className="group hover:bg-slate-50/50 transition-all duration-200">
                <td className="whitespace-nowrap px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="relative group-hover:scale-105 transition-transform">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-black text-xs border border-slate-200">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 leading-none">{user.name || 'Anonymous User'}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider truncate max-w-[120px]">ID: {user.id.slice(-8)}</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-8 py-5">
                  <div className="text-sm font-bold text-slate-900">{user.phoneNumber}</div>
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Global Signal</div>
                </td>
                <td className="whitespace-nowrap px-8 py-5">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                    user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    {user.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-8 py-5">
                  <div className="text-sm font-bold text-slate-500">{user.createdAt}</div>
                </td>
                <td className="whitespace-nowrap px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleView(user)}
                      className="p-2 rounded-lg bg-slate-50 hover:bg-slate-900 hover:text-white transition-all text-slate-400"
                      title="View Details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    {user.status === 'Active' ? (
                      <button 
                        onClick={() => handleBan(user.id)}
                        className="p-2 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                        title="Ban User"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleUnban(user.id)}
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
                        title="Unban User"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all"
                      title="Delete User"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-2xl rounded-[2.5rem] bg-white p-10 shadow-2xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400"></div>
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-8">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="h-20 w-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-900 font-black text-3xl border border-slate-200">
                    {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className={`absolute -bottom-2 -right-2 w-8 h-8 border-4 border-white rounded-2xl flex items-center justify-center ${selectedUser.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {selectedUser.status === 'Active' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                      )}
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">{selectedUser.name || 'Anonymous User'}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-sm font-bold text-slate-400">{selectedUser.phoneNumber}</p>
                    <span className="text-slate-300">•</span>
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${selectedUser.status === 'Active' ? 'text-emerald-500' : 'text-red-500'}`}>{selectedUser.status} Account</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-12 h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center group"
              >
                <svg className="w-6 h-6 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingUser ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Compiling Metadata...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetadataItem label="Global Identity" value={selectedUser.id} mono />
                <MetadataItem label="Signal Established" value={selectedUser.createdAt} />
                <MetadataItem label="Transmissions" value={selectedUser.sentMessagesCount ?? 0} accent />
                <MetadataItem label="Active Channels" value={selectedUser.chatsCount ?? 0} accent />
                
                <div className="col-span-full mt-4 p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-slate-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Security Protocol</p>
                      <p className="text-sm font-bold text-slate-900 mt-1">E2E Encryption Verified</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Secure Signal</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4">
              {selectedUser.status === 'Active' ? (
                <button
                  onClick={() => handleBan(selectedUser.id)}
                  className="rounded-2xl bg-amber-500 px-6 py-4 text-sm font-black text-white hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Terminate Access
                </button>
              ) : (
                <button
                  onClick={() => handleUnban(selectedUser.id)}
                  className="rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-black text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Restore Signal
                </button>
              )}
              <button
                onClick={() => handleDelete(selectedUser.id)}
                className="rounded-2xl bg-red-600 px-6 py-4 text-sm font-black text-white hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Profile
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-2xl border-2 border-slate-200 px-6 py-4 text-sm font-black text-slate-900 hover:bg-slate-50 transition-all active:scale-95"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MetadataItem({ label, value, mono, accent }: { label: string; value: string | number; mono?: boolean; accent?: boolean }) {
  return (
    <div className="p-6 rounded-3xl border border-slate-100 bg-white group hover:border-emerald-100 transition-colors">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block leading-none">{label}</span>
      <span className={`mt-3 block truncate ${mono ? 'font-mono text-xs' : 'text-xl font-black'} ${accent ? 'text-emerald-600' : 'text-slate-900'}`}>
        {value}
      </span>
    </div>
  );
}
