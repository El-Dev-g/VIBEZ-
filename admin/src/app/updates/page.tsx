import { fetchLatestUpdate } from '../../services/api';
import UpdatesManager from '../../components/UpdatesManager';

export const dynamic = 'force-dynamic';

export default async function UpdatesPage() {
  const latestUpdate = await fetchLatestUpdate();

  return (
    <UpdatesManager initialUpdate={latestUpdate} />
  );
}
