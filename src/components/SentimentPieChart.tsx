'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { StatsData } from '@/lib/supabase'
import { PieChart as PieIcon } from 'lucide-react'

interface SentimentPieChartProps {
  stats: StatsData
}

export default function SentimentPieChart({ stats }: SentimentPieChartProps) {
  const total = stats.total || 0

  const data = [
    { name: 'Positif', value: stats.positif, color: '#10b981' },
    { name: 'Netral', value: stats.netral, color: '#38bdf8' },
    { name: 'Negatif', value: stats.negatif, color: '#f43f5e' },
  ].filter((d) => d.value > 0)

  if (total === 0 || data.length === 0) {
    return (
      <div className="h-72 flex flex-col items-center justify-center text-slate-500 text-xs">
        <PieIcon className="w-10 h-10 mb-2 opacity-30" />
        <span>Belum ada data sentimen untuk ditampilkan</span>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]
      const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
      return (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 shadow-xl text-xs">
          <div className="font-semibold text-slate-200 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.payload.color }}></span>
            <span>{item.name}</span>
          </div>
          <div className="mt-1 text-slate-400 font-mono">
            {item.value.toLocaleString('id-ID')} aspirasi ({pct}%)
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={4}
            dataKey="value"
            stroke="#0f172a"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => {
              const val = entry.payload.value
              const pct = total > 0 ? ((val / total) * 100).toFixed(0) : 0
              return (
                <span className="text-xs text-slate-300 font-medium ml-1 mr-3">
                  {value} ({pct}%)
                </span>
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
