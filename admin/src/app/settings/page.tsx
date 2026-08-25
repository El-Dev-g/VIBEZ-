import { fetchSettings } from '@/services/api';
import SettingsForm from '@/components/SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await fetchSettings();

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
        <p className="text-gray-500">Configure global parameters and verification badge pricing for VIBEZ.</p>
      </div>

      <SettingsForm initialSettings={settings} />

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
