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
  Plus
} from 'lucide-react';
import { PaymentMethodModal } from './PaymentMethodModal';

export const BillingManager: React.FC = () => {
  const [activePlan, setActivePlan] = useState('Enterprise');
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 'pm_1', brand: 'Visa', last4: '4242', exp: '12/28', isDefault: true },
    { id: 'pm_2', brand: 'Mastercard', last4: '8810', exp: '09/27', isDefault: false }
  ]);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpgradePlan = (planName: string) => {
    setActivePlan(planName);
    showToast(`Successfully switched to ${planName} plan!`);
  };

  const handleAddCard = (card: { last4: string; brand: string; exp: string }) => {
    const newCard = {
      id: `pm_${Date.now()}`,
      brand: card.brand,
      last4: card.last4,
      exp: card.exp,
      isDefault: paymentMethods.length === 0
    };
    setPaymentMethods([...paymentMethods, newCard]);
    showToast(`Added ${card.brand} ending in ${card.last4}`);
  };

  const handleDeleteCard = (id: string) => {
    setPaymentMethods(paymentMethods.filter(p => p.id !== id));
    showToast('Payment method removed.');
  };

  const handleDownloadInvoice = (invId: string) => {
    showToast(`Downloading invoice ${invId} (PDF)...`);
  };

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
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

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

        <button 
          onClick={() => setIsAddCardOpen(true)}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Add Payment Method</span>
        </button>
      </div>

      {/* Payment Methods Section */}
      <div className="p-6 rounded-3xl bg-[#070b14] border border-slate-800 space-y-4 shadow-xl">
        <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-400" />
          Saved Payment Cards
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((pm) => (
            <div key={pm.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-emerald-400 text-xs">
                  {pm.brand === 'Visa' ? 'VISA' : 'MC'}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>•••• •••• •••• {pm.last4}</span>
                    {pm.isDefault && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-mono uppercase">Default</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">Expires {pm.exp}</div>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteCard(pm.id)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {paymentMethods.length === 0 && (
            <p className="text-xs text-slate-500 col-span-2 italic">No payment methods saved. Add one to enable automatic invoicing.</p>
          )}
        </div>
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
              onClick={() => handleUpgradePlan(plan.name)}
              disabled={plan.current}
              className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                plan.current 
                  ? 'bg-slate-900 text-slate-500 cursor-not-allowed' 
                  : 'bg-white text-slate-950 hover:opacity-90'
              }`}
            >
              {plan.current ? 'Active Plan' : `Upgrade to ${plan.name}`}
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
                Billing History & Invoices
              </h4>
              <button 
                onClick={() => showToast('Preparing ZIP archive of all historical invoices (PDF)...')}
                className="text-[10px] font-mono text-slate-500 hover:text-white uppercase"
              >
                Download All (PDF)
              </button>
            </div>

            <div className="space-y-2">
              {invoices.map((inv) => (
                <div key={inv.id} className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/50 flex items-center justify-between group hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleDownloadInvoice(inv.id)}
                      className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-emerald-500 transition-colors"
                    >
                      <Download className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    </button>
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
                    <button onClick={() => handleDownloadInvoice(inv.id)} className="p-1 text-slate-800 group-hover:text-slate-400">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Usage Summary */}
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
                Your next billing cycle begins in 12 days. You are currently on track to stay within your limits.
              </p>

              <button 
                onClick={() => showToast('Redirecting to detailed usage metrics & logs...')}
                className="w-full py-2.5 rounded-xl border border-slate-800 text-[10px] font-black uppercase text-slate-400 hover:text-white hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Usage Details
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
