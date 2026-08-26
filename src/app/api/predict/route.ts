import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { predictSentiment } from '@/lib/sentimentEngine'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const teks = String(body.teks || '').trim()

    if (!teks) {
      return NextResponse.json({ error: 'Teks aspirasi wajib diisi' }, { status: 400 })
    }

    if (teks.length < 5) {
      return NextResponse.json({ error: 'Teks minimal 5 karakter' }, { status: 400 })
    }

    // 1. Eksekusi inferensi AI secara instan (< 1ms)
    const hasil = predictSentiment(teks)

    const probPositif = Number(hasil.probabilitas?.positif ?? 0)
    const probNetral = Number(hasil.probabilitas?.netral ?? 0)
    const probNegatif = Number(hasil.probabilitas?.negatif ?? 0)
    const kataKunciStr = JSON.stringify(hasil.kata_kunci || [])
    const waktuISO = new Date().toISOString()

    // 2. Simpan ke Supabase PostgreSQL secara real-time
    try {
      const { error: insertError } = await supabase.from('prediksi').insert([
        {
          teks_asli: teks,
          teks_bersih: hasil.teks_bersih || teks,
          sentimen: hasil.sentimen,
          prob_positif: probPositif,
          prob_netral: probNetral,
          prob_negatif: probNegatif,
          kata_kunci: kataKunciStr,
          waktu: waktuISO,
        },
      ])

      if (insertError) {
        console.warn('Warning saving to Supabase:', insertError)
      }
    } catch (dbErr) {
      console.warn('DB insert catch:', dbErr)
    }

    return NextResponse.json(hasil)
  } catch (err: any) {
    console.error('Predict API Error:', err)
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan internal' }, { status: 500 })
  }
}
