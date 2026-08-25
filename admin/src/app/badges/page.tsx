import { fetchBadgePayments } from '@/services/api';

export const dynamic = 'force-dynamic';

export default async function BadgesPage() {
  const data = await fetchBadgePayments();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Green Verification Badges & Revenue</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor $3.00 green checkmark badge subscriptions, payment audit trails, and transaction IDs.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Badge Revenue</span>
            <span className="rounded-full bg-emerald-100 p-2 text-emerald-600 font-bold">💵</span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-600">
            ${data.totalRevenue.toFixed(2)} USD
          </p>
          <p className="mt-1 text-xs text-gray-500">From $3.00 verification badge sales</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Badge Purchases</span>
            <span className="rounded-full bg-blue-100 p-2 text-blue-600 font-bold">💳</span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-gray-900">
            {data.totalPurchases}
          </p>
          <p className="mt-1 text-xs text-gray-500">Completed $3.00 transactions</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active Verified Users</span>
            <span className="rounded-full bg-green-100 p-2 text-green-600 font-bold">✅</span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-gray-900">
            {data.verifiedUsersCount}
          </p>
          <p className="mt-1 text-xs text-gray-500">Users carrying green checkmark badge</p>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Paid Verification Receipts & Security Logs</h2>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-2.5 py-1 rounded-full">
            $3.00 / badge
          </span>
        </div>

        {data.payments.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            No verification badge payments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Provider</th>
                  <th className="px-6 py-3">Transaction ID</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                          {p.user?.name ? p.user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 flex items-center space-x-1">
                            <span>{p.user?.name || 'Unknown User'}</span>
                            <span className="text-emerald-500 font-bold" title="Verified Badge">✅</span>
                          </div>
                          <div className="text-xs text-gray-500">{p.user?.phoneNumber || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                      ${p.amount.toFixed(2)} {p.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-600 uppercase">
                      {p.paymentProvider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-700">
                      {p.transactionId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs text-gray-500">
                      {p.createdAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
