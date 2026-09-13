'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Filter,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  TrendingUp,
  Activity,
  LogOut,
  Settings,
  BarChart3,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Aspirasi, AspirasiStatus } from '@/lib/supabase'

const STATUS_COLORS: Record<AspirasiStatus, string> = {
  baru: 'bg-blue-100 text-blue-800 border-blue-300',
  ditinjau: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  diproses: 'bg-purple-100 text-purple-800 border-purple-300',
  selesai: 'bg-green-100 text-green-800 border-green-300',
  ditolak: 'bg-red-100 text-red-800 border-red-300',
}

const UNIT_COLORS: Record<string, string> = {
  akademik: 'bg-indigo-100 text-indigo-800',
  fasilitas: 'bg-teal-100 text-teal-800',
  keuangan: 'bg-orange-100 text-orange-800',
  kemahasiswaan: 'bg-pink-100 text-pink-800',
  lainnya: 'bg-slate-100 text-slate-800',
}

const URGENSI_COLORS: Record<string, string> = {
  rendah: 'text-slate-600',
  normal: 'text-blue-600',
  tinggi: 'text-orange-600',
  mendesak: 'text-red-600 font-bold',
}

export default function AdminPage() {
  const router = useRouter()
  const [aspirasi, setAspirasi] = useState<Aspirasi[]>([])
  const [filteredAspirasi, setFilteredAspirasi] = useState<Aspirasi[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<AspirasiStatus | 'semua'>('semua')
  const [unitFilter, setUnitFilter] = useState('semua')

  useEffect(() => {
    // Check auth
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)
      loadAspirasi()
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    filterAspirasi()
  }, [aspirasi, searchTerm, statusFilter, unitFilter])

  const loadAspirasi = async () => {
    try {
      const { data, error } = await supabase
        .from('aspirasi')
        .select('*')
        .order('waktu_dibuat', { ascending: false })
        .limit(200)

      if (error) throw error

      setAspirasi(data || [])
      setLoading(false)
    } catch (err) {
      console.error('Error loading aspirasi:', err)
      setLoading(false)
    }
  }

  const filterAspirasi = () => {
    let filtered = aspirasi

    // Filter by status
    if (statusFilter !== 'semua') {
      filtered = filtered.filter(a => a.status === statusFilter)
    }

    // Filter by unit
    if (unitFilter !== 'semua') {
      filtered = filtered.filter(a => a.unit === unitFilter)
    }

    // Filter by search
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        a =>
          (a.nomor_tiket?.toLowerCase() || '').includes(search) ||
          a.teks_asli.toLowerCase().includes(search)
      )
    }

    setFilteredAspirasi(filtered)
  }

  const updateStatus = async (id: number, newStatus: AspirasiStatus) => {
    try {
      const { error } = await supabase
        .from('aspirasi')
        .update({ status: newStatus, waktu_diubah: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      // Update local state
      setAspirasi(prev =>
        prev.map(a => (a.id === id ? { ...a, status: newStatus } : a))
      )
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const stats = {
    total: aspirasi.length,
    baru: aspirasi.filter(a => a.status === 'baru').length,
    diproses: aspirasi.filter(a => a.status === 'diproses').length,
    selesai: aspirasi.filter(a => a.status === 'selesai').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#08111f] via-[#0a1428] to-[#06140f] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">⚙️</div>
          <p className="text-white mt-3">Memuat aspirasi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#08111f] via-[#0a1428] to-[#06140f]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-amber-900/40 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-xs text-slate-400 mt-1">Kelola aspirasi dan tindak lanjut</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Aspirasi</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-slate-600" />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-blue-950/30 border border-blue-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-300">Baru</p>
                <p className="text-2xl font-bold text-blue-200 mt-1">{stats.baru}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-purple-950/30 border border-purple-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-300">Diproses</p>
                <p className="text-2xl font-bold text-purple-200 mt-1">{stats.diproses}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-green-950/30 border border-green-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-300">Selesai</p>
                <p className="text-2xl font-bold text-green-200 mt-1">{stats.selesai}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari nomor tiket atau isi aspirasi..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="semua">Semua Status</option>
            <option value="baru">Baru</option>
            <option value="ditinjau">Ditinjau</option>
            <option value="diproses">Diproses</option>
            <option value="selesai">Selesai</option>
            <option value="ditolak">Ditolak</option>
          </select>

          <select
            value={unitFilter}
            onChange={e => setUnitFilter(e.target.value)}
            className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="semua">Semua Unit</option>
            <option value="akademik">Akademik</option>
            <option value="fasilitas">Fasilitas</option>
            <option value="keuangan">Keuangan</option>
            <option value="kemahasiswaan">Kemahasiswaan</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </div>

        {/* Aspirasi List */}
        <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
          {filteredAspirasi.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400">Tidak ada aspirasi yang sesuai filter</p>
            </div>
          ) : (
            filteredAspirasi.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-mono text-xs font-bold text-amber-300 bg-slate-800/50 px-2 py-1 rounded">
                        {item.nomor_tiket}
                      </p>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded border ${
                          STATUS_COLORS[item.status]
                        }`}
                      >
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${UNIT_COLORS[item.unit]}`}>
                        {item.unit}
                      </span>
                      <span className={`text-xs font-medium ${URGENSI_COLORS[item.urgensi]}`}>
                        {item.urgensi}
                      </span>
                    </div>
                    <p className="text-white text-sm mb-2 line-clamp-2">{item.teks_asli}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>📅 {new Date(item.waktu_dibuat).toLocaleDateString('id-ID')}</span>
                      {item.sentimen && (
                        <span>
                          Sentimen:{' '}
                          <span
                            className={
                              item.sentimen === 'positif'
                                ? 'text-green-400'
                                : item.sentimen === 'negatif'
                                  ? 'text-red-400'
                                  : 'text-yellow-400'
                            }
                          >
                            {item.sentimen}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Update */}
                  <div className="flex flex-col gap-2">
                    <select
                      value={item.status}
                      onChange={e => updateStatus(item.id, e.target.value as AspirasiStatus)}
                      className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="baru">Baru</option>
                      <option value="ditinjau">Ditinjau</option>
                      <option value="diproses">Diproses</option>
                      <option value="selesai">Selesai</option>
                      <option value="ditolak">Ditolak</option>
                    </select>
                    <button className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-white transition-all flex items-center justify-center gap-1">
                      <Eye className="w-3 h-3" />
                      Detail
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
