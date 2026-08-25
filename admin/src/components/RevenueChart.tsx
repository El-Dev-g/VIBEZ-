'use client';

import React, { useState, useEffect } from 'react';
import { fetchPaymentTransactions } from '@/services/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function RevenueChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const transactions = await fetchPaymentTransactions();

    // Group transactions by date (only counting COMPLETED)
    const dailyRevenue: Record<string, number> = {};

    // Sort transactions by date ascending first to ensure correct timeline
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    sorted.forEach((tx) => {
      if (tx.status === 'COMPLETED') {
        const date = new Date(tx.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        dailyRevenue[date] = (dailyRevenue[date] || 0) + tx.amount;
      }
    });

    const chartData = Object.keys(dailyRevenue).map((date) => ({
      date,
      revenue: dailyRevenue[date],
    }));

    setData(chartData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="h-[300px] bg-white/5 border border-white/5 rounded-2xl p-6 animate-pulse flex flex-col justify-between">
        <div className="h-4 bg-white/10 w-32 rounded"></div>
        <div className="space-y-4">
          <div className="h-2 bg-white/10 w-full rounded"></div>
          <div className="h-2 bg-white/10 w-5/6 rounded"></div>
          <div className="h-2 bg-white/10 w-full rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[350px] bg-white/5 border border-white/5 rounded-2xl p-6">
      <h3 className="text-lg font-black text-white mb-4">Daily Revenue</h3>
      {data.length === 0 ? (
        <div className="h-[250px] flex items-center justify-center">
          <p className="text-gray-500 font-bold">No revenue data available.</p>
        </div>
      ) : (
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#0f172a', stroke: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
