import { createClient } from '@supabase/supabase-js'
import { parseDateSafe } from './utils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zaayyotazglzuiyniwwu.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphYXl5b3RhemdsenVpeW5pd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MTY5NjksImV4cCI6MjEwMzI5Mjk2OX0.hNWwyo2Un_stpSCcPTVWRXJc0GNZJrQ2g7jFPs_siI4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export interface PrediksiRecord {
  id: number
  teks_asli: string
  teks_bersih?: string
  sentimen: 'positif' | 'netral' | 'negatif'
  prob_positif: number
  prob_netral: number
  prob_negatif: number
  kata_kunci?: string
  waktu: string
}

export interface StatsData {
  total: number
  positif: number
  netral: number
  negatif: number
  periodeLabel?: string
}

export interface TrendData {
  labels: string[]
  positif: number[]
  netral: number[]
  negatif: number[]
}

// Helper untuk mendapatkan rentang waktu bulan berjalan (WIB)
export function getCurrentMonthRange() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()
  const labelBulan = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(now)

  return { startOfMonth, endOfMonth, labelBulan }
}

// Mengambil ringkasan statistik (Default: Otomatis Bulan Berjalan)
export async function getStats(period: 'current_month' | 'all' = 'current_month'): Promise<StatsData> {
  try {
    const { startOfMonth, endOfMonth, labelBulan } = getCurrentMonthRange()

    let qTotal = supabase.from('prediksi').select('*', { count: 'exact', head: true })
    let qPositif = supabase.from('prediksi').select('*', { count: 'exact', head: true }).eq('sentimen', 'positif')
    let qNetral = supabase.from('prediksi').select('*', { count: 'exact', head: true }).eq('sentimen', 'netral')
    let qNegatif = supabase.from('prediksi').select('*', { count: 'exact', head: true }).eq('sentimen', 'negatif')

    if (period === 'current_month') {
      qTotal = qTotal.gte('waktu', startOfMonth).lte('waktu', endOfMonth)
      qPositif = qPositif.gte('waktu', startOfMonth).lte('waktu', endOfMonth)
      qNetral = qNetral.gte('waktu', startOfMonth).lte('waktu', endOfMonth)
      qNegatif = qNegatif.gte('waktu', startOfMonth).lte('waktu', endOfMonth)
    }

    const [{ count: total }, { count: positif }, { count: netral }, { count: negatif }] = await Promise.all([
      qTotal,
      qPositif,
      qNetral,
      qNegatif,
    ])

    return {
      total: total || 0,
      positif: positif || 0,
      netral: netral || 0,
      negatif: negatif || 0,
      periodeLabel: period === 'current_month' ? `Bulan ${labelBulan}` : 'Semua Waktu',
    }
  } catch (err) {
    console.error('Failed to get stats:', err)
    return { total: 0, positif: 0, netral: 0, negatif: 0 }
  }
}

// Mengambil riwayat prediksi terbaru
export async function getPredictions(
  limit = 100,
  page = 1,
  search = '',
  sentimentFilter = '',
  period: 'current_month' | 'all' = 'current_month'
): Promise<{ data: PrediksiRecord[]; total: number }> {
  try {
    let query = supabase.from('prediksi').select('*', { count: 'exact' }).order('waktu', { ascending: false })

    if (period === 'current_month') {
      const { startOfMonth, endOfMonth } = getCurrentMonthRange()
      query = query.gte('waktu', startOfMonth).lte('waktu', endOfMonth)
    }

    if (search) {
      query = query.ilike('teks_asli', `%${search}%`)
    }

    if (sentimentFilter && sentimentFilter !== 'all') {
      query = query.eq('sentimen', sentimentFilter)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, count, error } = await query

    if (error) {
      console.error('Error fetching predictions:', error)
      return { data: [], total: 0 }
    }

    return {
      data: (data as PrediksiRecord[]) || [],
      total: count || 0,
    }
  } catch (err) {
    console.error('Failed to fetch predictions:', err)
    return { data: [], total: 0 }
  }
}

// Mengambil data tren untuk chart
export async function getTrendData(period: 'current_month' | 'all' = 'current_month'): Promise<TrendData> {
  try {
    let query = supabase.from('prediksi').select('waktu, sentimen').order('waktu', { ascending: true })

    if (period === 'current_month') {
      const { startOfMonth, endOfMonth } = getCurrentMonthRange()
      query = query.gte('waktu', startOfMonth).lte('waktu', endOfMonth)
    }

    const { data, error } = await query

    if (error || !data) {
      return { labels: [], positif: [], netral: [], negatif: [] }
    }

    const trendMap: Record<string, { positif: number; netral: number; negatif: number }> = {}

    data.forEach((item: { waktu?: string; sentimen?: string }) => {
      if (!item.waktu) return
      const date = parseDateSafe(item.waktu)
      if (!date) return
      // Format: DD MMM (WIB)
      const label = date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        timeZone: 'Asia/Jakarta',
      })
      if (!trendMap[label]) {
        trendMap[label] = { positif: 0, netral: 0, negatif: 0 }
      }
      const s = item.sentimen
      if (s === 'positif' || s === 'netral' || s === 'negatif') {
        trendMap[label][s]++
      }
    })

    const labels = Object.keys(trendMap)
    return {
      labels,
      positif: labels.map((l) => trendMap[l].positif),
      netral: labels.map((l) => trendMap[l].netral),
      negatif: labels.map((l) => trendMap[l].negatif),
    }
  } catch (err) {
    console.error('Failed to fetch trend data:', err)
    return { labels: [], positif: [], netral: [], negatif: [] }
  }
}

// Reset / Pembersihan Data (Menghapus data sebelum bulan berjalan jika diminta)
export async function resetPreviousMonthsData(): Promise<boolean> {
  try {
    const { startOfMonth } = getCurrentMonthRange()
    const { error } = await supabase.from('prediksi').delete().lt('waktu', startOfMonth)
    if (error) {
      console.warn('Error resetting previous months data:', error)
      return false
    }
    return true
  } catch {
    return false
  }
}

// Reset Seluruh Data (Manual Full Reset)
export async function clearAllPredictions(): Promise<boolean> {
  try {
    const { error } = await supabase.from('prediksi').delete().gte('id', 0)
    if (error) {
      console.warn('Error clearing predictions:', error)
      return false
    }
    return true
  } catch {
    return false
  }
}
