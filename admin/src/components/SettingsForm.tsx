'use client';

import { useState } from 'react';
import { SystemSettings, updateSettings } from '@/services/api';

export default function SettingsForm({ initialSettings }: { initialSettings: SystemSettings }) {
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setToastMessage(null);
    const success = await updateSettings(settings);
    setIsSaving(false);

    if (success) {
      setToastMessage('System settings & Verification Badge Price updated successfully!');
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setToastMessage('Failed to save settings. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 space-y-6">
        {/* Toggle 1: Registration */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Allow New Registrations</h4>
            <p className="text-xs text-gray-500">Enable or disable user onboarding globally.</p>
          </div>
          <button
            type="button"
            onClick={() => setSettings({ ...settings, allowNewRegistrations: !settings.allowNewRegistrations })}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${
              settings.allowNewRegistrations ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition-transform ${
                settings.allowNewRegistrations ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Toggle 2: Maintenance */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Maintenance Mode</h4>
            <p className="text-xs text-gray-500">Put the system in read-only mode for maintenance.</p>
          </div>
          <button
            type="button"
            onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${
              settings.maintenanceMode ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition-transform ${
                settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
          {/* Verification Badge Price ($ USD) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-emerald-900 flex items-center space-x-1">
              <span>Verification Badge Price ($ USD)</span>
              <span className="text-emerald-600 font-bold">✅</span>
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 text-sm">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.50"
                value={settings.verificationBadgePrice ?? 3.00}
                onChange={(e) => setSettings({ ...settings, verificationBadgePrice: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-md border border-emerald-300 pl-7 pr-3 py-2 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-emerald-50/30"
              />
            </div>
            <p className="text-xs text-gray-500">
              Users pay this price in app to receive their green checkmark badge.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">Max Group Size</label>
            <input
              type="number"
              value={settings.maxGroupSize}
              onChange={(e) => setSettings({ ...settings, maxGroupSize: parseInt(e.target.value) || 1024 })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">Message Retention (Days)</label>
            <input
              type="number"
              value={settings.retentionDays}
              onChange={(e) => setSettings({ ...settings, retentionDays: parseInt(e.target.value) || 90 })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="px-6 py-2 bg-emerald-100 text-emerald-800 text-xs font-semibold">
          {toastMessage}
        </div>
      )}

      <div className="bg-gray-50 px-6 py-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
