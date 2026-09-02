'use client';

import React, { useState, useEffect } from 'react';
import { AuditLog, fetchAuditLogs, clearAuditLogs } from '../../services/api';

export default function LogsClient({ initialLogs }: { initialLogs?: AuditLog[] }) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs || []);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [showFailuresOnly, setShowFailuresOnly] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 4000);
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLogs();
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      showToast('Failed to refresh audit trail', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to purge all historical audit logs? This action cannot be reversed.')) return;
    try {
      const ok = await clearAuditLogs();
      if (ok) {
        showToast('Audit trail purged successfully');
        loadLogs();
      } else {
        showToast('Failed to clear audit trail', true);
      }
    } catch (e) {
      showToast('Network error clearing logs', true);
    }
  };

  const handleExportLogs = () => {
    try {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(logs, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `vibez_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Audit logs exported successfully');
    } catch (err) {
      showToast('Failed to export logs', true);
    }
  };

  const uniqueActions = Array.from(new Set(logs.map(l => l.action))).filter(Boolean);

  const filteredLogs = logs.filter(l => {
    const matchesAction = actionFilter === 'ALL' || l.action === actionFilter;
    const isFailure = l.action.includes('FAILURE') || l.target.toLowerCase().includes('error');
    const matchesFailureToggle = !showFailuresOnly || isFailure;
    
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      l.adminEmail.toLowerCase().includes(query) ||
      l.action.toLowerCase().includes(query) ||
      l.target.toLowerCase().includes(query) ||
      l.timestamp.toLowerCase().includes(query);

    return matchesAction && matchesSearch && matchesFailureToggle;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Audit Logs & Security Trail</h2>
          <p className="text-slate-500 font-bold mt-1">Track administrative actions, user moderations, and system configuration modifications across the ecosystem.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFailuresOnly(!showFailuresOnly)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-2xl border transition-all shadow-sm active:scale-95 ${
              showFailuresOnly 
              ? 'bg-red-500 border-red-500 text-white hover:bg-red-600' 
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>🚨</span>
            <span>{showFailuresOnly ? 'Showing Failures' : 'Show Failures Only'}</span>
          </button>
          <button
            onClick={handleExportLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-700 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <span>📥</span>
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleClearLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 rounded-2xl hover:bg-red-100 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <span>🗑️</span>
            <span>Clear Logs</span>
          </button>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-700 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-500' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {toast && (
        <div className={`p-4 rounded-2xl font-bold text-sm border animate-fadeIn ${
          toast.isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {toast.isError ? '⚠️' : '✓'} {toast.message}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-black uppercase text-slate-400">Action Filter:</label>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Actions ({logs.length})</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Search audit trail..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Administrative Unit</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Protocol Action</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Target Vector</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No administrative audit events found.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isError = log.action.includes('FAILURE') || log.target.toLowerCase().includes('error');
                  return (
                    <tr key={log.id} className={`group transition-all duration-200 ${isError ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-slate-50/50'}`}>
                      <td className="whitespace-nowrap px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${isError ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}>
                            {log.adminEmail.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-sm font-black text-slate-900">{log.adminEmail}</div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border ${
                          isError 
                          ? 'bg-red-50 text-red-700 border-red-100' 
                          : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${isError ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className={`text-sm font-bold max-w-xl break-words ${isError ? 'text-red-700' : 'text-slate-600'}`}>
                          {log.target}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-8 py-6 text-right font-mono text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {log.timestamp}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
