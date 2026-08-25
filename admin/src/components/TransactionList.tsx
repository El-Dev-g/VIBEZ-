'use client';

import React, { useState, useEffect } from 'react';
import { fetchPaymentTransactions, PaymentTransaction } from '@/services/api';

export default function TransactionList() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    const data = await fetchPaymentTransactions();
    setTransactions(data);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'PENDING': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'FAILED': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-gray-400 bg-white/5 border-white/10';
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/5 rounded-2xl p-8 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-white/5 animate-pulse rounded-xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-white/[0.02] border-b border-white/5">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">User</th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Amount</th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Provider</th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-bold">
                  No payment transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-black text-emerald-400">
                        {tx.user?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{tx.user?.name || 'Unknown User'}</p>
                        <p className="text-[10px] font-bold text-gray-500">{tx.user?.phoneNumber || tx.userId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-white">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: tx.currency }).format(tx.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/5 text-gray-400 border border-white/10 uppercase tracking-wider">
                      {tx.provider}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
