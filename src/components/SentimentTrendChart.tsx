'use client'

import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { TrendData } from '@/lib/supabase'
import { TrendingUp } from 'lucide-react'

interface SentimentTrendChartProps {
  trend: TrendData
}

export default function SentimentTrendChart({ trend }: SentimentTrendChartProps) {
  if (!trend.labels || trend.labels.length === 0) {
    return (
      <div className="h-72 flex flex-col items-center justify-center text-slate-500 text-xs">
        <TrendingUp className="w-10 h-10 mb-2 opacity-30" />
        <span>Belum ada data tren waktu</span>
      </div>
    )
  }

  const chartData = trend.labels.map((label, idx) => ({
    name: label,
    Positif: trend.positif[idx] || 0,
    Netral: trend.netral[idx] || 0,
    Negatif: trend.negatif[idx] || 0,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 shadow-xl text-xs space-y-1">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 mb-1">
            Tanggal: {label}
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                {entry.name}:
              </span>
              <span className="font-mono font-semibold text-slate-200">
                {entry.value} aspirasi
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradPositif" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="gradNetral" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="gradNegatif" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="bottom" height={36} />
          <Area
            type="monotone"
            dataKey="Positif"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#gradPositif)"
          />
          <Area
            type="monotone"
            dataKey="Netral"
            stroke="#38bdf8"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#gradNetral)"
          />
          <Area
            type="monotone"
            dataKey="Negatif"
            stroke="#f43f5e"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#gradNegatif)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
