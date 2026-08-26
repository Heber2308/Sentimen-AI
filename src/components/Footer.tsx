import React from 'react'
import { GraduationCap, Database, Cpu, Zap, ShieldCheck } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="w-full mt-20 border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <div className="font-semibold text-slate-200 text-sm">
              Suara Kampus — Pusat Aspirasi Sivitas Akademika
            </div>
            <p className="text-xs text-slate-500">
              Ruang terpusat untuk mendengar masukan dan meningkatkan pengalaman belajar di kampus.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Portal Akademik</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Data Tersinkronisasi</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Analisis Berbasis Data</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
        <p>© {new Date().getFullYear()} Suara Kampus. Untuk kemajuan bersama.</p>
        <p className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Data terlindungi dan tersinkronisasi</span>
        </p>
      </div>
    </footer>
  )
}
