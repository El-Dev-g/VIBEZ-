'use client';

import React, { useState } from 'react';
import PaymentSettings from '@/components/PaymentSettings';
import TransactionList from '@/components/TransactionList';
import RevenueChart from '@/components/RevenueChart';

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'config'>('transactions');

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Payments & Integration</h1>
          <p className="text-gray-500 font-bold mt-1">Manage payment providers and track system revenue.</p>
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
            Configuration
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {activeTab === 'transactions' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/5 p-6 rounded-2xl">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Total Revenue</p>
                <h3 className="text-2xl font-black text-white mt-1">$0.00</h3>
                <div className="mt-2 text-emerald-400 text-xs font-bold">+0% from last month</div>
              </div>
              <div className="bg-white/5 border border-white/5 p-6 rounded-2xl">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Active Providers</p>
                <h3 className="text-2xl font-black text-white mt-1">0</h3>
                <div className="mt-2 text-gray-500 text-xs font-bold">Stripe, PayPal supported</div>
              </div>
              <div className="bg-white/5 border border-white/5 p-6 rounded-2xl">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Success Rate</p>
                <h3 className="text-2xl font-black text-white mt-1">0%</h3>
                <div className="mt-2 text-rose-400 text-xs font-bold">No data available</div>
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
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Security Notice</h4>
                  <p className="text-xs font-bold text-emerald-400/80 mt-1">
                    API keys are stored securely on the server. Your backend acts as the only communication layer with the payment providers. No keys are ever exposed to the client apps.
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
