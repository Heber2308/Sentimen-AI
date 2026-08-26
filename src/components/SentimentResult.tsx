'use client'

import React, { useState } from 'react'
import { Sparkles, ThumbsUp, MinusCircle, ThumbsDown, Copy, Check, Tag, FileText, BarChart2 } from 'lucide-react'

export interface SentimentResultData {
  sentimen: 'positif' | 'netral' | 'negatif'
  probabilitas: {
    positif: number
    netral: number
    negatif: number
  }
  kata_kunci: string[]
  teks_bersih: string
}

interface SentimentResultProps {
  result: SentimentResultData
  rawText: string
}

export default function SentimentResult({ result, rawText }: SentimentResultProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const textToCopy = `Ringkasan Aspirasi Kampus:\nKategori: ${result.sentimen.toUpperCase()}\nTingkat keyakinan: Positif ${result.probabilitas.positif}%, Netral ${result.probabilitas.netral}%, Negatif ${result.probabilitas.negatif}%\nTopik terkait: ${result.kata_kunci.join(', ')}\nIsi aspirasi: "${rawText}"`
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sentimentConfig = {
    positif: {
      title: 'Sentimen Positif',
      subtitle: 'Aspirasi menunjukkan kepuasan, apresiasi, atau masukan yang membangun.',
      icon: ThumbsUp,
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-glow-positif',
      borderClass: 'border-emerald-500/40',
      bgGlow: 'from-emerald-500/10 via-transparent to-transparent',
      barColor: 'bg-emerald-500',
    },
    netral: {
      title: 'Sentimen Netral',
      subtitle: 'Aspirasi bersifat informatif atau belum menunjukkan kecenderungan emosi tertentu.',
      icon: MinusCircle,
      badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30 shadow-glow-netral',
      borderClass: 'border-sky-500/40',
      bgGlow: 'from-sky-500/10 via-transparent to-transparent',
      barColor: 'bg-sky-500',
    },
    negatif: {
      title: 'Sentimen Negatif',
      subtitle: 'Aspirasi memuat keluhan, ketidakpuasan, atau kritik terhadap layanan kampus.',
      icon: ThumbsDown,
      badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-glow-negatif',
      borderClass: 'border-rose-500/40',
      bgGlow: 'from-rose-500/10 via-transparent to-transparent',
      barColor: 'bg-rose-500',
    },
  }[result.sentimen] || {
    title: 'Analisis Selesai',
    subtitle: '',
    icon: Sparkles,
    badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    borderClass: 'border-blue-500/40',
    bgGlow: 'from-blue-500/10 via-transparent to-transparent',
    barColor: 'bg-blue-500',
  }

  const Icon = sentimentConfig.icon

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-slate-900/80 backdrop-blur-xl border ${sentimentConfig.borderClass} p-6 sm:p-8 shadow-2xl transition-all duration-300`}>
      {/* Background Glow */}
      <div className={`absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br ${sentimentConfig.bgGlow} rounded-full blur-3xl pointer-events-none`}></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${sentimentConfig.badgeClass}`}>
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${sentimentConfig.badgeClass}`}>
                {sentimentConfig.title}
              </span>
              <span className="text-xs text-slate-400 font-mono">Tercatat di arsip kampus</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              {sentimentConfig.subtitle}
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="self-start sm:self-center flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-all shadow-sm"
          title="Salin ringkasan aspirasi"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Tersalin!' : 'Salin Hasil'}</span>
        </button>
      </div>

      {/* Probability Bars */}
      <div className="my-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
          <BarChart2 className="w-4 h-4 text-blue-400" />
          <span>Tingkat keyakinan sistem</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Positif */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-medium mb-2">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5" /> Positif
              </span>
              <span className="font-mono text-emerald-300 font-bold">{result.probabilitas.positif}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${result.probabilitas.positif}%` }}
              ></div>
            </div>
          </div>

          {/* Netral */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-medium mb-2">
              <span className="text-sky-400 flex items-center gap-1.5">
                <MinusCircle className="w-3.5 h-3.5" /> Netral
              </span>
              <span className="font-mono text-sky-300 font-bold">{result.probabilitas.netral}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${result.probabilitas.netral}%` }}
              ></div>
            </div>
          </div>

          {/* Negatif */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-medium mb-2">
              <span className="text-rose-400 flex items-center gap-1.5">
                <ThumbsDown className="w-3.5 h-3.5" /> Negatif
              </span>
              <span className="font-mono text-rose-300 font-bold">{result.probabilitas.negatif}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${result.probabilitas.negatif}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Keywords & Preprocessed Text */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
        {/* Keywords */}
        <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/60">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            <Tag className="w-3.5 h-3.5 text-blue-400" />
            <span>Topik yang teridentifikasi</span>
          </div>
          {result.kata_kunci && result.kata_kunci.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {result.kata_kunci.map((kw, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-blue-950/50 border border-blue-800/50 text-blue-300 text-xs font-medium"
                >
                  #{kw}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Tidak ada kata kunci khusus</p>
          )}
        </div>

        {/* Cleaned Text */}
        <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/60">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Versi teks yang diproses sistem</span>
          </div>
          <p className="text-xs text-slate-300 font-mono line-clamp-3 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
            {result.teks_bersih || rawText}
          </p>
        </div>
      </div>
    </div>
  )
}
