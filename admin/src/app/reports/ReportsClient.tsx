'use client';

import React, { useState, useEffect } from 'react';
import { Report, fetchReports, updateReportStatus, deleteReport, banUser } from '../../services/api';

export default function ReportsClient({ initialReports }: { initialReports?: Report[] }) {
  const [reports, setReports] = useState<Report[]>(initialReports || []);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED' | 'DISMISSED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 4000);
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await fetchReports();
      setReports(data || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
      showToast('Failed to load reports list', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleUpdateStatus = async (reportId: string, newStatus: 'PENDING' | 'RESOLVED' | 'DISMISSED') => {
    try {
      const res = await updateReportStatus(reportId, newStatus);
      if (res.success) {
        setReports(prev =>
          prev.map(r => (r.id === reportId ? { ...r, status: newStatus === 'PENDING' ? 'Pending' : newStatus === 'RESOLVED' ? 'Resolved' : 'Dismissed' } : r))
        );
        showToast(`Report marked as ${newStatus}`);
        if (selectedReport?.id === reportId) {
          setSelectedReport(prev => prev ? { ...prev, status: newStatus === 'PENDING' ? 'Pending' : newStatus === 'RESOLVED' ? 'Resolved' : 'Dismissed' } : null);
        }
      } else {
        showToast(res.error || 'Failed to update report', true);
      }
    } catch (e) {
      showToast('Network error updating report', true);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to permanently delete this report record?')) return;
    try {
      const ok = await deleteReport(reportId);
      if (ok) {
        setReports(prev => prev.filter(r => r.id !== reportId));
        if (selectedReport?.id === reportId) setSelectedReport(null);
        showToast('Report deleted successfully');
      } else {
        showToast('Failed to delete report', true);
      }
    } catch (e) {
      showToast('Network error deleting report', true);
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesFilter =
      filter === 'ALL' ||
      r.status.toUpperCase() === filter;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      r.reporterName.toLowerCase().includes(query) ||
      r.reportedUserName.toLowerCase().includes(query) ||
      r.reason.toLowerCase().includes(query) ||
      r.id.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">User Reports & Moderation</h2>
          <p className="text-slate-500 font-bold mt-1">Review flagged user behavior, update ticket statuses, and enforce platform guidelines.</p>
        </div>
        <button
          onClick={loadReports}
          disabled={loading}
          className="self-start flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-700 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-500' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Refreshing...' : 'Refresh Feed'}
        </button>
      </div>

      {toast && (
        <div className={`p-4 rounded-2xl font-bold text-sm border animate-fadeIn ${
          toast.isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {toast.isError ? '⚠️' : '✓'} {toast.message}
        </div>
      )}

      {/* Filters & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start">
          {(['ALL', 'PENDING', 'RESOLVED', 'DISMISSED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                filter === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by user, reporter, reason..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Report ID</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Reporter</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Target Citizen</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Infraction Reason</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No matching infractions found.</p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="group hover:bg-slate-50/50 transition-all duration-200">
                    <td className="whitespace-nowrap px-8 py-6 font-mono text-[11px] font-bold text-slate-400">
                      {report.id.substring(0, 8)}...
                    </td>
                    <td className="whitespace-nowrap px-8 py-6">
                      <div className="text-sm font-black text-slate-900">{report.reporterName}</div>
                    </td>
                    <td className="whitespace-nowrap px-8 py-6">
                      <div className="text-sm font-bold text-slate-700">{report.reportedUserName}</div>
                    </td>
                    <td className="px-8 py-6 max-w-xs">
                      <p className="text-sm font-medium text-slate-600 line-clamp-2">{report.reason}</p>
                    </td>
                    <td className="whitespace-nowrap px-8 py-6">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                        report.status.toUpperCase() === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 
                        report.status.toUpperCase() === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          report.status.toUpperCase() === 'PENDING' ? 'bg-amber-500' : 
                          report.status.toUpperCase() === 'RESOLVED' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}></span>
                        {report.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {report.status.toUpperCase() !== 'RESOLVED' && (
                          <button
                            onClick={() => handleUpdateStatus(report.id, 'RESOLVED')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-700 text-[10px] font-black uppercase tracking-widest transition-all border border-emerald-200/60"
                            title="Mark as Resolved"
                          >
                            Resolve
                          </button>
                        )}
                        {report.status.toUpperCase() !== 'DISMISSED' && (
                          <button
                            onClick={() => handleUpdateStatus(report.id, 'DISMISSED')}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-700 hover:text-white text-slate-600 text-[10px] font-black uppercase tracking-widest transition-all"
                            title="Dismiss Report"
                          >
                            Dismiss
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-500 hover:text-white text-blue-700 text-[10px] font-black uppercase tracking-widest transition-all border border-blue-200/60"
                          title="View Full Details"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="p-1.5 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 transition-all"
                          title="Delete Report Record"
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
      </div>

      {/* Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Report Details</span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">Infraction Review</h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs font-black uppercase text-slate-400">Target Citizen:</span>
                <p className="font-bold text-slate-900 text-base">{selectedReport.reportedUserName}</p>
              </div>
              <div>
                <span className="text-xs font-black uppercase text-slate-400">Reported By:</span>
                <p className="font-bold text-slate-700">{selectedReport.reporterName}</p>
              </div>
              <div>
                <span className="text-xs font-black uppercase text-slate-400">Timestamp:</span>
                <p className="font-medium text-slate-500 font-mono text-xs">{selectedReport.timestamp}</p>
              </div>
              <div>
                <span className="text-xs font-black uppercase text-slate-400">Infraction Description:</span>
                <p className="mt-1 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                  {selectedReport.reason}
                </p>
              </div>
              <div>
                <span className="text-xs font-black uppercase text-slate-400">Current Status:</span>
                <p className="mt-1 font-bold text-slate-900">{selectedReport.status}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => handleUpdateStatus(selectedReport.id, 'RESOLVED')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-all"
              >
                Mark Resolved
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedReport.id, 'DISMISSED')}
                className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black uppercase tracking-wider transition-all"
              >
                Dismiss
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-wider hover:bg-slate-200 transition-all"
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
