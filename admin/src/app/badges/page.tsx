'use client';

import React, { useState, useEffect } from 'react';
import { fetchBadgePayments, BadgeSummary } from '@/services/api';
import BadgePriceEditor from '@/components/BadgePriceEditor';

export default function BadgesPage() {
  const [data, setData] = useState<BadgeSummary>({
    verificationBadgePrice: 3.00,
    totalRevenue: 0,
    totalPurchases: 0,
    verifiedUsersCount: 0,
    payments: []
  });
  const [loading, setLoading] = useState(true);

  const loadBadgeData = async () => {
    setLoading(true);
    try {
      const res = await fetchBadgePayments();
      if (res) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to fetch badge telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBadgeData();
  }, []);

  return (
    <div className="space-y-10 animate-fadeIn pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Badges & Revenue</h2>
          <p className="text-slate-500 font-bold mt-1">Monitor green verification subscriptions and dynamic pricing.</p>
        </div>
        <button
          onClick={loadBadgeData}
          disabled={loading}
          className="self-start flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-700 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-500' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Refreshing...' : 'Refresh Feed'}
        </button>
      </div>

      {/* Price Editor Container */}
      <div className="bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-900/20">
        <BadgePriceEditor initialPrice={data.verificationBadgePrice} />
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RevenueCard 
          title="Total Badge Revenue" 
          value={loading ? '...' : `$${(data.totalRevenue || 0).toFixed(2)}`} 
          label="Verification Sales" 
          icon="💰" 
          color="bg-emerald-500" 
        />
        <RevenueCard 
          title="Total Purchases" 
          value={loading ? '...' : (data.totalPurchases || 0)} 
          label="Successful Transactions" 
          icon="💳" 
          color="bg-blue-500" 
        />
        <RevenueCard 
          title="Verified Citizens" 
          value={loading ? '...' : (data.verifiedUsersCount || 0)} 
          label="Active Green Badges" 
          icon="✅" 
          color="bg-purple-500" 
        />
      </div>

      {/* Transaction History Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-slate-900 rounded-full"></div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Security Audit Logs</h3>
          </div>
          <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
            Active Feed
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          {(data.payments || []).length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No payment records detected in current ledger.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">User Identity</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Amount</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Merchant</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Protocol ID</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Settlement</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-sm">
                  {(data.payments || []).map((p) => (
                    <tr key={p.id} className="group hover:bg-slate-50/50 transition-all duration-200">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs border border-emerald-100">
                            {p.user?.name ? p.user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-black text-slate-900 flex items-center gap-1.5">
                              {p.user?.name || 'Unknown'}
                              <span className="text-emerald-500">✅</span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-400">{p.user?.phoneNumber || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap font-black text-slate-900">
                        ${(p.amount || 0).toFixed(2)} <span className="text-[10px] text-slate-400 uppercase tracking-widest">{p.currency || 'USD'}</span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200">
                          {p.paymentProvider || 'Direct'}
                        </span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap font-mono text-[10px] font-bold text-slate-400 tracking-tighter">
                        {p.transactionId || p.id}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                          <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                          {p.status || 'Completed'}
                        </span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {p.createdAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RevenueCard({ title, value, label, icon, color }: { title: string; value: string | number; label: string; icon: string; color: string }) {
  return (
    <div className="relative group overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50">
      <div className="flex items-center justify-between">
        <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-white text-2xl shadow-lg shadow-current/20 transition-transform group-hover:scale-110`}>
          {icon}
        </div>
      </div>
      <div className="mt-8">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{title}</h3>
        <p className="mt-2 text-4xl font-black text-slate-900 tracking-tight">
          {value}
        </p>
        <p className="mt-2 text-xs font-bold text-slate-500">{label}</p>
      </div>
    </div>
  );
}
