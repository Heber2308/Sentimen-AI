'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { LayoutDashboard, PieChart as PieIcon, TrendingUp, Cloud, Sparkles, RefreshCw, BarChart3 } from 'lucide-react'
import StatsCard from '@/components/StatsCard'
import SentimentPieChart from '@/components/SentimentPieChart'
import SentimentTrendChart from '@/components/SentimentTrendChart'
import WordCloudView from '@/components/WordCloudView'
import { supabase, getStats, getTrendData, getPredictions, StatsData, TrendData, PrediksiRecord } from '@/lib/supabase'

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData>({ total: 0, positif: 0, netral: 0, negatif: 0 })
  const [trend, setTrend] = useState<TrendData>({ labels: [], positif: [], netral: [], negatif: [] })
  const [predictions, setPredictions] = useState<PrediksiRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [statsRes, trendRes, predRes] = await Promise.all([
        getStats(),
        getTrendData(),
        getPredictions(300, 1),
      ])
      setStats(statsRes)
      setTrend(trendRes)
      setPredictions(predRes.data)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()

    // Realtime Supabase Subscription
    const channel = supabase
      .channel('dashboard_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prediksi' },
        () => {
          loadData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadData])

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    loadData()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Dashboard Analisis Realtime
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Visualisasi data statistik, distribusi probabilitas, dan tren sentimen secara live
          </p>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="self-start sm:self-center flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          <span>{isRefreshing ? 'Memperbarui...' : 'Sinkronkan Data'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <StatsCard stats={stats} loading={loading} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart Card */}
        <div className="rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-slate-800 p-6 shadow-xl">
          <div className="flex items-center gap-2 pb-4 mb-2 border-b border-slate-800/80">
            <PieIcon className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Distribusi Persentase Sentimen
            </h2>
          </div>
          <SentimentPieChart stats={stats} />
        </div>

        {/* Trend Area Chart Card */}
        <div className="rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-slate-800 p-6 shadow-xl">
          <div className="flex items-center gap-2 pb-4 mb-2 border-b border-slate-800/80">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Tren Perkembangan Aspirasi Harian
            </h2>
          </div>
          <SentimentTrendChart trend={trend} />
        </div>
      </div>

      {/* Word Cloud Section */}
      <div className="rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 shadow-xl">
        <WordCloudView predictions={predictions} />
      </div>
    </div>
  )
}
