import { fetchSettings, SystemSettings } from '../../services/api';
import PolicyManager from '../../components/PolicyManager';

export const dynamic = 'force-dynamic';

export default async function PolicyPage() {
  let settings: SystemSettings | null = null;
  try {
    settings = await fetchSettings();
  } catch (error) {
    console.error('PolicyPage fetchSettings error:', error);
  }

  return (
    <PolicyManager initialSettings={settings} />
  );
}
