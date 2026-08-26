'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Sparkles, MessageSquare, Layers, Activity, ArrowRight } from 'lucide-react'
import StatsCard from '@/components/StatsCard'
import SentimentForm from '@/components/SentimentForm'
import BatchUpload from '@/components/BatchUpload'
import { supabase, getStats, StatsData, PrediksiRecord, getPredictions } from '@/lib/supabase'
import { formatRelativeWIB } from '@/lib/utils'
import Link from 'next/link'

export default function HomePage() {
  const [stats, setStats] = useState<StatsData>({ total: 0, positif: 0, netral: 0, negatif: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single')
  const [recentList, setRecentList] = useState<PrediksiRecord[]>([])
  const [, setTick] = useState(0)

  // Fetch initial stats & recent data
  const fetchData = useCallback(async () => {
    try {
      const [statsRes, predRes] = await Promise.all([
        getStats(),
        getPredictions(5, 1),
      ])
      setStats(statsRes)
      setRecentList(predRes.data)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()

    // Realtime subscription via Supabase WebSocket
    const channel = supabase
      .channel('home_realtime_prediksi')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prediksi' },
        () => {
          fetchData()
        }
      )
      .subscribe()

    // Timer interval untuk memperbarui waktu relatif setiap detik
    const timer = setInterval(() => {
      setTick((t) => t + 1)
    }, 1000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(timer)
    }
  }, [fetchData])

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-md shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Portal aspirasi resmi kampus</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400">Terhubung secara langsung</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
          Dengarkan suara kampus, wujudkan perubahan{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            Kecerdasan Buatan
          </span>
        </h1>

        <p className="mt-4 sm:mt-6 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Sampaikan pengalaman, apresiasi, atau masukan Anda. Sistem ini membantu kampus membaca pola aspirasi sivitas akademika secara cepat, terukur, dan transparan.
        </p>

        {/* Quick Stats Banner */}
        <div className="mt-10">
          <StatsCard stats={stats} loading={statsLoading} />
        </div>
      </section>

      {/* Main Analysis Interface with Tabs */}
      <section className="max-w-4xl mx-auto space-y-6">
        {/* Tab Switcher */}
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-lg">
            <button
              onClick={() => setActiveTab('single')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'single'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Kirim Aspirasi</span>
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'batch'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Impor Data Aspirasi</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'single' ? (
          <SentimentForm onPredictionSuccess={fetchData} />
        ) : (
          <BatchUpload onBatchComplete={fetchData} />
        )}
      </section>

      {/* Realtime Recent Activity Feed */}
      <section className="max-w-4xl mx-auto">
        <div className="rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Aspirasi Terbaru
              </h3>
            </div>

            <Link
              href="/riwayat"
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>Buka Arsip Aspirasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentList.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-6">
              Belum ada aspirasi yang tercatat pada periode ini.
            </p>
          ) : (
            <div className="space-y-3">
              {recentList.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60 hover:border-slate-700/80 transition-all text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 line-clamp-1 font-medium">"{item.teks_asli}"</p>
                    <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-1 font-mono">
                      <span>ID: #{item.id}</span>
                      <span>•</span>
                      <span className="text-slate-400">{formatRelativeWIB(item.waktu)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        item.sentimen === 'positif'
                          ? 'badge-positif'
                          : item.sentimen === 'negatif'
                          ? 'badge-negatif'
                          : 'badge-netral'
                      }`}
                    >
                      {item.sentimen}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {item.sentimen === 'positif'
                        ? `${item.prob_positif}%`
                        : item.sentimen === 'negatif'
                        ? `${item.prob_negatif}%`
                        : `${item.prob_netral}%`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
