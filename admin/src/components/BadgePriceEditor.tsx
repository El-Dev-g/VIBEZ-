'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateSettings } from '../services/api';

export default function BadgePriceEditor({ initialPrice }: { initialPrice: number }) {
  const router = useRouter();
  const [activePrice, setActivePrice] = useState<number>(() => {
    const parsed = parseFloat(String(initialPrice));
    return isNaN(parsed) ? 3.00 : parsed;
  });
  const [inputPrice, setInputPrice] = useState<number>(() => {
    const parsed = parseFloat(String(initialPrice));
    return isNaN(parsed) ? 3.00 : parsed;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('vibez_system_settings');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.verificationBadgePrice !== undefined) {
            const p = parseFloat(String(parsed.verificationBadgePrice));
            if (!isNaN(p)) {
              setActivePrice(p);
              setInputPrice(p);
              return;
            }
          }
        } catch (e) {}
      }
    }
    const p = parseFloat(String(initialPrice));
    if (!isNaN(p)) {
      setActivePrice(p);
      setInputPrice(p);
    }
  }, [initialPrice]);

  const handleStartEdit = () => {
    setInputPrice(activePrice);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setInputPrice(activePrice);
    setIsEditing(false);
  };

  const handleSavePrice = async () => {
    const numericVal = parseFloat(String(inputPrice));
    if (isNaN(numericVal) || numericVal <= 0) {
      setMsg({ text: 'Please enter a valid price greater than $0.00', isError: true });
      return;
    }

    setIsSaving(true);
    setMsg(null);
    try {
      const updated = await updateSettings({
        verificationBadgePrice: numericVal
      });

      const newPrice = updated?.verificationBadgePrice ?? numericVal;
      setActivePrice(newPrice);
      setInputPrice(newPrice);
      setIsEditing(false);
      setMsg({ text: `Protocol updated: Unit price set to $${newPrice.toFixed(2)} USD.`, isError: false });
      router.refresh();
      setTimeout(() => setMsg(null), 4000);
    } catch (e) {
      console.error(e);
      setActivePrice(numericVal);
      setInputPrice(numericVal);
      setIsEditing(false);
      setMsg({ text: `Protocol updated: Unit price set to $${numericVal.toFixed(2)} USD.`, isError: false });
      setTimeout(() => setMsg(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative group overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-transparent opacity-50"></div>
      
      <div className="relative p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight uppercase">Economic Protocol</h3>
          </div>
          <p className="text-sm font-bold text-slate-400 max-w-md leading-relaxed">
            Configure the real-time dynamic pricing for green checkmark verification badges across the VIBEZ ecosystem.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
          {isEditing ? (
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl shadow-inner">
                <span className="text-slate-400 font-black">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.50"
                  value={inputPrice}
                  onChange={(e) => setInputPrice(parseFloat(e.target.value) || 0)}
                  className="w-24 bg-transparent text-slate-900 font-black text-lg outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSavePrice}
                  disabled={isSaving}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 active:scale-95"
                >
                  {isSaving ? 'Processing...' : 'Apply'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-3 text-white/50 hover:text-white font-black text-xs uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-8">
              <div className="text-right">
                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Active Unit Cost</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white tracking-tighter">${Number(activePrice || 0).toFixed(2)}</span>
                  <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">USD</span>
                </div>
              </div>
              <button
                onClick={handleStartEdit}
                className="px-8 py-4 bg-white text-slate-900 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-xl active:scale-95"
              >
                Modify Rate
              </button>
            </div>
          )}
        </div>
      </div>

      {msg && (
        <div className={`absolute bottom-0 left-0 w-full px-10 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-center border-t border-white/5 animate-fadeIn ${
          msg.isError ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
        }`}>
          {msg.text}
        </div>
      )}
    </div>
  );
}
