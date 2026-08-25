import { fetchReports } from '@/services/api';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const reports = await fetchReports();

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Reports</h2>
        <p className="text-gray-500">Review and moderate flagged user behavior and content.</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Reporter</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Reported User</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{report.id}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{report.reporterName}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{report.reportedUserName}</td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{report.reason}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    report.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                    report.status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {report.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <button className="text-emerald-600 hover:text-emerald-900 mr-3">Resolve</button>
                  <button className="text-red-600 hover:text-red-900">Dismiss</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
