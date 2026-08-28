'use client';

import React, { useState } from 'react';
import { Users, UserPlus, Mail, Shield, Trash2, Check, X, ShieldAlert } from 'lucide-react';
import { useDeveloperAuth, TeamMember } from '../context/DeveloperAuthContext';

export const TeamMembersManager: React.FC = () => {
  const { members, inviteMember, removeMember } = useDeveloperAuth();
  const [isInviting, setIsInviting] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Admin' | 'Developer' | 'Viewer' | 'Billing'>('Developer');
  const [successMsg, setSuccessMsg] = useState(false);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    inviteMember(email, name, role);
    setIsInviting(false);
    setEmail('');
    setName('');
    setRole('Developer');
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-black uppercase tracking-wider text-white">
              Team Members & Role-Based Access
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage organization members, collaborator roles, and SDK credentials permissions • Powered by <span className="text-emerald-400 font-bold">PRIGID GROUP</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsInviting(!isInviting)}
          className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>Invitation successfully sent! The new member will receive an activation email.</span>
        </div>
      )}

      {/* Invite Modal/Form */}
      {isInviting && (
        <form onSubmit={handleInviteSubmit} className="p-6 rounded-2xl bg-[#090d16] border border-emerald-500/30 space-y-4 shadow-2xl">
          <h4 className="text-sm font-black text-white uppercase tracking-wider">Invite Team Collaborator</h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Jordan Hayes"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="jordan@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Access Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
              >
                <option value="Admin">Admin (Full Control)</option>
                <option value="Developer">Developer (Manage Keys & Logs)</option>
                <option value="Viewer">Viewer (Read-Only Metrics)</option>
                <option value="Billing">Billing (Invoices & Quota)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsInviting(false)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase hover:bg-emerald-400 transition-all"
            >
              Send Invitation
            </button>
          </div>
        </form>
      )}

      {/* Members List Table */}
      <div className="rounded-2xl bg-[#070b14] border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase">
            Active Organization Members ({members.length})
          </span>
          <span className="text-[11px] font-mono text-slate-500">SSO & SAML enabled</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {members.map((mem) => {
            const roleBadge =
              mem.role === 'Admin'
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                : mem.role === 'Developer'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : mem.role === 'Billing'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-slate-500/10 text-slate-400 border-slate-500/20';

            return (
              <div
                key={mem.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={mem.avatar}
                    alt={mem.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-800"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">{mem.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${roleBadge}`}>
                        {mem.role}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400">{mem.email}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 text-xs font-mono">
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      mem.status === 'active' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {mem.status === 'active' ? '● Active' : '○ Pending'}
                    </span>
                    <div className="text-[10px] text-slate-500">Joined {mem.joinedAt}</div>
                  </div>

                  {mem.role !== 'Admin' && (
                    <button
                      type="button"
                      onClick={() => removeMember(mem.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
