'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SystemSettings, updateSettings } from '@/services/api';

export default function SettingsForm({ initialSettings }: { initialSettings: SystemSettings }) {
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; isError: boolean } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setToast(null);
    const result = await updateSettings(settings);
    setIsSaving(false);

    if (result) {
      setSettings(result);
      setToast({ text: `Protocol updated: Verification set to $${result.verificationBadgePrice.toFixed(2)}`, isError: false });
      router.refresh();
      setTimeout(() => setToast(null), 4000);
    } else {
      setToast({ text: 'Protocol update failed.', isError: true });
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
      <div className="p-10 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Toggle 1: Registration */}
          <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Citizen Onboarding</h4>
              <p className="text-xs font-bold text-slate-500 mt-1">Enable global registration signals.</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, allowNewRegistrations: !settings.allowNewRegistrations })}
              className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${
                settings.allowNewRegistrations ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm ${
                  settings.allowNewRegistrations ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Toggle 2: Maintenance */}
          <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Protocol Lockout</h4>
              <p className="text-xs font-bold text-slate-500 mt-1">Activate system-wide maintenance.</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
              className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${
                settings.maintenanceMode ? 'bg-amber-500 shadow-lg shadow-amber-500/30' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm ${
                  settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-slate-100">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Verification Fee ($ USD)</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-5 text-slate-400 font-black text-sm group-focus-within:text-slate-900 transition-colors">$</div>
              <input
                type="number"
                step="0.01"
                min="0.50"
                value={settings.verificationBadgePrice ?? 3.00}
                onChange={(e) => setSettings({ ...settings, verificationBadgePrice: parseFloat(e.target.value) || 0 })}
                className="w-full pl-10 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
              />
            </div>
            <p className="text-[10px] font-bold text-slate-400 leading-relaxed px-1 uppercase tracking-widest">Global checkmark pricing.</p>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Max Signal Group Size</label>
            <input
              type="number"
              value={settings.maxGroupSize}
              onChange={(e) => setSettings({ ...settings, maxGroupSize: parseInt(e.target.value) || 1024 })}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
            />
            <p className="text-[10px] font-bold text-slate-400 leading-relaxed px-1 uppercase tracking-widest">Maximum cluster density.</p>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Data Retention (Days)</label>
            <input
              type="number"
              value={settings.retentionDays}
              onChange={(e) => setSettings({ ...settings, retentionDays: parseInt(e.target.value) || 90 })}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
            />
            <p className="text-[10px] font-bold text-slate-400 leading-relaxed px-1 uppercase tracking-widest">System archival lifespan.</p>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`px-10 py-5 text-sm font-black border-t border-b animate-fadeIn ${
          toast.isError ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
        }`}>
          {toast.text}
        </div>
      )}

      <div className="bg-slate-50 px-10 py-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-10 py-5 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 active:scale-95 flex items-center gap-3"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              Updating Protocols...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Apply Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
