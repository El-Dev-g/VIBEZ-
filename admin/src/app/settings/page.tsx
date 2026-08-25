import { fetchSettings } from '@/services/api';
import AdminSettingsDashboard from '@/components/AdminSettingsDashboard';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await fetchSettings();

  return (
    <AdminSettingsDashboard initialSettings={settings} />
  );
}
