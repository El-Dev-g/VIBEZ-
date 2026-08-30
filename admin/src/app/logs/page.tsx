import { fetchAuditLogs } from '../../services/api';
import LogsClient from './LogsClient';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage() {
  let logs = [];
  try {
    logs = await fetchAuditLogs();
  } catch (error) {
    console.error('AuditLogsPage fetchAuditLogs error:', error);
  }

  return <LogsClient initialLogs={logs} />;
}

