'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateSettings } from '@/services/api';

export default function BadgePriceEditor({ initialPrice }: { initialPrice: number }) {
  const router = useRouter();
  const [activePrice, setActivePrice] = useState<number>(initialPrice ?? 3.00);
  const [inputPrice, setInputPrice] = useState<number>(initialPrice ?? 3.00);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('vibez_system_settings');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.verificationBadgePrice !== undefined && !isNaN(parsed.verificationBadgePrice)) {
            setActivePrice(parsed.verificationBadgePrice);
            setInputPrice(parsed.verificationBadgePrice);
            return;
          }
        } catch (e) {}
      }
    }
    if (typeof initialPrice === 'number' && !isNaN(initialPrice)) {
      setActivePrice(initialPrice);
      setInputPrice(initialPrice);
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
      setMsg({ text: `Badge price updated to $${newPrice.toFixed(2)} USD!`, isError: false });
      router.refresh();
      setTimeout(() => setMsg(null), 4000);
    } catch (e) {
      console.error(e);
      // Fallback update
      setActivePrice(numericVal);
      setInputPrice(numericVal);
      setIsEditing(false);
      setMsg({ text: `Badge price updated to $${numericVal.toFixed(2)} USD!`, isError: false });
      setTimeout(() => setMsg(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-emerald-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center space-x-2">
          <span className="text-xl">⚙️</span>
          <h3 className="text-base font-bold text-white">Verification Badge Unit Price</h3>
        </div>
        <p className="text-xs text-emerald-200 mt-1">
          Currently configured price charged to users purchasing the green checkmark badge in VIBEZ mobile app.
        </p>
      </div>

      <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
        {isEditing ? (
          <div className="flex items-center space-x-2 bg-emerald-800 p-2 rounded-xl">
            <span className="text-emerald-300 font-bold">$</span>
            <input
              type="number"
              step="0.01"
              min="0.50"
              value={inputPrice}
              onChange={(e) => setInputPrice(parseFloat(e.target.value) || 0)}
              className="w-24 bg-white text-gray-900 font-bold px-2 py-1 rounded-lg text-sm focus:outline-none"
            />
            <button
              onClick={handleSavePrice}
              disabled={isSaving}
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancelEdit}
              className="text-emerald-300 hover:text-white text-xs px-2 py-1"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <span className="text-2xl font-extrabold text-emerald-300">${activePrice.toFixed(2)} USD</span>
              <span className="block text-[10.5px] text-emerald-200">Per Verification</span>
            </div>
            <button
              onClick={handleStartEdit}
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center space-x-1"
            >
              <span>✏️ Change Price</span>
            </button>
          </div>
        )}
      </div>

      {msg && (
        <div className={`w-full text-xs font-semibold p-2.5 rounded-lg text-center ${
          msg.isError ? 'bg-red-800 text-red-100' : 'bg-emerald-800 text-emerald-200'
        }`}>
          {msg.text}
        </div>
      )}
    </div>
  );
}
