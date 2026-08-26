'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard,
  PieChart as PieIcon,
  TrendingUp,
  Cloud,
  RefreshCw,
  Calendar,
  Trash2,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react'
import StatsCard from '@/components/StatsCard'
import SentimentPieChart from '@/components/SentimentPieChart'
import SentimentTrendChart from '@/components/SentimentTrendChart'
import WordCloudView from '@/components/WordCloudView'
import {
  supabase,
  getStats,
  getTrendData,
  getPredictions,
  clearAllPredictions,
  resetPreviousMonthsData,
  StatsData,
  TrendData,
  PrediksiRecord,
  getCurrentMonthRange,
} from '@/lib/supabase'

export default function DashboardPage() {
  const [period, setPeriod] = useState<'current_month' | 'all'>('current_month')
  const [stats, setStats] = useState<StatsData>({ total: 0, positif: 0, netral: 0, negatif: 0 })
  const [trend, setTrend] = useState<TrendData>({ labels: [], positif: [], netral: [], negatif: [] })
  const [predictions, setPredictions] = useState<PrediksiRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetting, setResetting] = useState(false)

  const { labelBulan } = getCurrentMonthRange()

  const loadData = useCallback(async () => {
    try {
      const [statsRes, trendRes, predRes] = await Promise.all([
        getStats(period),
        getTrendData(period),
        getPredictions(300, 1, '', '', period),
      ])
      setStats(statsRes)
      setTrend(trendRes)
      setPredictions(predRes.data)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [period])

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

  const handleResetData = async (mode: 'previous' | 'all') => {
    setResetting(true)
    try {
      if (mode === 'previous') {
        await resetPreviousMonthsData()
      } else {
        await clearAllPredictions()
      }
      setShowResetModal(false)
      loadData()
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ringkasan Aspirasi Kampus
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pantau kecenderungan aspirasi sivitas akademika dan temukan prioritas perbaikan layanan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Selector Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setPeriod('current_month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                period === 'current_month'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Periode {labelBulan}</span>
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                period === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Seluruh Periode
            </button>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-all disabled:opacity-50"
            title="Perbarui ringkasan"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          <button
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all"
            title="Kelola data arsip"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Kelola Data</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCard stats={stats} loading={loading} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart Card */}
        <div className="rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-slate-800 p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Komposisi Kategori Aspirasi
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {period === 'current_month' ? labelBulan : 'Semua Waktu'}
            </span>
          </div>
          <SentimentPieChart stats={stats} />
        </div>

        {/* Trend Area Chart Card */}
        <div className="rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-slate-800 p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Perubahan Aspirasi dari Waktu ke Waktu
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {period === 'current_month' ? labelBulan : 'Semua Waktu'}
            </span>
          </div>
          <SentimentTrendChart trend={trend} />
        </div>
      </div>

      {/* Word Cloud Section */}
      <div className="rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 shadow-xl">
        <WordCloudView predictions={predictions} />
      </div>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setShowResetModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Kelola Data Arsip</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Pilih data yang ingin dihapus dari arsip. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleResetData('previous')}
                disabled={resetting}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Hapus Arsip Periode Sebelumnya
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Hanya menghapus data sebelum periode {labelBulan}
                  </div>
                </div>
                <Check className="w-4 h-4 text-blue-400" />
              </button>

              <button
                onClick={() => handleResetData('all')}
                disabled={resetting}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/50 text-left transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-rose-300">
                    Hapus Seluruh Arsip
                  </div>
                  <div className="text-[11px] text-rose-400/70">
                    Mengosongkan seluruh arsip dan ringkasan
                  </div>
                </div>
                <Trash2 className="w-4 h-4 text-rose-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
