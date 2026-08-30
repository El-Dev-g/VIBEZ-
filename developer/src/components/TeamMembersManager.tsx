'use client';

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  Check,
  X,
  ShieldAlert,
  Edit2,
  Search,
  CheckCircle2,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useDeveloperAuth, TeamMember } from '../context/DeveloperAuthContext';

export const TeamMembersManager: React.FC = () => {
  const { members, inviteMember, updateMember, removeMember } = useDeveloperAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Admin' | 'Developer' | 'Viewer' | 'Billing'>('Developer');
  const [status, setStatus] = useState<'active' | 'pending'>('active');

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'Admin' | 'Developer' | 'Viewer' | 'Billing'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenInvite = () => {
    setEditingMember(null);
    setName('');
    setEmail('');
    setRole('Developer');
    setStatus('pending');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: TeamMember) => {
    setEditingMember(m);
    setName(m.name);
    setEmail(m.email);
    setRole(m.role);
    setStatus(m.status);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      updateMember(editingMember.id, {
        name: name.trim() || editingMember.name,
        role,
        status,
      });
      showToast(`Updated permissions for ${editingMember.name}`);
    } else {
      if (!email.trim()) return;
      inviteMember(email.trim(), name.trim(), role);
      showToast(`Invitation sent to ${email.trim()}`);
    }
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleDelete = (id: string, memberName: string) => {
    if (confirm(`Are you sure you want to remove ${memberName} from the organization?`)) {
      removeMember(id);
      showToast(`Removed ${memberName} from team`);
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-500 text-slate-950 font-mono text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-black uppercase tracking-wider text-white">
              Team Members & Role-Based Access
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/20">
              {members.length} {members.length === 1 ? 'Member' : 'Members'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage organization collaborators, API credentials scope access, and developer permissions • Powered by <span className="text-emerald-400 font-bold">PRIGID GROUP</span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenInvite}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 flex items-center gap-2 transition-all self-start sm:self-auto shadow-lg shadow-emerald-500/10"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono w-full md:w-auto overflow-x-auto">
          {(['ALL', 'Admin', 'Developer', 'Viewer', 'Billing'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1 rounded-lg transition-all ${
                roleFilter === r
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r === 'ALL' ? 'All Roles' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#050811]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-base font-black text-white uppercase tracking-tight">
                {editingMember ? `Edit Member: ${editingMember.name}` : 'Invite New Team Member'}
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maya Lin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="maya@company.com"
                  value={email}
                  disabled={!!editingMember}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                    Access Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Admin">Admin (Full Control)</option>
                    <option value="Developer">Developer (Manage Keys & Logs)</option>
                    <option value="Viewer">Viewer (Read-Only Metrics)</option>
                    <option value="Billing">Billing (Invoices & Quotas)</option>
                  </select>
                </div>

                {editingMember && (
                  <div>
                    <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                      Account Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending Invite</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 transition-all"
                >
                  {editingMember ? 'Save Changes' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-3xl bg-[#070b14] border border-slate-800 space-y-3">
            <Users className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-black text-white">No team members match the filter</h4>
            <p className="text-xs text-slate-500">Try changing your search keywords or role filter</p>
          </div>
        ) : (
          filteredMembers.map((m) => {
            const roleBadgeColor =
              m.role === 'Admin'
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : m.role === 'Developer'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : m.role === 'Billing'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-sky-500/10 text-sky-400 border-sky-500/20';

            return (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 shadow-xl space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-600 flex items-center justify-center font-black text-slate-950 text-sm shrink-0 overflow-hidden">
                        {m.avatar ? (
                          <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          m.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{m.name}</h4>
                        <div className="text-[11px] text-slate-400 font-mono truncate">{m.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
                        title="Edit Member Role"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id, m.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Remove Member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${roleBadgeColor}`}>
                      {m.role}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        m.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {m.status === 'active' ? 'Active' : 'Pending Invite'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono flex items-center justify-between">
                  <span>Joined: {m.joinedAt}</span>
                  <span className="text-slate-400">PRIGID Member</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
