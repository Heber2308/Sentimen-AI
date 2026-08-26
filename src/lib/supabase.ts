import { createClient } from '@supabase/supabase-js'

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
}

export interface TrendData {
  labels: string[]
  positif: number[]
  netral: number[]
  negatif: number[]
}

// Mengambil ringkasan statistik
export async function getStats(): Promise<StatsData> {
  try {
    const { count: total, error: e1 } = await supabase.from('prediksi').select('*', { count: 'exact', head: true })
    const { count: positif } = await supabase.from('prediksi').select('*', { count: 'exact', head: true }).eq('sentimen', 'positif')
    const { count: netral } = await supabase.from('prediksi').select('*', { count: 'exact', head: true }).eq('sentimen', 'netral')
    const { count: negatif } = await supabase.from('prediksi').select('*', { count: 'exact', head: true }).eq('sentimen', 'negatif')

    if (e1) {
      console.warn('Supabase stats error:', e1)
    }

    return {
      total: total || 0,
      positif: positif || 0,
      netral: netral || 0,
      negatif: negatif || 0,
    }
  } catch (err) {
    console.error('Failed to get stats:', err)
    return { total: 0, positif: 0, netral: 0, negatif: 0 }
  }
}

// Mengambil riwayat prediksi terbaru
export async function getPredictions(limit = 100, page = 1, search = '', sentimentFilter = ''): Promise<{ data: PrediksiRecord[], total: number }> {
  try {
    let query = supabase.from('prediksi').select('*', { count: 'exact' }).order('waktu', { ascending: false })

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
export async function getTrendData(): Promise<TrendData> {
  try {
    const { data, error } = await supabase
      .from('prediksi')
      .select('waktu, sentimen')
      .order('waktu', { ascending: true })

    if (error || !data) {
      return { labels: [], positif: [], netral: [], negatif: [] }
    }

    const trendMap: Record<string, { positif: number; netral: number; negatif: number }> = {}

    data.forEach((item) => {
      if (!item.waktu) return
      const date = new Date(item.waktu)
      // Format: DD MMM
      const label = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      if (!trendMap[label]) {
        trendMap[label] = { positif: 0, netral: 0, negatif: 0 }
      }
      if (item.sentimen === 'positif' || item.sentimen === 'netral' || item.sentimen === 'negatif') {
        trendMap[label][item.sentimen]++
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
