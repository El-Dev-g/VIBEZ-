import { fetchBadgePayments } from '@/services/api';
import BadgePriceEditor from '@/components/BadgePriceEditor';

export const dynamic = 'force-dynamic';

export default async function BadgesPage() {
  const data = await fetchBadgePayments();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen text-black">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-black">Green Verification Badges & Revenue</h1>
        <p className="text-sm font-semibold text-gray-900 mt-1">
          Monitor green checkmark badge subscriptions, dynamic pricing configuration, payment audit trails, and transaction IDs.
        </p>
      </div>

      {/* Interactive Price Editor Card */}
      <BadgePriceEditor initialPrice={data.verificationBadgePrice} />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border-2 border-gray-300 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-black">Total Badge Revenue</span>
            <span className="rounded-full bg-emerald-100 p-2 text-emerald-800 font-bold">💵</span>
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-800">
            ${data.totalRevenue.toFixed(2)} USD
          </p>
          <p className="mt-1 text-xs font-bold text-black">From verification badge sales</p>
        </div>

        <div className="rounded-2xl border-2 border-gray-300 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-black">Total Badge Purchases</span>
            <span className="rounded-full bg-blue-100 p-2 text-blue-800 font-bold">💳</span>
          </div>
          <p className="mt-3 text-3xl font-black text-black">
            {data.totalPurchases}
          </p>
          <p className="mt-1 text-xs font-bold text-black">Completed verification transactions</p>
        </div>

        <div className="rounded-2xl border-2 border-gray-300 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-black">Active Verified Users</span>
            <span className="rounded-full bg-green-100 p-2 text-green-800 font-bold">✅</span>
          </div>
          <p className="mt-3 text-3xl font-black text-black">
            {data.verifiedUsersCount}
          </p>
          <p className="mt-1 text-xs font-bold text-black">Users carrying green checkmark badge</p>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="rounded-2xl border-2 border-gray-300 bg-white shadow-sm overflow-hidden">
        <div className="border-b-2 border-gray-200 bg-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-black text-black">Paid Verification Receipts & Security Logs</h2>
          <span className="text-xs bg-emerald-200 text-black border border-emerald-400 font-black px-2.5 py-1 rounded-full">
            Active Price: ${data.verificationBadgePrice.toFixed(2)} / badge
          </span>
        </div>

        {data.payments.length === 0 ? (
          <div className="p-12 text-center text-black font-bold text-sm">
            No verification badge payments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y-2 divide-gray-200 text-sm">
              <thead className="bg-gray-100 text-left text-xs font-black uppercase tracking-wider text-black">
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
                        <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center justify-center font-black text-sm">
                          {p.user?.name ? p.user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-black text-black flex items-center space-x-1">
                            <span>{p.user?.name || 'Unknown User'}</span>
                            <span className="text-emerald-600 font-bold" title="Verified Badge">✅</span>
                          </div>
                          <div className="text-xs font-bold text-black">{p.user?.phoneNumber || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-black text-black">
                      ${p.amount.toFixed(2)} {p.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-black text-black uppercase">
                      {p.paymentProvider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-bold text-black">
                      {p.transactionId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex rounded-full bg-green-200 border border-green-400 px-2.5 py-0.5 text-xs font-black text-black">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-black text-black">
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
