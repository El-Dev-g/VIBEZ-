import { fetchSettings } from '@/services/api';

export default async function SettingsPage() {
  const settings = await fetchSettings();

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
        <p className="text-gray-500">Configure global parameters for the VIBEZ application.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Allow New Registrations</h4>
              <p className="text-xs text-gray-500">Enable or disable user onboarding globally.</p>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${settings.allowNewRegistrations ? 'bg-emerald-500' : 'bg-gray-300'}`}>
               <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.allowNewRegistrations ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Maintenance Mode</h4>
              <p className="text-xs text-gray-500">Put the system in read-only mode for maintenance.</p>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${settings.maintenanceMode ? 'bg-emerald-500' : 'bg-gray-300'}`}>
               <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">Max Group Size</label>
              <input 
                type="number" 
                defaultValue={settings.maxGroupSize}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">Message Retention (Days)</label>
              <input 
                type="number" 
                defaultValue={settings.retentionDays}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
            Save Changes
          </button>
        </div>
      </div>

      <div className="bg-red-50 rounded-xl border border-red-200 p-6 space-y-4">
        <h4 className="text-sm font-bold text-red-800">Danger Zone</h4>
        <p className="text-xs text-red-600">These actions are irreversible. Please proceed with caution.</p>
        <div className="flex space-x-4">
          <button className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
            Purge All Cached Media
          </button>
          <button className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
            Reset Server Keys
          </button>
        </div>
      </div>
    </div>
  );
}
