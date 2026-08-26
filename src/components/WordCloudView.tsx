'use client'

import React, { useState, useMemo } from 'react'
import { PrediksiRecord } from '@/lib/supabase'
import { Cloud, Filter } from 'lucide-react'

interface WordCloudViewProps {
  predictions: PrediksiRecord[]
}

const STOPWORDS_FALLBACK = new Set([
  'yang', 'di', 'dan', 'ini', 'dari', 'untuk', 'pada', 'ke', 'dengan', 'ada',
  'bisa', 'akan', 'juga', 'sudah', 'saya', 'kami', 'kita', 'mereka', 'karena',
  'adalah', 'agar', 'oleh', 'saat', 'atau', 'dalam', 'secara', 'harus', 'bila',
  'jika', 'bagi', 'sampai', 'tentang', 'seperti', 'masih', 'itu', 'dia', 'kamu',
])

export default function WordCloudView({ predictions }: WordCloudViewProps) {
  const [filter, setFilter] = useState<'all' | 'positif' | 'netral' | 'negatif'>('all')

  const wordFrequency = useMemo(() => {
    const filtered = filter === 'all'
      ? predictions
      : predictions.filter((p) => p.sentimen === filter)

    const counts: Record<string, number> = {}

    filtered.forEach((p) => {
      const text = p.teks_bersih || p.teks_asli || ''
      const words = text
        .toLowerCase()
        .replace(/[^\w\s_]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOPWORDS_FALLBACK.has(w))

      words.forEach((w) => {
        counts[w] = (counts[w] || 0) + 1
      })
    })

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 45)

    const maxCount = sorted.length > 0 ? sorted[0][1] : 1

    return sorted.map(([word, count]) => ({
      word,
      count,
      weight: Math.max(0.6, count / maxCount),
    }))
  }, [predictions, filter])

  const getColor = (weight: number, sentFilter: string) => {
    if (sentFilter === 'positif') {
      return weight > 0.7 ? '#10b981' : weight > 0.4 ? '#34d399' : '#6ee7b7'
    }
    if (sentFilter === 'negatif') {
      return weight > 0.7 ? '#f43f5e' : weight > 0.4 ? '#fb7185' : '#fda4af'
    }
    if (sentFilter === 'netral') {
      return weight > 0.7 ? '#38bdf8' : weight > 0.4 ? '#7dd3fc' : '#bae6fd'
    }
    // Mixed
    return weight > 0.7 ? '#60a5fa' : weight > 0.4 ? '#818cf8' : '#cbd5e1'
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Cloud className="w-4 h-4 text-indigo-400" />
          <span>Frekuensi Kata Dominan</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {(['all', 'positif', 'netral', 'negatif'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filter === f
                  ? f === 'positif'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : f === 'negatif'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : f === 'netral'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f === 'all' ? 'Semua' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Cloud Display */}
      {wordFrequency.length === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center text-slate-500 text-xs">
          <span>Tidak ada kata yang cukup untuk ditampilkan</span>
        </div>
      ) : (
        <div className="min-h-56 p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-wrap items-center justify-center gap-3 select-none">
          {wordFrequency.map((item, idx) => {
            const fontSize = Math.round(12 + item.weight * 22)
            const color = getColor(item.weight, filter)
            return (
              <span
                key={idx}
                className="transition-all duration-200 hover:scale-125 hover:z-10 cursor-pointer font-medium"
                style={{
                  fontSize: `${fontSize}px`,
                  color,
                  opacity: Math.max(0.65, item.weight),
                }}
                title={`${item.word}: muncul ${item.count} kali`}
              >
                #{item.word}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
