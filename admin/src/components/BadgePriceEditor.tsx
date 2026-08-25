'use client';

import { useState } from 'react';
import { fetchSettings, updateSettings } from '@/services/api';

export default function BadgePriceEditor({ initialPrice }: { initialPrice: number }) {
  const [price, setPrice] = useState<number>(initialPrice);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSavePrice = async () => {
    setIsSaving(true);
    try {
      const currentSettings = await fetchSettings();
      const updated = await updateSettings({
        ...currentSettings,
        verificationBadgePrice: price
      });
      if (updated) {
        setSuccessMsg(`Badge price updated to $${price.toFixed(2)} USD!`);
        setIsEditing(false);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (e) {
      console.error(e);
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
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
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
              onClick={() => setIsEditing(false)}
              className="text-emerald-300 hover:text-white text-xs px-2 py-1"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <span className="text-2xl font-extrabold text-emerald-300">${price.toFixed(2)} USD</span>
              <span className="block text-[10.5px] text-emerald-200">Per Verification</span>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center space-x-1"
            >
              <span>✏️ Change Price</span>
            </button>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="w-full text-xs font-semibold bg-emerald-800 text-emerald-200 p-2 rounded-lg text-center">
          {successMsg}
        </div>
      )}
    </div>
  );
}
