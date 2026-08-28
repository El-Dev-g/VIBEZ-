'use client';

import React, { useState } from 'react';
import { Gauge, Zap, AlertTriangle, ShieldCheck, TrendingUp, Sliders, Check } from 'lucide-react';

export const RateLimitingQuotaManager: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<'Enterprise' | 'Scale' | 'Developer'>('Enterprise');
  const [customBurstLimit, setCustomBurstLimit] = useState(5000);
  const [alertThreshold, setAlertThreshold] = useState(85);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const tiers = {
    Enterprise: {
      rpsLimit: 2500,
      monthlyQuota: 50000000,
      usedThisMonth: 21840900,
      burstAllowance: 7500,
      sla: '99.99%',
      dedicatedSupport: true,
      price: '$499/mo',
    },
    Scale: {
      rpsLimit: 800,
      monthlyQuota: 10000000,
      usedThisMonth: 4230000,
      burstAllowance: 2000,
      sla: '99.95%',
      dedicatedSupport: false,
      price: '$149/mo',
    },
    Developer: {
      rpsLimit: 150,
      monthlyQuota: 1000000,
      usedThisMonth: 680000,
      burstAllowance: 300,
      sla: '99.9%',
      dedicatedSupport: false,
      price: 'Free',
    },
  };

  const current = tiers[selectedTier];
  const usagePercentage = Math.round((current.usedThisMonth / current.monthlyQuota) * 100);

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-black uppercase tracking-wider text-white">
              API Rate Limiting & Usage Quotas
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Token-bucket rate limits, monthly request caps, and automated threshold alerts • Powered by <span className="text-emerald-400 font-bold">PRIGID GROUP</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['Enterprise', 'Scale', 'Developer'] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                selectedTier === tier
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Quota Gauge & Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Monthly Quota Consumption */}
        <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase font-bold">Monthly Quota Consumption</span>
            <span className="text-xs font-mono font-bold text-emerald-400">{usagePercentage}%</span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usagePercentage > 90 ? 'bg-red-500' : usagePercentage > 75 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>{current.usedThisMonth.toLocaleString()} used</span>
            <span className="text-slate-300 font-bold">{current.monthlyQuota.toLocaleString()} limit</span>
          </div>
        </div>

        {/* Real-time Rate Limit Ceiling */}
        <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase font-bold">Peak Throughput Ceiling</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {current.rpsLimit.toLocaleString()} <span className="text-xs text-slate-500">req / sec</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Burst buffer: <span className="text-emerald-400 font-mono font-bold">+{current.burstAllowance} req</span> over 10s window.
          </p>
        </div>

        {/* SLA Guarantee */}
        <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase font-bold">Cloud SLA Uptime</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{current.sla}</div>
          <p className="text-[11px] text-slate-400">
            Backed by PRIGID GROUP High-Availability Multi-Region clusters.
          </p>
        </div>
      </div>

      {/* Quota Policy Settings Form */}
      <form onSubmit={handleSavePolicies} className="p-6 rounded-2xl bg-[#070b14] border border-slate-800 space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>Dynamic Throttle & Alert Configuration</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5">
              Custom Spike Tolerance (Max Burst Buffer)
            </label>
            <input
              type="number"
              value={customBurstLimit}
              onChange={(e) => setCustomBurstLimit(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5">
              Automated Webhook/Email Alert Trigger (%)
            </label>
            <input
              type="number"
              min={50}
              max={99}
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-500">
            Policies apply immediately across all active API keys in this organization.
          </span>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 flex items-center gap-1.5 transition-all"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Policies Updated!</span>
              </>
            ) : (
              <span>Update Rate Limits</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
