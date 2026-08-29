'use client';

import React, { useState } from 'react';
import {
  Settings,
  Bell,
  ShieldAlert,
  Globe,
  Sliders,
  RefreshCw,
  Check,
  CheckCircle,
  Lock,
  Terminal,
  Zap,
  AlertTriangle
} from 'lucide-react';

export const DeveloperSettings: React.FC = () => {
  const [defaultEnv, setDefaultEnv] = useState<'sandbox' | 'production'>('sandbox');
  const [quotaAlerts, setQuotaAlerts] = useState(true);
  const [webhookFailAlerts, setWebhookFailAlerts] = useState(true);
  const [ipWhitelist, setIpWhitelist] = useState('0.0.0.0/0');
  const [saved, setSaved] = useState(false);
  const [signingSecret, setSigningSecret] = useState('whsec_vibez_98a74f82e1c0d54a2b9e');
  const [copiedSecret, setCopiedSecret] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleRollSecret = () => {
    const randomHex = Array.from({ length: 20 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    setSigningSecret(`whsec_vibez_${randomHex}`);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(signingSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {saved && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Developer settings updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Environment Preferences */}
        <div className="p-6 rounded-2xl bg-[#070b14] border border-slate-800 space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Environment & Default Settings</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-1.5">
              <label className="text-slate-400">Default Sandbox Mode</label>
              <select
                value={defaultEnv}
                onChange={(e) => setDefaultEnv(e.target.value as 'sandbox' | 'production')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="sandbox">Sandbox (Protected Mock Data)</option>
                <option value="production">Production (Live Spanner DB)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400">IP Whitelist / CIDR Firewall</label>
              <input
                type="text"
                value={ipWhitelist}
                onChange={(e) => setIpWhitelist(e.target.value)}
                placeholder="e.g. 192.168.1.1/32, 0.0.0.0/0"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Webhook Secret & Signing */}
        <div className="p-6 rounded-2xl bg-[#070b14] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              <span>Webhook Signing Secret</span>
            </h3>
            <button
              type="button"
              onClick={handleRollSecret}
              className="text-[11px] font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Roll Signing Key</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Use this secret key to verify HMAC SHA-256 signatures for outgoing Webhooks.
          </p>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-xs">
            <span className="text-purple-300 font-bold tracking-wider">{signingSecret}</span>
            <button
              type="button"
              onClick={handleCopySecret}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
            >
              {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span>Copy Secret</span>}
            </button>
          </div>
        </div>

        {/* Notifications & Thresholds */}
        <div className="p-6 rounded-2xl bg-[#070b14] border border-slate-800 space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Developer Alerts & Notifications</span>
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <label className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-white font-bold block">Rate Limit & Quota Threshold Alerts</span>
                <span className="text-slate-500 text-[10px]">Email alert when API usage exceeds 80% or 95% of monthly limit</span>
              </div>
              <input
                type="checkbox"
                checked={quotaAlerts}
                onChange={(e) => setQuotaAlerts(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
            </label>

            <label className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-white font-bold block">Webhook Delivery Failure Alerts</span>
                <span className="text-slate-500 text-[10px]">Immediate notice when webhooks fail 5+ consecutive retries</span>
              </div>
              <input
                type="checkbox"
                checked={webhookFailAlerts}
                onChange={(e) => setWebhookFailAlerts(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6 rounded-2xl bg-[#070b14] border border-rose-500/20 space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Danger Zone</span>
          </h3>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
            <div>
              <div className="text-xs font-bold text-white font-mono">Purge Sandbox Telemetry Data</div>
              <div className="text-[11px] text-slate-400">Clear all mock logs, event replays, and sandbox records</div>
            </div>
            <button
              type="button"
              onClick={() => alert('Sandbox telemetry purged.')}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs shrink-0"
            >
              Purge Data
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all"
          >
            Save Console Settings
          </button>
        </div>
      </form>
    </div>
  );
};
