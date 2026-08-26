import React from 'react'
import { BookOpen, CheckCircle, Cpu, FileCheck, Layers, Award, Terminal, Activity } from 'lucide-react'

export default function MetodePage() {
  const metrics = [
    { label: 'Akurasi Model', value: '86.89%', desc: 'Rasio prediksi benar dari seluruh data uji', color: 'text-emerald-400', border: 'border-emerald-500/30' },
    { label: 'Precision', value: '86.89%', desc: 'Tingkat ketepatan klasifikasi sentimen positif & negatif', color: 'text-blue-400', border: 'border-blue-500/30' },
    { label: 'Recall', value: '86.89%', desc: 'Sensitivitas model dalam mengenali seluruh pola aspirasi', color: 'text-indigo-400', border: 'border-indigo-500/30' },
    { label: 'F1-Score', value: '86.89%', desc: 'Harmonic mean antara precision dan recall', color: 'text-amber-400', border: 'border-amber-500/30' },
  ]

  const pipelineSteps = [
    { step: 1, title: 'Case Folding & Cleaning', desc: 'Mengubah semua karakter menjadi huruf kecil, menghapus URL, mention @, hashtag #, angka, dan tanda baca.' },
    { step: 2, title: 'Tokenisasi & Normalisasi', desc: 'Memisahkan kalimat menjadi kata per kata, dan mengubah kata slang (gak -> tidak, bgt -> banget, ukt -> uang kuliah tunggal).' },
    { step: 3, title: 'Stopword Removal', desc: 'Menghapus kata-kata penghubung umum bahasa Indonesia dengan tetap mempertahankan kata sentimen penting (tidak, sangat, bersih, rusak).' },
    { step: 4, title: 'Stemming Sastrawi', desc: 'Mengubah kata berimbuhan menjadi bentuk kata dasar menggunakan algoritma Nazief-Adriani melalui library Sastrawi.' },
    { step: 5, title: 'TF-IDF Feature Extraction', desc: 'Memberikan bobot numerik pada setiap kata dan frasa n-gram (1-2 gram) berdasarkan frekuensi kemunculannya.' },
    { step: 6, title: 'Linear SVM Classifier', desc: 'Menentukan bidang pemisah optimal (hyperplane) dengan margin maksimum untuk klasifikasi multi-kelas (Positif, Netral, Negatif).' },
  ]

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
          <Award className="w-3.5 h-3.5" />
          <span>Evaluasi Performa & Metodologi Model</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Metode Machine Learning & NLP Pipeline
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Penjelasan arsitektur sistem klasifikasi teks berbasis <em>Support Vector Machine (Linear SVM)</em> dengan pembobotan <em>TF-IDF</em> untuk bahasa Indonesia.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className={`p-5 rounded-3xl bg-slate-900/70 backdrop-blur-xl border ${m.border} shadow-lg`}
          >
            <div className="text-xs font-semibold text-slate-400 mb-1">{m.label}</div>
            <div className={`text-3xl font-extrabold font-mono ${m.color} tracking-tight`}>{m.value}</div>
            <p className="text-[11px] text-slate-400 mt-2 leading-snug">{m.desc}</p>
          </div>
        ))}
      </div>

      {/* NLP Pipeline Section */}
      <div className="rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
          <Layers className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Tahapan Pemrosesan Teks (NLP Pipeline)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pipelineSteps.map((s) => (
            <div
              key={s.step}
              className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold font-mono">
                  {s.step}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold font-mono">
                  Tahap {s.step}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-200">{s.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Model Specs Card */}
      <div className="rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Spesifikasi Model & Hyperparameter
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono">
            <span className="text-slate-500 block text-[11px]">Algoritma:</span>
            <span className="text-slate-200 font-bold">Support Vector Classifier (LinearSVC)</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono">
            <span className="text-slate-500 block text-[11px]">Feature Extraction:</span>
            <span className="text-slate-200 font-bold">TfidfVectorizer (N-Gram: 1-2)</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono">
            <span className="text-slate-500 block text-[11px]">Preprocessing:</span>
            <span className="text-slate-200 font-bold">Sastrawi Stemmer + Custom Lexicon</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono">
            <span className="text-slate-500 block text-[11px]">Database Cloud:</span>
            <span className="text-emerald-400 font-bold">Supabase Realtime PostgreSQL</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono">
            <span className="text-slate-500 block text-[11px]">Frontend Framework:</span>
            <span className="text-blue-400 font-bold">Next.js 14 App Router + Tailwind</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono">
            <span className="text-slate-500 block text-[11px]">Kecepatan Inferensi:</span>
            <span className="text-amber-400 font-bold">~11 ms / prediksi</span>
          </div>
        </div>
      </div>
    </div>
  )
}
