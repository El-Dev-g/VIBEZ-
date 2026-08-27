'use client';

import React, { useState, useEffect } from 'react';
import { fetchPaymentTransactions, fetchBadgePayments } from '../services/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart
} from 'recharts';

interface DailyRevenuePoint {
  date: string;
  fullDate: string;
  badgeRevenue: number;
  badgeCount: number;
  generalRevenue: number;
  totalRevenue: number;
}

export default function RevenueChart() {
  const [data, setData] = useState<DailyRevenuePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'badges_only' | 'all_revenue' | 'comparison'>('badges_only');
  const [summaryStats, setSummaryStats] = useState({
    total30dBadgeRevenue: 0,
    total30dBadgesSold: 0,
    avgDailyBadgeRevenue: 0,
    peakBadgeRevenue: 0,
    peakBadgeDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [transactions, badgeData] = await Promise.all([
        fetchPaymentTransactions(),
        fetchBadgePayments()
      ]);

      const badgePayments = badgeData?.payments || [];

      // Generate continuous 30-day timeline map (from 29 days ago to today)
      const now = new Date();
      const timelineMap: Record<string, DailyRevenuePoint> = {};

      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const yyyyMmDd = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        timelineMap[yyyyMmDd] = {
          date: label,
          fullDate: yyyyMmDd,
          badgeRevenue: 0,
          badgeCount: 0,
          generalRevenue: 0,
          totalRevenue: 0
        };
      }

      // Populate Badge Payments into 30-day buckets
      badgePayments.forEach((bp: any) => {
        if (bp.status === 'COMPLETED' || bp.status === 'SUCCESS' || !bp.status) {
          try {
            const rawDate = new Date(bp.createdAt);
            if (!isNaN(rawDate.getTime())) {
              const dateKey = rawDate.toISOString().split('T')[0];
              if (timelineMap[dateKey]) {
                const amount = Number(bp.amount) || 0;
                timelineMap[dateKey].badgeRevenue += amount;
                timelineMap[dateKey].badgeCount += 1;
                timelineMap[dateKey].totalRevenue += amount;
              }
            }
          } catch (e) {
            console.error('Failed to parse badge payment date:', bp.createdAt);
          }
        }
      });

      // Populate General Payment Transactions into 30-day buckets
      (transactions || []).forEach((tx: any) => {
        if (tx.status === 'COMPLETED') {
          try {
            const rawDate = new Date(tx.createdAt);
            if (!isNaN(rawDate.getTime())) {
              const dateKey = rawDate.toISOString().split('T')[0];
              if (timelineMap[dateKey]) {
                const amount = Number(tx.amount) || 0;
                // If it's not already tracked as a badge payment
                const isBadgePurpose = tx.metadata && (tx.metadata as any).purpose === 'VERIFICATION_BADGE';
                if (!isBadgePurpose) {
                  timelineMap[dateKey].generalRevenue += amount;
                  timelineMap[dateKey].totalRevenue += amount;
                }
              }
            }
          } catch (e) {
            console.error('Failed to parse transaction date:', tx.createdAt);
          }
        }
      });

      const chartList = Object.values(timelineMap);
      setData(chartList);

      // Compute 30-day summary metrics
      let totalBadgeRev = 0;
      let totalBadges = 0;
      let peakRev = 0;
      let peakDate = '';

      chartList.forEach((pt) => {
        totalBadgeRev += pt.badgeRevenue;
        totalBadges += pt.badgeCount;
        if (pt.badgeRevenue > peakRev) {
          peakRev = pt.badgeRevenue;
          peakDate = pt.date;
        }
      });

      setSummaryStats({
        total30dBadgeRevenue: totalBadgeRev,
        total30dBadgesSold: totalBadges,
        avgDailyBadgeRevenue: chartList.length > 0 ? totalBadgeRev / chartList.length : 0,
        peakBadgeRevenue: peakRev,
        peakBadgeDate: peakDate || 'N/A'
      });
    } catch (e) {
      console.error('Error loading revenue chart data', e);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint: DailyRevenuePoint = payload[0]?.payload;
      return (
        <div className="bg-slate-950/95 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-md text-white min-w-[200px]">
          <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">{dataPoint.date} ({dataPoint.fullDate})</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Badge Revenue:
              </span>
              <span className="font-black text-white">${dataPoint.badgeRevenue.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-xs text-slate-400">
              <span className="pl-4">Badges Sold:</span>
              <span className="font-bold text-emerald-300">{dataPoint.badgeCount} badge{dataPoint.badgeCount === 1 ? '' : 's'}</span>
            </div>

            {viewMode !== 'badges_only' && (
              <>
                <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/10">
                  <span className="flex items-center gap-1.5 text-sky-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                    Gateway Tx:
                  </span>
                  <span className="font-black text-white">${dataPoint.generalRevenue.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/10 font-black">
                  <span className="text-amber-400">Total Revenue:</span>
                  <span className="text-white">${dataPoint.totalRevenue.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-[420px] bg-slate-900/60 border border-white/10 rounded-3xl p-6 animate-pulse flex flex-col justify-between shadow-xl">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-white/10 w-64 rounded-xl"></div>
          <div className="h-8 bg-white/10 w-48 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-4 gap-4 my-4">
          <div className="h-16 bg-white/5 rounded-2xl"></div>
          <div className="h-16 bg-white/5 rounded-2xl"></div>
          <div className="h-16 bg-white/5 rounded-2xl"></div>
          <div className="h-16 bg-white/5 rounded-2xl"></div>
        </div>
        <div className="h-[200px] bg-white/5 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 shadow-xl space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="text-xl font-black text-white tracking-tight">30-Day Badge Revenue Trends</h3>
          </div>
          <p className="text-xs font-bold text-slate-400 mt-1">
            Visualizing verified badge sales and revenue over the last 30 calendar days
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('badges_only')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              viewMode === 'badges_only'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Badge Revenue
          </button>
          <button
            onClick={() => setViewMode('comparison')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              viewMode === 'comparison'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Breakdown & Total
          </button>
        </div>
      </div>

      {/* 30-Day Summary Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">30D Badge Revenue</p>
          <p className="text-xl font-black text-white mt-1">${summaryStats.total30dBadgeRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">30D Badges Sold</p>
          <p className="text-xl font-black text-white mt-1">{summaryStats.total30dBadgesSold} <span className="text-xs text-slate-400 font-normal">units</span></p>
        </div>
        <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Average</p>
          <p className="text-xl font-black text-white mt-1">${summaryStats.avgDailyBadgeRevenue.toFixed(2)}<span className="text-xs text-slate-400 font-normal">/day</span></p>
        </div>
        <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl">
          <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Peak Day Revenue</p>
          <p className="text-xl font-black text-white mt-1">
            ${summaryStats.peakBadgeRevenue.toFixed(2)}
            {summaryStats.peakBadgeDate !== 'N/A' && (
              <span className="text-[11px] text-amber-300/80 font-bold ml-1.5">({summaryStats.peakBadgeDate})</span>
            )}
          </p>
        </div>
      </div>

      {/* Line Chart */}
      <div className="h-[280px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="badgeRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="totalRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />

            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={11}
              fontWeight="bold"
              tickLine={false}
              axisLine={false}
              dy={8}
              interval={4}
            />

            <YAxis
              stroke="#64748b"
              fontSize={11}
              fontWeight="bold"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />

            <Tooltip content={<CustomTooltip />} />

            {viewMode === 'comparison' && (
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px', fontWeight: 'bold' }}
              />
            )}

            {/* Badge Revenue Area Glow */}
            <Area
              type="monotone"
              dataKey="badgeRevenue"
              fill="url(#badgeRevenueGradient)"
              stroke="none"
            />

            {/* Main Badge Revenue Line */}
            <Line
              type="monotone"
              name="Badge Revenue ($)"
              dataKey="badgeRevenue"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: '#0f172a', stroke: '#10b981', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
              animationDuration={1200}
            />

            {/* In Comparison Mode: Show Total Revenue Line */}
            {viewMode === 'comparison' && (
              <Line
                type="monotone"
                name="Total Platform Revenue ($)"
                dataKey="totalRevenue"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ fill: '#0f172a', stroke: '#f59e0b', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                animationDuration={1200}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
