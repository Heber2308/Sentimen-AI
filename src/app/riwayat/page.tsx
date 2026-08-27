'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { History, Search, Download, Calendar, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { supabase, getPredictions, PrediksiRecord, getCurrentMonthRange } from '@/lib/supabase'
import { formatWIBDate, formatRelativeWIB, exportToCSV } from '@/lib/utils'

export default function RiwayatPage() {
  const [period, setPeriod] = useState<'current_month' | 'all'>('current_month')
  const [predictions, setPredictions] = useState<PrediksiRecord[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'positif' | 'netral' | 'negatif'>('all')
  const [page, setPage] = useState(1)
  const [selectedRecord, setSelectedRecord] = useState<PrediksiRecord | null>(null)
  const [, setTick] = useState(0)
  const pageSize = 20

  const { labelBulan } = getCurrentMonthRange()

  const loadPredictions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getPredictions(pageSize, page, search, filter, period)
      setPredictions(res.data)
      setTotalCount(res.total)
    } finally {
      setLoading(false)
    }
  }, [page, search, filter, period])

  useEffect(() => {
    loadPredictions()

    // Realtime Supabase Subscription
    const channel = supabase
      .channel('riwayat_table_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prediksi' },
        () => {
          loadPredictions()
        }
      )
      .subscribe()

    // Timer interval for live relative times
    const timer = setInterval(() => {
      setTick((t) => t + 1)
    }, 1000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(timer)
    }
  }, [loadPredictions])

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  const handleExportCSV = async () => {
    // Ambil data untuk diunduh (sampai 1000 baris)
    const res = await getPredictions(1000, 1, search, filter, period)
    const exportData = res.data.map((p) => ({
      ID: p.id,
      'Teks Asli': p.teks_asli,
      'Teks Bersih': p.teks_bersih || '',
      Sentimen: p.sentimen.toUpperCase(),
      'Prob Positif (%)': p.prob_positif,
      'Prob Netral (%)': p.prob_netral,
      'Prob Negatif (%)': p.prob_negatif,
      'Kata Kunci': p.kata_kunci || '',
      Waktu: formatWIBDate(p.waktu),
    }))

    exportToCSV(`riwayat_sentimen_${Date.now()}`, exportData)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <History className="w-4 h-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Arsip Aspirasi Kampus
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Telusuri aspirasi yang telah tercatat, lengkap dengan kategori dan waktu penyampaiannya.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Selector Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => {
                setPeriod('current_month')
                setPage(1)
              }}
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
              onClick={() => {
                setPeriod('all')
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                period === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Seluruh Arsip
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold shadow-md transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Unduh CSV ({totalCount.toLocaleString('id-ID')})</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-800 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Cari isi aspirasi..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Sentiment Filter */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {(['all', 'positif', 'netral', 'negatif'] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f)
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === f
                  ? f === 'positif'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : f === 'negatif'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : f === 'netral'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              {f === 'all' ? 'Semua Kategori' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4 w-12 text-center">ID</th>
                <th className="p-4">Isi Aspirasi</th>
                <th className="p-4 w-32 text-center">Sentimen</th>
                <th className="p-4 w-36 text-center">Probabilitas</th>
                <th className="p-4 w-44 text-right">Waktu (WIB)</th>
                <th className="p-4 w-16 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Memuat arsip aspirasi...</span>
                    </div>
                  </td>
                </tr>
              ) : predictions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 italic">
                    Belum ada aspirasi untuk periode ini ({period === 'current_month' ? labelBulan : 'Seluruh Periode'}).
                  </td>
                </tr>
              ) : (
                predictions.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedRecord(item)}
                  >
                    <td className="p-4 text-center text-slate-500 font-mono">#{item.id}</td>
                    <td className="p-4 text-slate-200 font-medium max-w-md">
                      <p className="line-clamp-2 leading-relaxed">"{item.teks_asli}"</p>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          item.sentimen === 'positif'
                            ? 'badge-positif'
                            : item.sentimen === 'negatif'
                            ? 'badge-negatif'
                            : 'badge-netral'
                        }`}
                      >
                        {item.sentimen}
                      </span>
                    </td>
                    <td className="p-4 text-center font-mono text-[11px]">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-emerald-400" title="Positif">{item.prob_positif}%</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-sky-400" title="Netral">{item.prob_netral}%</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-rose-400" title="Negatif">{item.prob_negatif}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-mono text-slate-300 font-medium">{formatRelativeWIB(item.waktu)}</div>
                      <div className="text-[10px] text-slate-500">{formatWIBDate(item.waktu)}</div>
                    </td>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedRecord(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Lihat Rincian"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Menampilkan halaman <strong className="text-slate-200">{page}</strong> dari{' '}
            <strong className="text-slate-200">{totalPages}</strong> (Total {totalCount.toLocaleString('id-ID')} data)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Detail */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-4">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  selectedRecord.sentimen === 'positif'
                    ? 'badge-positif'
                    : selectedRecord.sentimen === 'negatif'
                    ? 'badge-negatif'
                    : 'badge-netral'
                }`}
              >
                {selectedRecord.sentimen}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {formatWIBDate(selectedRecord.waktu)}
              </span>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Isi Aspirasi
              </div>
              <p className="text-sm text-slate-200 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 leading-relaxed font-mono">
                "{selectedRecord.teks_asli}"
              </p>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Tingkat Keyakinan Sistem
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300">
                  <div>Positif</div>
                  <div className="font-bold text-sm">{selectedRecord.prob_positif}%</div>
                </div>
                <div className="p-2 rounded-xl bg-sky-950/40 border border-sky-800/40 text-sky-300">
                  <div>Netral</div>
                  <div className="font-bold text-sm">{selectedRecord.prob_netral}%</div>
                </div>
                <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300">
                  <div>Negatif</div>
                  <div className="font-bold text-sm">{selectedRecord.prob_negatif}%</div>
                </div>
              </div>
            </div>

            {selectedRecord.kata_kunci && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Kata Kunci
                </div>
                <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  {selectedRecord.kata_kunci}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
