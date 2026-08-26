'use client'

import React, { useState, useRef } from 'react'
import Papa from 'papaparse'
import { UploadCloud, FileSpreadsheet, CheckCircle2, Download, AlertCircle, RefreshCw, Layers } from 'lucide-react'
import { exportToCSV } from '@/lib/utils'

interface BatchItem {
  teks: string
  sentimen?: 'positif' | 'netral' | 'negatif'
  prob_positif?: number
  prob_netral?: number
  prob_negatif?: number
  kata_kunci?: string[]
}

interface BatchUploadProps {
  onBatchComplete?: () => void
}

export default function BatchUpload({ onBatchComplete }: BatchUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<BatchItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
          setError('Silakan pilih file berformat CSV.')
      return
    }

    setError(null)
    setFile(selectedFile)
    setParsing(true)

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setParsing(false)
        if (result.data.length === 0) {
          setError('File CSV kosong atau format kolom belum sesuai.')
          return
        }

        // Cari nama kolom yang berisi teks
        const firstRow = result.data[0] as Record<string, any>
        const possibleCols = ['teks', 'aspirasi', 'text', 'kalimat', 'pesan', 'komentar', 'review', 'ulasan']
        let textCol = Object.keys(firstRow).find((k) =>
          possibleCols.includes(k.toLowerCase().trim())
        )

        if (!textCol) {
          textCol = Object.keys(firstRow)[0]
        }

        const items: BatchItem[] = (result.data as Record<string, any>[])
          .map((row) => ({
            teks: String(row[textCol!] || '').trim(),
          }))
          .filter((i) => i.teks.length >= 5)

        if (items.length === 0) {
          setError(`Belum ditemukan kolom aspirasi yang valid atau seluruh teks terlalu singkat. (Kolom terbaca: ${textCol})`)
          return
        }

        setResults(items)
      },
      error: (err) => {
        setParsing(false)
          setError(`File CSV belum dapat dibaca: ${err.message}`)
      },
    })
  }

  const handleProcessBatch = async () => {
    if (results.length === 0) return
    setProcessing(true)
    setProgress(0)

    const updated = [...results]
    const batchSize = 10
    const total = results.length

    for (let i = 0; i < total; i += batchSize) {
      const chunk = updated.slice(i, i + batchSize)
      await Promise.all(
        chunk.map(async (item, idx) => {
          try {
            const res = await fetch('/api/predict', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ teks: item.teks }),
            })
            const data = await res.json()
            if (res.ok && data.sentimen) {
              const actualIdx = i + idx
              updated[actualIdx] = {
                ...item,
                sentimen: data.sentimen,
                prob_positif: data.probabilitas?.positif || 0,
                prob_netral: data.probabilitas?.netral || 0,
                prob_negatif: data.probabilitas?.negatif || 0,
                kata_kunci: data.kata_kunci || [],
              }
            }
          } catch (e) {
            console.error('Batch item error:', e)
          }
        })
      )

      setProgress(Math.min(100, Math.round(((i + batchSize) / total) * 100)))
    }

    setResults(updated)
    setProcessing(false)

    if (onBatchComplete) {
      onBatchComplete()
    }
  }

  const handleDownloadResults = () => {
    const exportData = results.map((r) => ({
      Teks: r.teks,
      Sentimen: (r.sentimen || 'Belum dianalisis').toUpperCase(),
      'Positif (%)': r.prob_positif || 0,
      'Netral (%)': r.prob_netral || 0,
      'Negatif (%)': r.prob_negatif || 0,
      'Kata Kunci': (r.kata_kunci || []).join('; '),
    }))

    exportToCSV(`hasil_analisis_batch_${Date.now()}`, exportData)
  }

  const handleReset = () => {
    setFile(null)
    setResults([])
    setProgress(0)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const processedCount = results.filter((r) => r.sentimen).length
  const isAllProcessed = results.length > 0 && processedCount === results.length

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Impor Aspirasi dalam Jumlah Besar
              </h2>
              <p className="text-xs text-slate-400">
                Tinjau banyak aspirasi sekaligus dari satu file CSV
              </p>
            </div>
          </div>
        </div>

        {/* Dropzone */}
        {!file && (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragOver(false)
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFile(e.dataTransfer.files[0])
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              isDragOver
                ? 'border-blue-400 bg-blue-500/10 scale-[1.01]'
                : 'border-slate-700 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-950/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0])
                }
              }}
            />
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30 mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-200">
              Tarik file CSV ke sini, atau <span className="text-blue-400">Pilih dari perangkat</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan header kolom <code className="text-slate-400 font-mono">teks</code>, <code className="text-slate-400 font-mono">aspirasi</code>, atau <code className="text-slate-400 font-mono">pesan</code>
            </p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loaded File Info & Process Button */}
        {file && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-200">{file.name}</div>
                  <div className="text-xs text-slate-400">
                    {results.length.toLocaleString('id-ID')} aspirasi valid ditemukan
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  disabled={processing}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  Pilih File Lain
                </button>

                {!isAllProcessed && (
                  <button
                    onClick={handleProcessBatch}
                    disabled={processing}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                  >
                    {processing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Memproses ({progress}%)</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Proses Semua Aspirasi</span>
                      </>
                    )}
                  </button>
                )}

                {isAllProcessed && (
                  <button
                    onClick={handleDownloadResults}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Hasil (.CSV)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {processing && (
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                <div className="flex justify-between text-xs text-slate-300 mb-2 font-mono">
                  <span>Memproses kumpulan aspirasi...</span>
                  <span className="text-blue-400 font-bold">{progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Table Preview */}
            <div className="rounded-2xl border border-slate-800 overflow-hidden">
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3 w-12 text-center">#</th>
                      <th className="p-3">Isi Aspirasi</th>
                      <th className="p-3 w-32 text-center">Sentimen</th>
                      <th className="p-3 w-40 text-right">Probabilitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {results.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                        <td className="p-3 text-slate-300 line-clamp-2 max-w-md">{row.teks}</td>
                        <td className="p-3 text-center">
                          {row.sentimen ? (
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                row.sentimen === 'positif'
                                  ? 'badge-positif'
                                  : row.sentimen === 'negatif'
                                  ? 'badge-negatif'
                                  : 'badge-netral'
                              }`}
                            >
                              {row.sentimen}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Menunggu proses</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-400">
                          {row.sentimen ? (
                            <span>
                              {row.sentimen === 'positif'
                                ? `${row.prob_positif}%`
                                : row.sentimen === 'negatif'
                                ? `${row.prob_negatif}%`
                                : `${row.prob_netral}%`}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {results.length > 50 && (
                <div className="p-2.5 text-center text-xs text-slate-500 bg-slate-950/80 border-t border-slate-800">
                  Menampilkan 50 dari {results.length.toLocaleString('id-ID')} aspirasi
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
