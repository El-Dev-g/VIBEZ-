'use client';

import React, { useState } from 'react';
import { 
  CreditCard, 
  Receipt, 
  ArrowUpRight, 
  Package, 
  ShieldCheck, 
  Zap, 
  Download, 
  History,
  AlertCircle,
  ExternalLink,
  Wallet,
  ChevronRight
} from 'lucide-react';

export const BillingManager: React.FC = () => {
  const [activePlan] = useState('Enterprise');

  const plans = [
    {
      name: 'Developer',
      price: '$0',
      description: 'Perfect for prototyping and early-stage development.',
      features: ['1,000,000 API Requests/mo', 'Basic Support', '1 Team Member'],
      current: activePlan === 'Developer'
    },
    {
      name: 'Scale',
      price: '$499/mo',
      description: 'For growing applications with high traffic demands.',
      features: ['10,000,000 API Requests/mo', 'Priority Support', '10 Team Members', 'Custom Webhooks'],
      current: activePlan === 'Scale'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'Dedicated infrastructure for mission-critical apps.',
      features: ['Unlimited API Requests', '24/7 Dedicated Support', 'Unlimited Team Members', 'SLA Guarantee', 'Dedicated VPC'],
      current: activePlan === 'Enterprise'
    }
  ];

  const invoices = [
    { id: 'INV-2026-001', date: 'Aug 01, 2026', amount: '$1,250.00', status: 'Paid' },
    { id: 'INV-2026-002', date: 'Jul 01, 2026', amount: '$1,250.00', status: 'Paid' },
    { id: 'INV-2026-003', date: 'Jun 01, 2026', amount: '$1,250.00', status: 'Paid' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-black uppercase tracking-wider text-white">
              Billing & Subscriptions
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your organization's plan, payment methods, and historical invoices.
          </p>
        </div>

        <button className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white hover:bg-slate-800 transition-all flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span>Payment Methods</span>
        </button>
      </div>

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div 
            key={plan.name} 
            className={`p-6 rounded-3xl border transition-all ${
              plan.current 
                ? 'bg-emerald-500/5 border-emerald-500/30 ring-1 ring-emerald-500/20' 
                : 'bg-[#070b14] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider ${
                plan.current ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'
              }`}>
                {plan.name}
              </span>
              {plan.current && <ShieldCheck className="w-5 h-5 text-emerald-400" />}
            </div>
            
            <div className="mb-6">
              <div className="text-3xl font-black text-white">{plan.price}</div>
              <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-[11px] text-slate-300">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  {feature}
                </li>
              ))}
            </ul>

            <button 
              disabled={plan.current}
              className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                plan.current 
                  ? 'bg-slate-900 text-slate-500 cursor-not-allowed' 
                  : 'bg-white text-slate-950 hover:opacity-90'
              }`}
            >
              {plan.current ? 'Active Plan' : 'Upgrade Plan'}
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Invoices */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-6 rounded-3xl bg-[#070b14] border border-slate-800 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                Billing History
              </h4>
              <button className="text-[10px] font-mono text-slate-500 hover:text-white uppercase">Download All (PDF)</button>
            </div>

            <div className="space-y-2">
              {invoices.map((inv) => (
                <div key={inv.id} className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/50 flex items-center justify-between group hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                      <Download className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{inv.id}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{inv.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs font-black text-white">{inv.amount}</div>
                      <div className="text-[9px] font-mono text-emerald-400 uppercase tracking-tighter">{inv.status}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-800 group-hover:text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Usage Alerts */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Usage Summary
            </h4>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1.5 uppercase">
                  <span>Monthly Quota</span>
                  <span>42% Used</span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[42%] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
                Your next billing cycle begins in **12 days**. You are currently on track to stay within your Enterprise limits.
              </p>

              <button className="w-full py-2.5 rounded-xl border border-slate-800 text-[10px] font-black uppercase text-slate-400 hover:text-white hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                Usage Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
