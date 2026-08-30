'use client';

import React, { useState } from 'react';
import { 
  CreditCard, 
  Receipt, 
  ShieldCheck, 
  Zap, 
  Download, 
  AlertCircle,
  ExternalLink,
  Wallet,
  ChevronRight,
  CheckCircle2,
  Trash2,
  Plus,
  Loader2,
  Check,
  Sparkles
} from 'lucide-react';
import { PaymentMethodModal } from './PaymentMethodModal';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PlanItem {
  id: string;
  name: string;
  badge?: string;
  monthlyPrice: number;
  annualPrice: number;
  isCustomPrice?: boolean;
  description: string;
  features: PlanFeature[];
  highlight?: boolean;
}

export const BillingManager: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [activePlanId, setActivePlanId] = useState<string>('enterprise');
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [isBulkDownloading, setIsBulkDownloading] = useState<boolean>(false);

  const [paymentMethods, setPaymentMethods] = useState([
    { id: 'pm_1', brand: 'Visa', last4: '4242', exp: '12/28', isDefault: true },
    { id: 'pm_2', brand: 'Mastercard', last4: '8810', exp: '09/27', isDefault: false }
  ]);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpgradePlan = (plan: PlanItem) => {
    if (plan.id === activePlanId || upgradingPlanId) return;

    setUpgradingPlanId(plan.id);
    setTimeout(() => {
      setActivePlanId(plan.id);
      setUpgradingPlanId(null);
      showToast(`Successfully switched to ${plan.name} plan (${billingCycle})!`, 'success');
    }, 1000);
  };

  const handleAddCard = (card: { last4: string; brand: string; exp: string }) => {
    const newCard = {
      id: `pm_${Date.now()}`,
      brand: card.brand,
      last4: card.last4,
      exp: card.exp,
      isDefault: paymentMethods.length === 0
    };
    setPaymentMethods((prev) => [...prev, newCard]);
    showToast(`Added ${card.brand} ending in ${card.last4}`, 'success');
  };

  const handleDeleteCard = (id: string) => {
    setPaymentMethods((prev) => prev.filter((p) => p.id !== id));
    showToast('Payment method removed.', 'info');
  };

  const handleDownloadInvoice = (invId: string) => {
    setDownloadingInvoiceId(invId);
    setTimeout(() => {
      setDownloadingInvoiceId(null);
      showToast(`Invoice ${invId} (PDF) downloaded successfully.`, 'success');
    }, 800);
  };

  const handleBulkDownload = () => {
    setIsBulkDownloading(true);
    setTimeout(() => {
      setIsBulkDownloading(false);
      showToast('All historical invoices exported to invoices_archive.zip', 'success');
    }, 1200);
  };

  const plans: PlanItem[] = [
    {
      id: 'developer',
      name: 'Developer',
      monthlyPrice: 0,
      annualPrice: 0,
      description: 'Ideal for prototyping, sandbox testing, and indie builders.',
      features: [
        { text: '1,000,000 API Requests/month', included: true },
        { text: 'Community & Discord Support', included: true },
        { text: '1 Team Seat Included', included: true },
        { text: 'Standard Rate Limits (100 req/s)', included: true },
        { text: 'Realtime Webhook Delivery', included: false },
        { text: 'Custom VPC & Dedicated IP', included: false }
      ]
    },
    {
      id: 'scale',
      name: 'Scale',
      badge: 'Most Popular',
      highlight: true,
      monthlyPrice: 499,
      annualPrice: 399,
      description: 'Designed for production apps requiring throughput and team collaboration.',
      features: [
        { text: '10,000,000 API Requests/month', included: true },
        { text: 'Priority 1hr SLA Email Support', included: true },
        { text: '10 Team Member Seats', included: true },
        { text: 'High-throughput limits (1,000 req/s)', included: true },
        { text: 'Realtime Webhook Delivery & Replay', included: true },
        { text: 'Custom VPC & Dedicated IP', included: false }
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      isCustomPrice: true,
      monthlyPrice: 1250,
      annualPrice: 999,
      description: 'Dedicated infrastructure, guaranteed uptime SLA, and custom routing.',
      features: [
        { text: 'Unlimited Monthly API Requests', included: true },
        { text: '24/7 Dedicated Slack Channel & Support', included: true },
        { text: 'Unlimited Team Members & RBAC', included: true },
        { text: '99.99% Uptime SLA Guarantee', included: true },
        { text: 'Realtime Webhook Delivery & Replay', included: true },
        { text: 'Dedicated VPC, Custom IP & Vault', included: true }
      ]
    }
  ];

  const invoices = [
    { id: 'INV-2026-001', date: 'Aug 01, 2026', amount: '$1,250.00', status: 'Paid', method: 'Visa •••• 4242' },
    { id: 'INV-2026-002', date: 'Jul 01, 2026', amount: '$1,250.00', status: 'Paid', method: 'Visa •••• 4242' },
    { id: 'INV-2026-003', date: 'Jun 01, 2026', amount: '$1,250.00', status: 'Paid', method: 'Mastercard •••• 8810' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-slate-950 flex-shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-white">
                Billing & Subscription Management
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your organization subscription tiers, payment gateways, and invoice records.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Billing Cycle Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Annual</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono uppercase ${
                billingCycle === 'annual' ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                -20%
              </span>
            </button>
          </div>

          <button 
            onClick={() => setIsAddCardOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Card</span>
          </button>
        </div>
      </div>

      {/* Subscription Plans Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => {
          const isCurrent = plan.id === activePlanId;
          const isUpgradingThis = upgradingPlanId === plan.id;
          const isAnyUpgrading = upgradingPlanId !== null;

          const displayPrice = plan.isCustomPrice 
            ? 'Custom'
            : billingCycle === 'annual'
            ? `$${plan.annualPrice}`
            : `$${plan.monthlyPrice}`;

          return (
            <div 
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-3xl p-6 border transition-all duration-300 ${
                isCurrent 
                  ? 'bg-gradient-to-b from-emerald-950/20 via-slate-950 to-[#070b14] border-emerald-500/40 ring-1 ring-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.08)]' 
                  : plan.highlight
                  ? 'bg-gradient-to-b from-slate-900/60 to-[#070b14] border-slate-700 hover:border-slate-600 shadow-lg'
                  : 'bg-[#070b14] border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Top Badges */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider ${
                      isCurrent 
                        ? 'bg-emerald-500 text-slate-950' 
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}>
                      {plan.name}
                    </span>
                    {plan.badge && !isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-tight flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  {isCurrent && (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-[10px] uppercase font-mono tracking-wider">Active</span>
                    </div>
                  )}
                </div>

                {/* Price Display */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-white tracking-tight">
                      {displayPrice}
                    </span>
                    {!plan.isCustomPrice && plan.monthlyPrice > 0 && (
                      <span className="text-xs text-slate-400 font-mono">
                        /month {billingCycle === 'annual' && '(billed annually)'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 min-h-[32px] leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-slate-800/80 my-4" />

                {/* Features List */}
                <div className="space-y-2.5 mb-6">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                    Plan Specifications
                  </div>
                  {plan.features.map((feature, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-start gap-2.5 text-xs ${
                        feature.included ? 'text-slate-300' : 'text-slate-600 line-through'
                      }`}
                    >
                      {feature.included ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-700 flex-shrink-0 mt-0.5" />
                      )}
                      <span className="leading-tight">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => handleUpgradePlan(plan)}
                  disabled={isCurrent || isAnyUpgrading}
                  className={`w-full py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-default'
                      : isUpgradingThis
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-wait'
                      : plan.highlight
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-[0.98]'
                      : 'bg-white hover:bg-slate-100 text-slate-950 shadow-md active:scale-[0.98]'
                  } disabled:opacity-60`}
                >
                  {isUpgradingThis ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Updating Subscription...</span>
                    </>
                  ) : isCurrent ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Current Active Tier</span>
                    </>
                  ) : (
                    <span>Switch to {plan.name}</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Methods & Quota Usage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Invoices and History */}
        <div className="lg:col-span-8 space-y-6">
          {/* Payment Methods */}
          <div className="p-6 rounded-3xl bg-[#070b14] border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                Saved Payment Methods
              </h4>
              <button 
                onClick={() => setIsAddCardOpen(true)}
                className="text-[11px] font-mono text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add new card</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {paymentMethods.map((pm) => (
                <div 
                  key={pm.id} 
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-emerald-400 text-xs">
                      {pm.brand === 'Visa' ? 'VISA' : 'MC'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>•••• •••• •••• {pm.last4}</span>
                        {pm.isDefault && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-mono uppercase">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">Expires {pm.exp}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteCard(pm.id)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remove card"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {paymentMethods.length === 0 && (
                <div className="text-xs text-slate-500 col-span-2 py-4 text-center border border-dashed border-slate-800 rounded-2xl">
                  No payment methods stored. Add a payment method to enable automated billing.
                </div>
              )}
            </div>
          </div>

          {/* Billing Invoices */}
          <div className="p-6 rounded-3xl bg-[#070b14] border border-slate-800 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                Billing History & Tax Receipts
              </h4>
              <button 
                onClick={handleBulkDownload}
                disabled={isBulkDownloading}
                className="text-[10px] font-mono text-slate-400 hover:text-white uppercase flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isBulkDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Download All (PDF)</span>
              </button>
            </div>

            <div className="space-y-2">
              {invoices.map((inv) => {
                const isDownloadingThis = downloadingInvoiceId === inv.id;
                return (
                  <div 
                    key={inv.id} 
                    className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/50 flex items-center justify-between group hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3.5">
                      <button 
                        onClick={() => handleDownloadInvoice(inv.id)}
                        disabled={isDownloadingThis}
                        className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-emerald-500 transition-colors disabled:opacity-50"
                      >
                        {isDownloadingThis ? (
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                        ) : (
                          <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                        )}
                      </button>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{inv.id}</span>
                          <span className="text-[10px] text-slate-500 font-mono font-normal">({inv.method})</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{inv.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="text-right">
                        <div className="text-xs font-black text-white">{inv.amount}</div>
                        <div className="text-[9px] font-mono text-emerald-400 uppercase tracking-tighter">{inv.status}</div>
                      </div>
                      <button 
                        onClick={() => handleDownloadInvoice(inv.id)} 
                        className="p-1 text-slate-600 group-hover:text-slate-300 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Usage Summary & Billing Overview */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-5">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Resource Quota & Usage
            </h4>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5 uppercase">
                  <span>API Monthly Quota</span>
                  <span className="font-bold text-emerald-400">42% Used</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-emerald-500 w-[42%] shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-500" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>4.2M Requests</span>
                  <span>10.0M Cap</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5 uppercase">
                  <span>Webhook Dispatches</span>
                  <span className="font-bold text-emerald-400">18% Used</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-indigo-500 w-[18%] shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all duration-500" />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 mb-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Next Cycle: 12 Days Remaining</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                  Your billing period resets on September 10, 2026. Unused burst quotas roll over seamlessly.
                </p>
              </div>

              <button 
                onClick={() => showToast('Redirecting to detailed telemetry and traffic inspection...', 'info')}
                className="w-full py-2.5 rounded-xl border border-slate-800 text-[10px] font-black uppercase text-slate-300 hover:text-white hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Inspect Full Telemetry</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <PaymentMethodModal 
        isOpen={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        onAddCard={handleAddCard}
      />
    </div>
  );
};
