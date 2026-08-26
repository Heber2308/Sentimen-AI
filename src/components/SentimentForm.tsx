'use client'

import React, { useState } from 'react'
import { Sparkles, Send, RefreshCw, MessageSquarePlus } from 'lucide-react'
import confetti from 'canvas-confetti'
import SentimentResult, { SentimentResultData } from './SentimentResult'

const SAMPLES = [
  'Pelayanan di perpustakaan sangat ramah, fasilitas AC dingin dan suasana belajar sangat nyaman!',
  'Server sistem portal KRS lambat sekali dan sering error saat mahasiswa mau input mata kuliah.',
  'Informasi pengumuman jadwal seminar sudah dibagikan melalui grup kelas oleh perwakilan prodi.',
  'Kantin kampus makanannya enak dan harganya sangat terjangkau untuk mahasiswa.',
]

interface SentimentFormProps {
  onPredictionSuccess?: () => void
}

export default function SentimentForm({ onPredictionSuccess }: SentimentFormProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SentimentResultData | null>(null)
  const [submittedText, setSubmittedText] = useState('')

  const handlePredict = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) {
      setError('Silakan tuliskan aspirasi atau pengalaman Anda terlebih dahulu.')
      return
    }
    if (trimmed.length < 5) {
      setError('Aspirasi memerlukan sedikitnya 5 karakter agar dapat diproses.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teks: trimmed }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Aspirasi belum dapat dianalisis.')
      }

      setResult(data)
      setSubmittedText(trimmed)

      // Trigger Confetti if Positif
      if (data.sentimen === 'positif') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#3b82f6'],
        })
      }

      if (onPredictionSuccess) {
        onPredictionSuccess()
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menghubungi server.')
    } finally {
      setLoading(false)
    }
  }

  const handleSampleClick = (sample: string) => {
    setText(sample)
    setError(null)
  }

  const handleReset = () => {
    setText('')
    setResult(null)
    setError(null)
  }

  return (
    <div className="space-y-6">
      {/* Form Input Card */}
      <div className="rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Kirim Aspirasi
              </h2>
              <p className="text-xs text-slate-400">
                Ceritakan pengalaman Anda secara singkat dan jelas
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            <span className={text.length > 1500 ? 'text-rose-400 font-bold' : text.length > 1000 ? 'text-amber-400' : 'text-slate-400'}>
              {text.length}
            </span>
            {' / 2000'}
          </div>
        </div>

        <form onSubmit={handlePredict} className="space-y-4">
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value.slice(0, 2000))
                if (error) setError(null)
              }}
              rows={4}
              placeholder="Contoh: Fasilitas Wi-Fi di gedung baru sangat cepat dan stabil untuk mendukung kegiatan belajar..."
              className="w-full rounded-2xl bg-slate-950/80 border border-slate-700/80 p-4 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none shadow-inner"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              <span>{error}</span>
            </div>
          )}

          {/* Sample Chips */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Pilih contoh aspirasi:
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLES.map((sample, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSampleClick(sample)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs transition-colors line-clamp-1 max-w-xs text-left"
                >
                  "{sample.slice(0, 45)}..."
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={loading || (!text && !result)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Bersihkan</span>
            </button>

            <button
              type="submit"
              disabled={loading || text.trim().length < 5}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Memproses aspirasi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>Kirim & Analisis</span>
                  <Send className="w-3.5 h-3.5 opacity-70" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Result Section */}
      {result && <SentimentResult result={result} rawText={submittedText} />}
    </div>
  )
}
