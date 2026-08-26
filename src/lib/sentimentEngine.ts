import modelData from '../data/model_export.json'

interface ModelExport {
  classes: number[]
  class_log_prior: number[]
  feature_log_prob: number[][]
  vocabulary: Record<string, number>
  idf: number[]
  label_mapping: Record<string, 'positif' | 'netral' | 'negatif'>
  ngram_range: [number, number]
}

const model: ModelExport = modelData as unknown as ModelExport

const NORMALISASI: Record<string, string> = {
  gak: 'tidak',
  ga: 'tidak',
  nggak: 'tidak',
  g: 'tidak',
  udah: 'sudah',
  udh: 'sudah',
  bgt: 'banget',
  bngt: 'banget',
  jg: 'juga',
  tp: 'tapi',
  tdk: 'tidak',
  krn: 'karena',
  krs: 'kartu rencana studi',
  krsan: 'pengisian krs',
  ukt: 'uang kuliah tunggal',
  spp: 'uang kuliah tunggal',
  lms: 'sistem pembelajaran',
  perpus: 'perpustakaan',
  lab: 'laboratorium',
  maba: 'mahasiswa baru',
  ta: 'tugas akhir',
  matkul: 'mata kuliah',
  doswal: 'dosen wali',
  kaprodi: 'ketua program studi',
  ukm: 'unit kegiatan mahasiswa',
  kating: 'kakak tingkat',
}

const STOPWORDS_ID = new Set([
  'yang', 'di', 'dan', 'ini', 'dari', 'untuk', 'pada', 'ke', 'dengan', 'ada',
  'bisa', 'akan', 'juga', 'sudah', 'saya', 'kami', 'kita', 'mereka', 'karena',
  'adalah', 'agar', 'oleh', 'saat', 'atau', 'dalam', 'secara', 'harus', 'bila',
  'jika', 'bagi', 'sampai', 'tentang', 'seperti', 'masih', 'itu', 'dia', 'kamu',
  'yg', 'dg', 'dgn', 'ny', 'sih', 'deh', 'dong', 'kok', 'loh', 'nah', 'kah', 'lah', 'pun'
])

export function cleanText(text: string): string {
  if (!text) return ''
  let cleaned = text.toLowerCase()
  cleaned = cleaned.replace(/https?:\/\/\S+|www\.\S+/g, '')
  cleaned = cleaned.replace(/[@#]\w+/g, '')
  cleaned = cleaned.replace(/\d+/g, '')
  cleaned = cleaned.replace(/[!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]/g, ' ')
  cleaned = cleaned.replace(/\s+/g, ' ').trim()

  // Negation joining
  cleaned = cleaned.replace(/\btidak\s+(\w+)/g, 'tidak_$1')
  cleaned = cleaned.replace(/\bbukan\s+(\w+)/g, 'bukan_$1')
  cleaned = cleaned.replace(/\bkurang\s+(\w+)/g, 'kurang_$1')
  cleaned = cleaned.replace(/\bjangan\s+(\w+)/g, 'jangan_$1')

  return cleaned
}

export function preprocessText(text: string): { cleaned: string; tokens: string[] } {
  const cleaned = cleanText(text)
  if (!cleaned) return { cleaned: '', tokens: [] }

  const rawTokens = cleaned.match(/\b\w+\b/g) || []
  const normalizedTokens = rawTokens.map((w) => NORMALISASI[w] || w)
  const tokens = normalizedTokens.filter((w) => w.length > 1 && !STOPWORDS_ID.has(w))

  return {
    cleaned: tokens.join(' '),
    tokens,
  }
}

export interface PredictionOutput {
  sentimen: 'positif' | 'netral' | 'negatif'
  probabilitas: {
    positif: number
    netral: number
    negatif: number
  }
  kata_kunci: string[]
  teks_bersih: string
}

export function predictSentiment(rawText: string): PredictionOutput {
  const { cleaned, tokens } = preprocessText(rawText)

  if (!cleaned || tokens.length === 0) {
    return {
      sentimen: 'netral',
      probabilitas: { positif: 0, netral: 100, negatif: 0 },
      kata_kunci: [],
      teks_bersih: cleaned || rawText,
    }
  }

  // 1. Ekstraksi n-gram (1-gram dan 2-gram)
  const ngrams: string[] = []
  for (let i = 0; i < tokens.length; i++) {
    ngrams.push(tokens[i])
    if (i < tokens.length - 1) {
      ngrams.push(`${tokens[i]} ${tokens[i + 1]}`)
    }
  }

  // 2. Hitung Term Frequency (TF)
  const tfMap = new Map<number, number>()
  for (const term of ngrams) {
    if (term in model.vocabulary) {
      const idx = model.vocabulary[term]
      tfMap.set(idx, (tfMap.get(idx) || 0) + 1)
    }
  }

  // 3. Hitung TF-IDF dengan L2 Normalization (sesuai scikit-learn TfidfVectorizer)
  const tfidfMap = new Map<number, number>()
  let sumSquares = 0

  tfMap.forEach((count, idx) => {
    const idfVal = model.idf[idx]
    const tfidfVal = count * idfVal
    tfidfMap.set(idx, tfidfVal)
    sumSquares += tfidfVal * tfidfVal
  })

  const norm = Math.sqrt(sumSquares)
  if (norm > 0) {
    tfidfMap.forEach((val, idx) => {
      tfidfMap.set(idx, val / norm)
    })
  }

  // 4. Multinomial Naive Bayes Log-Likelihood
  const numClasses = model.classes.length
  const logProbs: number[] = new Array(numClasses).fill(0)

  for (let c = 0; c < numClasses; c++) {
    logProbs[c] = model.class_log_prior[c]
    tfidfMap.forEach((tfidfVal, idx) => {
      logProbs[c] += tfidfVal * model.feature_log_prob[c][idx]
    })
  }

  // 5. Softmax Normalization untuk Probabilitas
  const maxLog = Math.max(...logProbs)
  const expScores = logProbs.map((lp) => Math.exp(lp - maxLog))
  const sumExp = expScores.reduce((a, b) => a + b, 0)
  const probs = expScores.map((e) => (sumExp > 0 ? e / sumExp : 1 / numClasses))

  // Mapping label
  let bestClassIdx = 0
  let maxProb = probs[0]
  for (let c = 1; c < numClasses; c++) {
    if (probs[c] > maxProb) {
      maxProb = probs[c]
      bestClassIdx = c
    }
  }

  const classId = model.classes[bestClassIdx]
  const sentimenLabel = model.label_mapping[String(classId)] || 'netral'

  const probDict: Record<string, number> = {
    positif: 0,
    netral: 0,
    negatif: 0,
  }

  model.classes.forEach((cid, idx) => {
    const label = model.label_mapping[String(cid)]
    if (label) {
      probDict[label] = Number((probs[idx] * 100).toFixed(1))
    }
  })

  // 6. Ekstrak Kata Kunci Teratas
  const sortedFeatures = Array.from(tfidfMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  // Invert vocabulary lookup for top features
  const invVocab = new Map<number, string>()
  for (const [k, v] of Object.entries(model.vocabulary)) {
    invVocab.set(v, k)
  }

  const keywords = sortedFeatures
    .map(([idx]) => invVocab.get(idx) || '')
    .filter(Boolean)

  return {
    sentimen: sentimenLabel,
    probabilitas: {
      positif: probDict.positif || 0,
      netral: probDict.netral || 0,
      negatif: probDict.negatif || 0,
    },
    kata_kunci: keywords.length > 0 ? keywords : tokens.slice(0, 5),
    teks_bersih: cleaned,
  }
}
