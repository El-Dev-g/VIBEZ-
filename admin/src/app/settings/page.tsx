import { fetchSettings } from '@/services/api';
import SettingsForm from '@/components/SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await fetchSettings();

  return (
    <div className="space-y-12 animate-fadeIn max-w-5xl">
      <div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Settings</h2>
        <p className="text-slate-500 font-bold mt-1">Configure global parameters and verification badge pricing for the ecosystem.</p>
      </div>

      <SettingsForm initialSettings={settings} />

      <div className="bg-red-50 rounded-[2.5rem] border border-red-100 p-10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h4 className="text-lg font-black text-red-900 tracking-tight">Danger Zone</h4>
        </div>
        <p className="text-sm font-bold text-red-600/80">These actions bypass all protocols and are irreversible. Proceed with extreme caution.</p>
        <div className="flex flex-wrap gap-4">
          <button className="px-8 py-4 rounded-2xl bg-white border border-red-100 text-sm font-black text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95">
            Purge All Media Cache
          </button>
          <button className="px-8 py-4 rounded-2xl bg-white border border-red-100 text-sm font-black text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95">
            Reset Encryption Keys
          </button>
        </div>
      </div>
    </div>
  );
}
