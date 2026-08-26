'use client'

import React from 'react'
import { MessageSquare, ThumbsUp, MinusCircle, ThumbsDown, TrendingUp } from 'lucide-react'
import { StatsData } from '@/lib/supabase'

interface StatsCardProps {
  stats: StatsData
  loading?: boolean
}

export default function StatsCard({ stats, loading }: StatsCardProps) {
  const total = stats.total || 0
  const pctPositif = total > 0 ? ((stats.positif / total) * 100).toFixed(1) : '0'
  const pctNetral = total > 0 ? ((stats.netral / total) * 100).toFixed(1) : '0'
  const pctNegatif = total > 0 ? ((stats.negatif / total) * 100).toFixed(1) : '0'

  const cards = [
    {
      label: 'Total Aspirasi',
      value: stats.total,
      pct: '100%',
      icon: MessageSquare,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      glow: 'group-hover:border-blue-500/50 group-hover:shadow-glow',
    },
    {
      label: 'Sentimen Positif',
      value: stats.positif,
      pct: `${pctPositif}%`,
      icon: ThumbsUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      glow: 'group-hover:border-emerald-500/50 group-hover:shadow-glow-positif',
    },
    {
      label: 'Sentimen Netral',
      value: stats.netral,
      pct: `${pctNetral}%`,
      icon: MinusCircle,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/20',
      glow: 'group-hover:border-sky-500/50 group-hover:shadow-glow-netral',
    },
    {
      label: 'Sentimen Negatif',
      value: stats.negatif,
      pct: `${pctNegatif}%`,
      icon: ThumbsDown,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      glow: 'group-hover:border-rose-500/50 group-hover:shadow-glow-negatif',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon
        return (
          <div
            key={idx}
            className={`group relative overflow-hidden rounded-2xl bg-slate-900/60 backdrop-blur-md p-4 sm:p-5 border transition-all duration-300 ${card.borderColor} ${card.glow}`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs sm:text-sm font-medium text-slate-400">{card.label}</span>
              <div className={`w-8 h-8 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
                {loading ? (
                  <div className="h-8 w-16 bg-slate-800 animate-pulse rounded"></div>
                ) : (
                  card.value.toLocaleString('id-ID')
                )}
              </div>
              <div className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50">
                {card.pct}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
