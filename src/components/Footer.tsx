import React from 'react'
import { Sparkles, Database, Cpu, Zap, ShieldCheck } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="w-full mt-20 border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="font-semibold text-slate-200 text-sm">
              Sentimen AI — Sistem Analisis Sentimen Aspirasi
            </div>
            <p className="text-xs text-slate-500">
              Transformasi digital evaluasi aspirasi berbahasa Indonesia berbasis Machine Learning & Next.js
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Next.js App Router</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase Realtime</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Scikit-Learn (Linear SVM)</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
        <p>© {new Date().getFullYear()} Sentimen AI. Hak cipta dilindungi undang-undang.</p>
        <p className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Realtime PostgreSQL Database Sync Enabled</span>
        </p>
      </div>
    </footer>
  )
}
