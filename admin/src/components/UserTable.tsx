'use client';

import { User, UserDetails, banUser, unbanUser, deleteUser, fetchUserById, fetchUsers, toggleUserVerificationBadge } from '@/services/api';
import { useState, useEffect, useMemo } from 'react';

interface UserTableProps {
  initialUsers?: User[] | null;
}

export default function UserTable({ initialUsers }: UserTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers || []);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned' | 'verified'>('all');
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch live users from database on client mount or refresh
  const loadUsers = async () => {
    setLoading(true);
    try {
      const freshUsers = await fetchUsers();
      if (freshUsers) {
        setUsers(freshUsers);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleView = async (user: User) => {
    setLoadingUser(true);
    setIsModalOpen(true);
    setSelectedUser({ ...user } as UserDetails);
    
    try {
      const details = await fetchUserById(user.id);
      if (details) {
        setSelectedUser(details);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleToggleBadge = async (userId: string, currentVerified: boolean) => {
    setActionLoadingId(userId);
    const newStatus = !currentVerified;
    try {
      const success = await toggleUserVerificationBadge(userId, newStatus);
      if (success) {
        setUsers(prev => prev.map(u => u.id === userId ? {
          ...u,
          isVerified: newStatus,
          verifiedAt: newStatus ? new Date().toLocaleDateString() : undefined
        } : u));

        if (selectedUser?.id === userId) {
          setSelectedUser(prev => prev ? {
            ...prev,
            isVerified: newStatus,
            verifiedAt: newStatus ? new Date().toLocaleDateString() : undefined
          } : null);
        }
      } else {
        alert('Failed to update verification badge status.');
      }
    } catch (err) {
      console.error('Error toggling badge:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBan = async (userId: string) => {
    if (confirm('Are you sure you want to suspend this user account? The user will be disconnected immediately.')) {
      setActionLoadingId(userId);
      const success = await banUser(userId);
      if (success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'Banned' as const } : u));
        if (selectedUser?.id === userId) {
          setSelectedUser(prev => prev ? { ...prev, status: 'Banned' } : null);
        }
      } else {
        alert('Failed to ban user.');
      }
      setActionLoadingId(null);
    }
  };

  const handleUnban = async (userId: string) => {
    setActionLoadingId(userId);
    const success = await unbanUser(userId);
    if (success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'Active' as const } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, status: 'Active' } : null);
      }
    } else {
      alert('Failed to unban user.');
    }
    setActionLoadingId(null);
  };

  const handleDelete = async (userId: string) => {
    if (confirm('Are you sure you want to permanently delete this user? All their chats, statuses, and data will be erased forever. This action is irreversible.')) {
      setActionLoadingId(userId);
      const success = await deleteUser(userId);
      if (success) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setIsModalOpen(false);
        setSelectedUser(null);
      } else {
        alert('Failed to delete user.');
      }
      setActionLoadingId(null);
    }
  };

  // Filter and search logic
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (user.name && user.name.toLowerCase().includes(q)) ||
        (user.phoneNumber && user.phoneNumber.toLowerCase().includes(q)) ||
        (user.googleEmail && user.googleEmail.toLowerCase().includes(q)) ||
        (user.id && user.id.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === 'active') return user.status === 'Active';
      if (statusFilter === 'banned') return user.status === 'Banned';
      if (statusFilter === 'verified') return Boolean(user.isVerified);
      return true;
    });
  }, [users, searchQuery, statusFilter]);

  const counts = useMemo(() => ({
    all: users.length,
    active: users.filter(u => u.status === 'Active').length,
    banned: users.filter(u => u.status === 'Banned').length,
    verified: users.filter(u => u.isVerified).length,
  }), [users]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Control Bar */}
      <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search by name, phone, email, or user ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 shadow-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Pills & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                statusFilter === 'all' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                statusFilter === 'active' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              Active ({counts.active})
            </button>
            <button
              onClick={() => setStatusFilter('verified')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                statusFilter === 'verified' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              Verified ({counts.verified})
            </button>
            <button
              onClick={() => setStatusFilter('banned')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                statusFilter === 'banned' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              Banned ({counts.banned})
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-black text-slate-700 hover:text-slate-900 shadow-sm hover:shadow active:scale-95 transition-all disabled:opacity-50"
            title="Reload users directly from database"
          >
            <svg className={`w-4 h-4 text-emerald-500 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto scrollbar-hide">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Citizen Identity</th>
              <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Connection & Signal</th>
              <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Account Status</th>
              <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Verification</th>
              <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Registered</th>
              <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Accessing Database Records...</p>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-black text-slate-700">
                      {searchQuery ? `No citizens found matching "${searchQuery}"` : 'No registered users in database'}
                    </p>
                    <p className="text-xs font-bold text-slate-400 max-w-sm">
                      {searchQuery ? 'Try searching for a different name, phone number, email or clear your search query.' : 'When users sign up on the mobile app or web client, they will appear here.'}
                    </p>
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all shadow"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="group hover:bg-slate-50/70 transition-all duration-150">
                  {/* Identity Column */}
                  <td className="whitespace-nowrap px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative group-hover:scale-105 transition-transform">
                        {user.avatarUrl ? (
                          <img 
                            src={user.avatarUrl} 
                            alt={user.name || 'Avatar'} 
                            className="h-11 w-11 rounded-2xl object-cover border border-slate-200 shadow-sm"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-800 font-black text-sm border border-slate-200 shadow-sm">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900 leading-none">{user.name || 'Anonymous User'}</span>
                          {user.isVerified && (
                            <span className="inline-flex items-center text-emerald-500" title="Verified Badge Holder">
                              <svg className="w-4 h-4 fill-emerald-500 text-white" viewBox="0 0 24 24">
                                <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                            ID: {user.id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Connection Column */}
                  <td className="whitespace-nowrap px-8 py-5">
                    <div className="text-sm font-bold text-slate-900">{user.phoneNumber || user.googleEmail || 'No Signal'}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                        user.authProvider === 'GOOGLE' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {user.authProvider || (user.googleEmail ? 'Google Auth' : 'Phone Signal')}
                      </span>
                    </div>
                  </td>

                  {/* Status Column */}
                  <td className="whitespace-nowrap px-8 py-5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                      user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      {user.status}
                    </span>
                  </td>

                  {/* Verification Column */}
                  <td className="whitespace-nowrap px-8 py-5">
                    {user.isVerified ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                          <svg className="w-3 h-3 fill-emerald-500" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                        <button
                          onClick={() => handleToggleBadge(user.id, true)}
                          disabled={actionLoadingId === user.id}
                          className="text-[10px] font-bold text-slate-400 hover:text-rose-600 underline transition-colors"
                          title="Revoke Verification Badge"
                        >
                          Revoke
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Standard</span>
                        <button
                          onClick={() => handleToggleBadge(user.id, false)}
                          disabled={actionLoadingId === user.id}
                          className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-200 transition-all"
                          title="Grant Verified Green Badge for this user"
                        >
                          + Grant Badge
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Registered Column */}
                  <td className="whitespace-nowrap px-8 py-5">
                    <div className="text-xs font-bold text-slate-700">{user.createdAt}</div>
                    {user.lastSeen && (
                      <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                        Seen: {user.lastSeen}
                      </div>
                    )}
                  </td>

                  {/* Actions Column */}
                  <td className="whitespace-nowrap px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleView(user)}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-900 hover:text-white transition-all text-slate-400 shadow-sm"
                        title="View Full Profile Details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      {user.status === 'Active' ? (
                        <button 
                          onClick={() => handleBan(user.id)}
                          disabled={actionLoadingId === user.id}
                          className="p-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                          title="Suspend / Ban User"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUnban(user.id)}
                          disabled={actionLoadingId === user.id}
                          className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                          title="Restore / Unban User"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}

                      <button 
                        onClick={() => handleDelete(user.id)}
                        disabled={actionLoadingId === user.id}
                        className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-700 hover:text-white transition-all shadow-sm disabled:opacity-50"
                        title="Permanently Delete User"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
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
                  {selectedUser.avatarUrl ? (
                    <img 
                      src={selectedUser.avatarUrl} 
                      alt={selectedUser.name || 'Avatar'} 
                      className="h-20 w-20 rounded-3xl object-cover border border-slate-200 shadow-md"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-900 font-black text-3xl border border-slate-200 shadow-md">
                      {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className={`absolute -bottom-2 -right-2 w-8 h-8 border-4 border-white rounded-2xl flex items-center justify-center ${selectedUser.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
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
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedUser.name || 'Anonymous User'}</h3>
                    {selectedUser.isVerified && (
                      <span className="text-emerald-500" title="Green Badge Verified">
                        <svg className="w-5 h-5 fill-emerald-500 text-white" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <p className="text-sm font-bold text-slate-500">{selectedUser.phoneNumber || selectedUser.googleEmail}</p>
                    <span className="text-slate-300">•</span>
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${selectedUser.status === 'Active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {selectedUser.status} Account
                    </span>
                    {selectedUser.bio && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-400 italic truncate max-w-xs">&quot;{selectedUser.bio}&quot;</span>
                      </>
                    )}
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
              <div className="py-16 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Querying Citizen Relational Data...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetadataItem label="Global User ID" value={selectedUser.id} mono />
                <MetadataItem label="Registered On" value={selectedUser.createdAt} />
                <MetadataItem label="Transmissions" value={selectedUser.sentMessagesCount ?? 0} accent />
                <MetadataItem label="Active Channels" value={selectedUser.chatsCount ?? 0} accent />
                
                <div className="col-span-full p-5 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Green Verification Badge</p>
                      <p className="text-xs font-bold text-slate-900">
                        {selectedUser.isVerified ? `Verified Citizen (Granted: ${selectedUser.verifiedAt || 'Active'})` : 'Standard Citizen (Unverified)'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleBadge(selectedUser.id, Boolean(selectedUser.isVerified))}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      selectedUser.isVerified 
                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200' 
                        : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20'
                    }`}
                  >
                    {selectedUser.isVerified ? 'Revoke Badge' : 'Grant Verified Badge'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              {selectedUser.status === 'Active' ? (
                <button
                  onClick={() => handleBan(selectedUser.id)}
                  className="rounded-2xl bg-amber-500 px-6 py-3.5 text-sm font-black text-white hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Suspend Account
                </button>
              ) : (
                <button
                  onClick={() => handleUnban(selectedUser.id)}
                  className="rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-black text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Restore Account
                </button>
              )}
              <button
                onClick={() => handleDelete(selectedUser.id)}
                className="rounded-2xl bg-rose-600 px-6 py-3.5 text-sm font-black text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Profile
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-2xl border-2 border-slate-200 px-6 py-3.5 text-sm font-black text-slate-900 hover:bg-slate-50 transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetadataItem({ label, value, mono, accent }: { label: string; value: string | number; mono?: boolean; accent?: boolean }) {
  return (
    <div className="p-5 rounded-3xl border border-slate-100 bg-white group hover:border-emerald-100 transition-colors">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block leading-none">{label}</span>
      <span className={`mt-2.5 block truncate ${mono ? 'font-mono text-xs' : 'text-lg font-black'} ${accent ? 'text-emerald-600' : 'text-slate-900'}`}>
        {value}
      </span>
    </div>
  );
}
