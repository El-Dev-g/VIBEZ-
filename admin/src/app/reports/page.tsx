import { fetchReports, Report } from '../../services/api';
import ReportsClient from './ReportsClient';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  let reports: Report[] = [];
  try {
    reports = await fetchReports();
  } catch (error) {
    console.error('ReportsPage fetchReports error:', error);
  }

  return <ReportsClient initialReports={reports} />;
}

