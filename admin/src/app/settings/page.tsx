import { fetchSettings } from '@/services/api';
import AdminSettingsDashboard from '@/components/AdminSettingsDashboard';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  let settings = null;
  try {
    settings = await fetchSettings();
  } catch (error) {
    console.error('SettingsPage fetchSettings error:', error);
  }

  return (
    <AdminSettingsDashboard initialSettings={settings} />
  );
}
