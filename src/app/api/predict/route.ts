import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { spawn } from 'child_process'
import path from 'path'

// Helper untuk menjalankan inferensi Python ML lokal
async function runPythonInference(teks: string): Promise<any> {
  // Coba panggil microservice Python jika berjalan di port 8082
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1200)

    const pyRes = await fetch('http://127.0.0.1:8082/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'teks=' + encodeURIComponent(teks),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (pyRes.ok) {
      const data = await pyRes.json()
      return data
    }
  } catch {
    // Fallback ke child_process jika microservice belum aktif
  }

  // Fallback: Eksekusi Python inline via child_process
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'data')
    const pythonCode = `
import sys, json, os, re, string, joblib
data_dir = r"${scriptPath.replace(/\\/g, '\\\\')}"
teks = """${teks.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"""

def clean_text(text):
    text = text.lower()
    text = re.sub(r'http\\S+|www\\S+|https\\S+', '', text)
    text = re.sub(r'@\\w+|#\\w+', '', text)
    text = re.sub(r'\\d+', '', text)
    text = text.translate(str.maketrans('', '', string.punctuation))
    text = re.sub(r'\\s+', ' ', text).strip()
    return text

teks_bersih = clean_text(teks)
model_path = os.path.join(data_dir, 'model_sentimen.pkl')
label_path = os.path.join(data_dir, 'label_mapping.pkl')
vec_path = os.path.join(data_dir, 'vectorizer.pkl')

if os.path.exists(model_path):
    model = joblib.load(model_path)
    label_map = joblib.load(label_path)
    vec = joblib.load(vec_path) if os.path.exists(vec_path) else None

    pred = model.predict([teks_bersih])[0]
    sentimen = str(label_map[pred])
    proba = model.predict_proba([teks_bersih])[0]
    prob_dict = {}
    for i, p in enumerate(proba):
        prob_dict[str(label_map[i])] = float(round(float(p) * 100, 1))

    # Keyword extraction
    keywords = []
    if vec:
        try:
            tfidf = vec.transform([teks_bersih])
            arr = tfidf.toarray().flatten()
            top = arr.argsort()[-6:][::-1]
            names = vec.get_feature_names_out()
            for idx in top:
                if arr[idx] > 0:
                    keywords.append(str(names[idx]))
        except Exception:
            pass

    out = {
        'sentimen': sentimen,
        'probabilitas': prob_dict,
        'kata_kunci': keywords,
        'teks_bersih': teks_bersih
    }
    print(json.dumps(out))
else:
    print(json.dumps({'error': 'Model file tidak ditemukan'}))
`

    const proc = spawn('python', ['-c', pythonCode], { cwd: process.cwd() })
    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (d) => {
      stdout += d.toString()
    })
    proc.stderr.on('data', (d) => {
      stderr += d.toString()
    })

    proc.on('close', (code) => {
      if (code !== 0 || !stdout) {
        reject(new Error(stderr || 'Gagal menjalankan inferensi ML'))
      } else {
        try {
          const parsed = JSON.parse(stdout.trim())
          resolve(parsed)
        } catch (e) {
          reject(new Error('Format output model tidak valid'))
        }
      }
    })
  })
}

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

    // Jalankan inferensi AI
    const hasil = await runPythonInference(teks)

    if (!hasil || hasil.error) {
      return NextResponse.json({ error: hasil?.error || 'Gagal memproses teks' }, { status: 500 })
    }

    const probPositif = Number(hasil.probabilitas?.positif ?? 0)
    const probNetral = Number(hasil.probabilitas?.netral ?? 0)
    const probNegatif = Number(hasil.probabilitas?.negatif ?? 0)
    const kataKunciStr = JSON.stringify(hasil.kata_kunci || [])
    const waktuISO = new Date().toISOString()

    // Simpan ke Supabase secara asynchronous & real-time
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
      console.warn('DB async insert catch:', dbErr)
    }

    return NextResponse.json(hasil)
  } catch (err: any) {
    console.error('Predict API Error:', err)
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan internal' }, { status: 500 })
  }
}
