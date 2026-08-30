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
  Sparkles,
  FileText,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Eye,
  X,
  Printer
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

interface InvoiceRecord {
  id: string;
  date: string;
  period: string;
  planName: string;
  amount: number;
  formattedAmount: string;
  status: 'Paid' | 'Processing' | 'Refunded';
  method: string;
  methodLast4: string;
  cardBrand: 'Visa' | 'Mastercard' | 'Amex';
  taxAmount: string;
  authCode: string;
}

export const BillingManager: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [activePlanId, setActivePlanId] = useState<string>('enterprise');
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [isBulkDownloading, setIsBulkDownloading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Paid' | 'Processing'>('ALL');
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<InvoiceRecord | null>(null);

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

  // Generate and download a formatted PDF / HTML receipt
  const generatePdfReceipt = (inv: InvoiceRecord) => {
    const receiptHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>VIBEZ Receipt - ${inv.id}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #0f172a; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 24px; }
    .brand { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #059669; }
    .company-sub { font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-top: 2px; }
    .inv-title { font-size: 20px; font-weight: 800; text-align: right; color: #0f172a; }
    .inv-id { font-family: monospace; font-size: 13px; color: #475569; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px; }
    .label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; }
    .val { font-size: 13px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background-color: #f8fafc; text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; }
    td { padding: 14px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .total-row { font-weight: 800; font-size: 16px; background-color: #f1f5f9; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #d1fae5; color: #065f46; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">VIBEZ</div>
      <div class="company-sub">PRIGID GROUP Infrastructure Inc.</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
        100 Enterprise Blvd, Suite 400<br/>
        San Francisco, CA 94107<br/>
        VAT ID: US-PRIGID-2026-994
      </div>
    </div>
    <div>
      <div class="inv-title">TAX INVOICE / RECEIPT</div>
      <div class="inv-id">${inv.id}</div>
      <div style="margin-top: 8px;"><span class="badge">${inv.status}</span></div>
    </div>
  </div>

  <div class="grid">
    <div>
      <div class="label">Billed To</div>
      <div class="val">Developer Organization</div>
      <div style="font-size: 12px; color: #475569;">developer@prigid.com</div>
      <div style="font-size: 12px; color: #64748b;">Enterprise Account Tier</div>
    </div>
    <div>
      <div class="label">Payment Details</div>
      <div class="val">Date: ${inv.date}</div>
      <div style="font-size: 12px; color: #475569;">Billing Cycle: ${inv.period}</div>
      <div style="font-size: 12px; color: #475569;">Payment Method: ${inv.method}</div>
      <div style="font-size: 11px; color: #64748b; font-family: monospace;">Auth Code: ${inv.authCode}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Period</th>
        <th>Quantity</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>${inv.planName} Tier Cloud Infrastructure</strong><br/>
          <span style="font-size: 11px; color: #64748b;">Real-time WebSockets, WebRTC signaling & 50M API monthly requests</span>
        </td>
        <td>${inv.period}</td>
        <td>1</td>
        <td style="text-align: right;">${inv.formattedAmount}</td>
      </tr>
      <tr>
        <td colspan="3" style="text-align: right; color: #64748b;">Subtotal</td>
        <td style="text-align: right; font-weight: 600;">${inv.formattedAmount}</td>
      </tr>
      <tr>
        <td colspan="3" style="text-align: right; color: #64748b;">Estimated Taxes (0.00%)</td>
        <td style="text-align: right; font-weight: 600;">${inv.taxAmount}</td>
      </tr>
      <tr class="total-row">
        <td colspan="3" style="text-align: right;">Total Paid</td>
        <td style="text-align: right; color: #059669;">${inv.formattedAmount} USD</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    Thank you for building on the VIBEZ Developer Platform. This receipt serves as official proof of payment.<br/>
    For billing inquiries or tax exemptions, contact <strong style="color: #475569;">billing@prigid.com</strong>.
  </div>
</body>
</html>`;

    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VIBEZ_Receipt_${inv.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadInvoice = (inv: InvoiceRecord) => {
    setDownloadingInvoiceId(inv.id);
    setTimeout(() => {
      generatePdfReceipt(inv);
      setDownloadingInvoiceId(null);
      showToast(`Receipt for ${inv.id} downloaded successfully.`, 'success');
    }, 600);
  };

  const handleBulkDownload = () => {
    setIsBulkDownloading(true);
    setTimeout(() => {
      invoices.forEach((inv) => generatePdfReceipt(inv));
      setIsBulkDownloading(false);
      showToast('All historical invoice receipts exported successfully.', 'success');
    }, 1000);
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

  const invoices: InvoiceRecord[] = [
    {
      id: 'INV-2026-001',
      date: 'Aug 01, 2026',
      period: 'Aug 01, 2026 – Aug 31, 2026',
      planName: 'Enterprise Platform Plan',
      amount: 1250.00,
      formattedAmount: '$1,250.00',
      status: 'Paid',
      method: 'Visa •••• 4242',
      methodLast4: '4242',
      cardBrand: 'Visa',
      taxAmount: '$0.00',
      authCode: 'AUTH_PRG_982341'
    },
    {
      id: 'INV-2026-002',
      date: 'Jul 01, 2026',
      period: 'Jul 01, 2026 – Jul 31, 2026',
      planName: 'Enterprise Platform Plan',
      amount: 1250.00,
      formattedAmount: '$1,250.00',
      status: 'Paid',
      method: 'Visa •••• 4242',
      methodLast4: '4242',
      cardBrand: 'Visa',
      taxAmount: '$0.00',
      authCode: 'AUTH_PRG_873192'
    },
    {
      id: 'INV-2026-003',
      date: 'Jun 01, 2026',
      period: 'Jun 01, 2026 – Jun 30, 2026',
      planName: 'Enterprise Platform Plan',
      amount: 1250.00,
      formattedAmount: '$1,250.00',
      status: 'Paid',
      method: 'Mastercard •••• 8810',
      methodLast4: '8810',
      cardBrand: 'Mastercard',
      taxAmount: '$0.00',
      authCode: 'AUTH_PRG_761209'
    },
    {
      id: 'INV-2026-004',
      date: 'May 01, 2026',
      period: 'May 01, 2026 – May 31, 2026',
      planName: 'Scale Production Plan',
      amount: 499.00,
      formattedAmount: '$499.00',
      status: 'Paid',
      method: 'Mastercard •••• 8810',
      methodLast4: '8810',
      cardBrand: 'Mastercard',
      taxAmount: '$0.00',
      authCode: 'AUTH_PRG_650911'
    },
    {
      id: 'INV-2026-005',
      date: 'Apr 01, 2026',
      period: 'Apr 01, 2026 – Apr 30, 2026',
      planName: 'Scale Production Plan',
      amount: 499.00,
      formattedAmount: '$499.00',
      status: 'Paid',
      method: 'Mastercard •••• 8810',
      methodLast4: '8810',
      cardBrand: 'Mastercard',
      taxAmount: '$0.00',
      authCode: 'AUTH_PRG_549822'
    }
  ];

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = 
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.method.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalInvoicedLifetime = invoices.reduce((acc, inv) => acc + inv.amount, 0);

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
                Manage your organization subscription tiers, payment gateways, and past invoice records • Powered by <span className="text-emerald-400 font-bold">PRIGID GROUP</span>
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

      {/* Invoice Overview Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">Lifetime Invoiced</div>
            <div className="text-xl font-black text-white font-mono">${totalInvoicedLifetime.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="text-[10px] text-slate-500 font-mono">5 invoices across 2026</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">Current Billing Period</div>
            <div className="text-sm font-bold text-white font-mono">Aug 01 – Aug 31, 2026</div>
            <div className="text-[10px] text-emerald-400 font-mono font-bold">Autopay Active • Visa •••• 4242</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">Subscription Status</div>
            <div className="text-base font-black text-emerald-400 font-mono">Good Standing</div>
            <div className="text-[10px] text-slate-500 font-mono">100% On-time payment record</div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Saved Payment Methods & Summary Invoices Table */}
      <div className="space-y-6">
        {/* Saved Payment Methods */}
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

        {/* INVOICES SUMMARY TABLE */}
        <div className="p-6 rounded-3xl bg-[#070b14] border border-slate-800 shadow-xl space-y-4 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                Subscription Invoices & Tax Receipts
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Full chronological ledger of past recurring subscription billing statements and official receipts.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button 
                onClick={handleBulkDownload}
                disabled={isBulkDownloading}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-300 hover:text-white hover:border-slate-700 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isBulkDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Export All Receipts</span>
              </button>
            </div>
          </div>

          {/* Table Filters & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by invoice ID, date, or plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none placeholder:text-slate-600"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-[10px] text-slate-500 uppercase px-2">Status:</span>
              {(['ALL', 'Paid', 'Processing'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    statusFilter === status
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/40">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/60 font-mono text-[10px] uppercase text-slate-400 tracking-wider">
                  <th className="py-3.5 px-4 font-bold">Invoice Ref</th>
                  <th className="py-3.5 px-4 font-bold">Billing Date</th>
                  <th className="py-3.5 px-4 font-bold">Description & Tier</th>
                  <th className="py-3.5 px-4 font-bold">Payment Method</th>
                  <th className="py-3.5 px-4 font-bold">Amount</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">PDF Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredInvoices.map((inv) => {
                  const isDownloadingThis = downloadingInvoiceId === inv.id;
                  return (
                    <tr 
                      key={inv.id}
                      className="hover:bg-slate-900/40 transition-colors group"
                    >
                      {/* Invoice ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                          <span className="font-bold text-white">{inv.id}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-300">
                        <div>{inv.date}</div>
                        <div className="text-[10px] text-slate-500">{inv.period}</div>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 font-sans">
                        <div className="font-bold text-white text-xs">{inv.planName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Monthly recurring subscription</div>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-bold text-slate-400">
                            {inv.cardBrand}
                          </span>
                          <span>•••• {inv.methodLast4}</span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-white text-sm">{inv.formattedAmount}</div>
                        <div className="text-[10px] text-slate-500">USD</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{inv.status}</span>
                        </span>
                      </td>

                      {/* Receipt Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceForModal(inv)}
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                            title="Quick Inspect Receipt"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(inv)}
                            disabled={isDownloadingThis}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 font-bold text-[11px] flex items-center gap-1.5 transition-all disabled:opacity-50"
                          >
                            {isDownloadingThis ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No invoices found matching &quot;{searchQuery}&quot;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invoice Detail Inspection Modal */}
      {selectedInvoiceForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#070b14] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white font-mono">{selectedInvoiceForModal.id}</h4>
                  <p className="text-[11px] text-slate-400">Official Tax Receipt & Line Item Breakdown</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoiceForModal(null)}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Billing Date</div>
                  <div className="text-white font-bold">{selectedInvoiceForModal.date}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Status</div>
                  <div className="text-emerald-400 font-bold uppercase">{selectedInvoiceForModal.status}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Payment Method</div>
                  <div className="text-white font-bold">{selectedInvoiceForModal.method}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Auth Code</div>
                  <div className="text-slate-300">{selectedInvoiceForModal.authCode}</div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-slate-400">
                  <span>{selectedInvoiceForModal.planName}</span>
                  <span className="text-white font-bold">{selectedInvoiceForModal.formattedAmount}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Estimated Taxes (0.00%)</span>
                  <span>{selectedInvoiceForModal.taxAmount}</span>
                </div>
                <div className="h-px bg-slate-800 my-2" />
                <div className="flex justify-between text-sm font-bold text-white">
                  <span>Total Paid (USD)</span>
                  <span className="text-emerald-400 font-black">{selectedInvoiceForModal.formattedAmount}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedInvoiceForModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDownloadInvoice(selectedInvoiceForModal);
                  setSelectedInvoiceForModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-emerald-400 flex items-center gap-1.5 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Receipt PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <PaymentMethodModal 
        isOpen={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        onAddCard={handleAddCard}
      />
    </div>
  );
};
