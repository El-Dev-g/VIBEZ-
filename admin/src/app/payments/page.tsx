'use client';

import React, { useState, useEffect } from 'react';
import PaymentSettings from '@/components/PaymentSettings';
import TransactionList from '@/components/TransactionList';
import RevenueChart from '@/components/RevenueChart';
import { fetchPaymentTransactions, fetchPaymentProviders, fetchBadgePayments } from '@/services/api';

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'config'>('transactions');
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    activeProvidersCount: 0,
    totalTransactionsCount: 0,
    successRate: 0,
    completedCount: 0
  });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    loadDashboardMetrics();
  }, []);

  const loadDashboardMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const [transactions, providers, badgePayments] = await Promise.all([
        fetchPaymentTransactions(),
        fetchPaymentProviders(),
        fetchBadgePayments()
      ]);

      const completedTx = (transactions || []).filter(t => t.status === 'COMPLETED');
      const completedBadges = (badgePayments || []).filter(b => b.status === 'COMPLETED');

      const txRevenue = completedTx.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
      const badgeRevenue = completedBadges.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
      const totalRevenue = txRevenue + badgeRevenue;

      const activeProviders = (providers || []).filter(p => p.isEnabled);

      const totalAll = (transactions?.length || 0) + (badgePayments?.length || 0);
      const totalCompleted = completedTx.length + completedBadges.length;
      const successRate = totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 100;

      setMetrics({
        totalRevenue,
        activeProvidersCount: activeProviders.length,
        totalTransactionsCount: totalAll,
        successRate,
        completedCount: totalCompleted
      });
    } catch (e) {
      console.error('Failed to load payment metrics', e);
    } finally {
      setLoadingMetrics(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Payments & Integration</h1>
          <p className="text-gray-400 font-bold mt-1">Manage payment providers, mask API keys, and track live platform revenue.</p>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 self-start">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
              activeTab === 'transactions' 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
              activeTab === 'config' 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Configuration & Keys
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {activeTab === 'transactions' ? (
          <div className="space-y-6">
            {/* Dynamic Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/60 border border-white/10 p-6 rounded-3xl shadow-xl shadow-slate-950/20">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Platform Revenue</p>
                <h3 className="text-3xl font-black text-white mt-2">
                  {loadingMetrics ? '...' : `$${metrics.totalRevenue.toFixed(2)}`}
                </h3>
                <div className="mt-2 text-emerald-400 text-xs font-black flex items-center gap-1">
                  <span>⚡</span>
                  <span>{metrics.completedCount} successful transactions</span>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-white/10 p-6 rounded-3xl shadow-xl shadow-slate-950/20">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Gateways</p>
                <h3 className="text-3xl font-black text-white mt-2">
                  {loadingMetrics ? '...' : metrics.activeProvidersCount}
                </h3>
                <div className="mt-2 text-slate-400 text-xs font-bold">
                  {metrics.activeProvidersCount > 0 ? 'Accepting live user payments' : 'All payment providers disabled'}
                </div>
              </div>

              <div className="bg-slate-900/60 border border-white/10 p-6 rounded-3xl shadow-xl shadow-slate-950/20">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Settlement Success Rate</p>
                <h3 className="text-3xl font-black text-white mt-2">
                  {loadingMetrics ? '...' : `${metrics.successRate}%`}
                </h3>
                <div className="mt-2 text-emerald-400 text-xs font-black">
                  {metrics.totalTransactionsCount > 0 ? `${metrics.totalTransactionsCount} total logged attempts` : 'Real-time Webhook monitored'}
                </div>
              </div>
            </div>

            <section>
              <RevenueChart />
            </section>
            
            <section className="space-y-4">
              <h2 className="text-xl font-black text-white px-2">Recent Transactions</h2>
              <TransactionList />
            </section>
          </div>
        ) : (
          <section className="space-y-6 max-w-4xl">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl shadow-lg">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-emerald-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base font-black text-white">Payment Provider Security & Verification Rules</h4>
                  <p className="text-xs font-bold text-emerald-300/80 mt-1 leading-relaxed">
                    1. <strong>Key Masking:</strong> Sensitive keys and client secrets are masked and kept encrypted.<br/>
                    2. <strong>Activation Guard:</strong> Providers cannot be turned on until required credentials are provided.<br/>
                    3. <strong>Admin Testing:</strong> Use the <em>Test Credentials</em> button to verify communication with the gateway before going live.
                  </p>
                </div>
              </div>
            </div>
            <PaymentSettings />
          </section>
        )}
      </div>
    </div>
  );
}
