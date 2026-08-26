from flask import Flask, render_template, request, jsonify, Response
from flask_sqlalchemy import SQLAlchemy
from wordcloud import WordCloud
import pytz
from datetime import datetime
import pandas as pd
import numpy as np
import re
import string
import joblib
import os
import io
import csv
import json
import warnings
warnings.filterwarnings('ignore')

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    from nltk.tokenize import TreebankWordTokenizer
    _tokenizer = TreebankWordTokenizer()
    def tokenize_words(text):
        return _tokenizer.tokenize(text)
except Exception:
    def tokenize_words(text):
        return re.findall(r'\b\w+\b', text)

from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import base64

try:
    import psycopg2.extensions
    psycopg2.extensions.register_adapter(np.float64, psycopg2.extensions.Float)
    psycopg2.extensions.register_adapter(np.float32, psycopg2.extensions.Float)
    psycopg2.extensions.register_adapter(np.int64, psycopg2.extensions.AsIs)
    psycopg2.extensions.register_adapter(np.int32, psycopg2.extensions.AsIs)
except Exception:
    pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
is_vercel = os.environ.get('VERCEL') == '1' or os.environ.get('VERCEL_ENV') is not None or os.environ.get('NOW_REGION') is not None

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, 'templates'),
    static_folder=os.path.join(BASE_DIR, 'static')
)

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'sentimen-ai-secret-key-2024')

# Konfigurasi Supabase REST / API (opsional)
app.config['SUPABASE_URL'] = os.environ.get('SUPABASE_URL', '')
app.config['SUPABASE_KEY'] = os.environ.get('SUPABASE_KEY', os.environ.get('SUPABASE_ANON_KEY', ''))

# Database URI: Mendukung Cloud PostgreSQL (Supabase/Neon) atau fallback ke SQLite
db_url = os.environ.get('DATABASE_URL')
if db_url and '[YOUR_PASSWORD]' not in db_url and '[PASSWORD]' not in db_url:
    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)
    if 'sslmode=' not in db_url and ('supabase.co' in db_url or 'supabase.com' in db_url or 'pooler.supabase.com' in db_url):
        db_url += ('&' if '?' in db_url else '?') + 'sslmode=require'
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }
elif is_vercel:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/sentimen.db'
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///sentimen.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
db = SQLAlchemy(app)

UPLOAD_DIR = '/tmp/uploads' if is_vercel else os.path.join(BASE_DIR, 'uploads')
MODEL_PATH = os.path.join(DATA_DIR, 'model_sentimen.pkl')
VECTORIZER_PATH = os.path.join(DATA_DIR, 'vectorizer.pkl')
LABEL_MAPPING_PATH = os.path.join(DATA_DIR, 'label_mapping.pkl')
PREPROCESS_CONFIG_PATH = os.path.join(DATA_DIR, 'preprocess_config.pkl')

os.makedirs(DATA_DIR, exist_ok=True)
try:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
except Exception:
    pass

class Prediksi(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    teks_asli = db.Column(db.Text, nullable=False)
    teks_bersih = db.Column(db.Text, nullable=True)
    sentimen = db.Column(db.String(20), nullable=False)
    prob_positif = db.Column(db.Float, default=0)
    prob_netral = db.Column(db.Float, default=0)
    prob_negatif = db.Column(db.Float, default=0)
    kata_kunci = db.Column(db.Text, nullable=True)
    waktu = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Jakarta')))

with app.app_context():
    try:
        db.create_all()
    except Exception as e:
        print(f"DB init warning: {e}")

model = None
vectorizer = None
label_mapping = None
preprocess_config = {'use_stemming': True}
model_loaded = False

def load_model():
    global model, vectorizer, label_mapping, preprocess_config, model_loaded
    try:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
            vectorizer = joblib.load(VECTORIZER_PATH)
            label_mapping = joblib.load(LABEL_MAPPING_PATH)
            if os.path.exists(PREPROCESS_CONFIG_PATH):
                preprocess_config = joblib.load(PREPROCESS_CONFIG_PATH)
            model_loaded = True
            return True
    except Exception as e:
        print(f"Error loading model: {e}")
    return False

load_model()

try:
    factory = StemmerFactory()
    stemmer = factory.create_stemmer()
except Exception as e:
    print(f"Stemmer init notice: {e}")
    stemmer = None

STOPWORDS_FILE = os.path.join(DATA_DIR, 'stopwords_id.json')
stopwords_id = set()
if os.path.exists(STOPWORDS_FILE):
    try:
        with open(STOPWORDS_FILE, 'r', encoding='utf-8') as f:
            stopwords_id = set(json.load(f))
    except Exception:
        pass
if not stopwords_id:
    try:
        from nltk.corpus import stopwords
        stopwords_id = set(stopwords.words('indonesian'))
    except Exception:
        stopwords_id = set()
kata_penting = {
    'tidak', 'bukan', 'belum', 'jangan', 'sangat', 'sekali', 'lebih', 'kurang', 'paling', 'banget',
    'baik', 'buruk', 'bagus', 'jelek', 'puas', 'kecewa', 'senang', 'sedih', 'marah', 'benci', 'suka',
    'bersih', 'kotor', 'rusak', 'rapi', 'berantakan', 'wangi', 'bau', 'aman', 'bahaya', 
    'nyaman', 'asri', 'gersang', 'mampet', 'becek', 'pengap', 'lengkap', 'terawat', 'luas', 'sempit',
    'beragam', 'monoton', 'murah', 'mahal', 'terjangkau', 'higienis', 'enak', 'lezat', 
    'hambar', 'segar', 'basi', 'banyak', 'sedikit', 'dikit', 'cukup',
    'responsif', 'disiplin', 'kaku', 'bentrok', 'berubah', 'telat', 'objektif', 'susah', 'gampang',
    'ramah', 'jutek', 'lambat', 'lamban', 'cepat', 'berbelit', 'mudah', 'transparan', 'ribet', 'sigap',
    'lancar', 'lemot', 'error', 'down', 'canggih', 'jadul', 'informatif', 'berguna', 'crash', 'stabil',
    'seru', 'terorganisir', 'bermanfaat', 'formalitas', 'jelas', 'pengalaman', 'menarik',
    'bully', 'pembullyan', 'pelecehan', 'kekerasan', 'senioritas', 'pungli', 'ancaman', 'meresahkan',
    'kondisi', 'sabar', 'kesabaran', 'tenang', 'dingin', 'diperbaiki', 'berfungsi', 'belajar',
    'cepet', 'lambat', 'lamban', 'ramai', 'sepi', 'bening', 'terang', 'gampang', 'susah', 'sulit',
    'besar', 'lemot', 'error', 'hambar', 'lezat', 'pahit', 'variatif', 'panas', 'adem', 'gerah',
    'tanpa', 'tidak_kotor', 'tidak_bersih', 'tidak_rapi', 'tidak_nyaman', 'tidak_enak',
    'tidak_stabil', 'tidak_lancar', 'tidak_cepat', 'diganti', 'dirawat', 'menjelaskan', 'mengajar',
    'memahami', 'memperbaiki', 'dibully', 'tidak_aman', 'kating', 'pelayanan', 'birokrasi',
    'persuratan', 'staf', 'tu', 'penjual', 'koki', 'rektorat', 'ruang_kuliah', 'laboratorium',
    'ruang', 'perpus', 'internet', 'jaringan', 'koneksi', 'parkiran', 'kamar_mandi', 'musholla',
    'taman', 'spp', 'keringanan', 'pembayaran', 'organisasi', 'seminar', 'event', 'acara',
    'krsan', 'skripsi', 'tugas_akhir', 'bimbingan', 'ngajar',
    'surat_keterangan', 'pengurusan_surat', 'administrasi_surat',
    'lama', 'lambat', 'lamban', 'tidak_cepat',
    'rusak', 'patah', 'sobek', 'tidak_layak',
    'lama', 'lambat', 'lamban', 'tidak_cepat', 'berbelit',
    'terlambat', 'telat', 'tidak_tepat_waktu', 'molor',
    'cepat', 'lambat', 'lamban', 'lamban sekali',
    'tenang', 'sunyi', 'hening', 'ramai',
    'jelas', 'sangat jelas', 'jelas sekali', 'mudah dimengerti',
    'seru', 'asyik', 'asik', 'asyik sekali',
    'luas', 'legok', 'lapang', 'sempit',
    'dingin', 'sejuk', 'adem', 'gerah', 'panas menyengat',
    'magang', 'pengalaman_kerja', 'berharga', 'bermanfaat', 'karir',
    'tidak_bersih', 'tidak_kotor', 'tidak_rapi', 'tidak_nyaman',
    'tidak_enak', 'tidak_stabil', 'tidak_lancar', 'tidak_cepat',
    'tidak_seru', 'tidak_asik', 'tidak_asyik', 'tidak_membosankan',
    'tidak_ada', 'tidak_punya', 'tanpa_berserakan',
    'sudah', 'masih', 'belum', 'akan', 'telah',
    'sangat', 'sekali', 'banget', 'beneran', 'bener', 'benar',
    'berfungsi', 'bekerja', 'rusak', 'diperbaiki', 'ditingkatkan',
    'dibersihkan', 'dirawat', 'dijaga', 'dikelola',
    'menjelaskan', 'mengajar', 'belajar', 'memahami', 'memperbaiki',
    'membersihkan', 'merawat', 'menjaga', 'mengelola',
    'administrasi', 'pelayanan', 'birokrasi', 'persuratan', 'surat', 'dokumen',
    'staf', 'tu', 'petugas', 'pegawai', 'kantor',
    'kantin', 'kantin kampus', 'menu', 'makanan', 'minuman', 'jajanan',
    'penjual', 'koki', 'masakan', 'cicipan',
    'dosen', 'dosen pengajar', 'dosen pembimbing', 'asisten dosen',
    'mahasiswa', 'maba', 'senior', 'alumni',
    'kelas', 'ruang kuliah', 'laboratorium', 'lab', 'studio',
    'perpustakaan', 'perpus', 'ruang baca',
    'wifi', 'internet', 'jaringan', 'koneksi', 'sinyal',
    'parkir', 'parkiran', 'tempat parkir', 'lahan parkir',
    'toilet', 'kamar mandi', 'wc', 'musholla', 'masjid', 'taman',
    'ukt', 'spp', 'beasiswa', 'kip', 'bantuan biaya', 'keringanan',
    'kegiatan', 'ukm', 'organisasi', 'himpunan', 'komunitas',
    'seminar', 'workshop', 'pelatihan', 'acara', 'event',
    'krs', 'krs online', 'kartu rencana studi', 'isi krs',
    'skripsi', 'tugas akhir', 'ta', 'bimbingan', 'sempro', 'sidang',
    'bully', 'pembullyan', 'di bully', 'di pembully',
    'senioritas', 'kating jail', 'oknum',
    'pungli', 'pungutan liar', 'biaya tidak resmi',
    'ancaman', 'intimidasi', 'kekerasan', 'pelecehan',
    'meresahkan', 'tidak nyaman', 'tidak aman', 'takut', 'khawatir',
    'diskriminasi', 'tidak ramah', 'tidak peduli', 'cuek',
    'kesulitan', 'susah', 'sulit', 'repot',
    'gangguan', 'error', 'down', 'lemot', 'lambat',
    'kurang_terawat', 'tidak_terawat', 'bau', 'bacin', 'busuk',
    'kesal', 'kecewa', 'sebal', 'jengkel',
    'toilet', 'wc', 'kamar_mandi', 'lavatory',
    'bau', 'bacin', 'busuk', 'tidak_sedap', 'menyengat',
    'kurang_terawat', 'tidak_terawat', 'kotor', 'jorok',
    'jarang_dibersihkan', 'tidak_dibersihkan',
    'kehabisan_air', 'kekurangan_air', 'air_mati',
    'rusak', 'patah', 'sobek', 'tidak_dapat_digunakan', 'tidak_bisa_dipakai',
    'lama', 'lambat', 'berbelit', 'ruwet',
    'terlambat', 'telat', 'tidak_tepat_waktu',
}
stopwords_id = stopwords_id - kata_penting
additional = {'yg', 'dg', 'dgn', 'ny', 'sih', 'deh', 'dong', 'kok', 'loh', 'nah', 'kah', 'lah', 'pun'}
stopwords_id.update(additional)
normalisasi = {
    'gak': 'tidak', 'ga': 'tidak', 'nggak': 'tidak', 'g': 'tidak',
    'udah': 'sudah', 'udh': 'sudah',
    'bgt': 'banget', 'bngt': 'banget', 'banget': 'banget',
    'jg': 'juga', 'tp': 'tapi', 'tdk': 'tidak', 'krn': 'karena',
    'krs': 'kartu rencana studi', 'krsan': 'pengisian krs',
    'ukt': 'uang kuliah tunggal', 'spp': 'uang kuliah tunggal',
    'lms': 'sistem pembelajaran', 'perpus': 'perpustakaan',
    'lab': 'laboratorium', 'maba': 'mahasiswa baru', 'ta': 'tugas akhir',
    'matkul': 'mata kuliah', 'doswal': 'dosen wali', 'kaprodi': 'ketua program studi',
    'ukm': 'unit kegiatan mahasiswa', 'kating': 'kakak tingkat'
}
def clean_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'http\S+|www\S+|https\S+', '', text)
    text = re.sub(r'@\w+|#\w+', '', text)
    text = re.sub(r'\d+', '', text)
    text = text.translate(str.maketrans('', '', string.punctuation))
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'\btidak\s+(\w+)', r'tidak_\1', text)
    text = re.sub(r'\bbukan\s+(\w+)', r'bukan_\1', text)
    text = re.sub(r'\bkurang\s+(\w+)', r'kurang_\1', text)
    text = re.sub(r'\bjangan\s+(\w+)', r'jangan_\1', text)
    return text
def preprocess_text(text):
    use_stemming = preprocess_config.get('use_stemming', True)
    text = clean_text(text)
    if not text:
        return "", []
    tokens = tokenize_words(text)
    tokens = [normalisasi.get(w, w) for w in tokens]
    original_tokens = [w for w in tokens if w not in stopwords_id and len(w) > 1]
    if use_stemming:
        tokens = [w if '_' in w else stemmer.stem(w) for w in original_tokens]
    else:
        tokens = original_tokens
    return ' '.join(tokens), original_tokens
def get_wib_time():
    return datetime.now(pytz.timezone('Asia/Jakarta'))
def format_wib(dt):
    if dt.tzinfo is None:
        dt = pytz.utc.localize(dt).astimezone(pytz.timezone('Asia/Jakarta'))
    return dt.strftime('%Y-%m-%d %d/%m/%Y %H:%M:%S')
def predict_sentiment(teks):
    if not model_loaded:
        return None, "Model belum tersedia"
    teks_bersih, original_tokens = preprocess_text(teks)
    if not teks_bersih:
        return None, "Teks kosong setelah preprocessing"
    if vectorizer is not None:
        try:
            tfidf_vector = vectorizer.transform([teks_bersih])
            if tfidf_vector.nnz == 0:
                return None, "Kalimat tidak terdeteksi. Harap masukkan kalimat yang bermakna."
        except Exception as e:
            pass
    try:
        pred_label = model.predict([teks_bersih])[0]
        sentimen = str(label_mapping[pred_label])
        proba = model.predict_proba([teks_bersih])[0]
        prob_dict = {}
        for i, p in enumerate(proba):
            prob_dict[str(label_mapping[i])] = float(round(float(p) * 100, 1))
        kata_kunci = [str(k) for k in ekstrak_kata_kunci(teks_bersih, original_tokens)]
        return {
            'sentimen': sentimen,
            'probabilitas': prob_dict,
            'kata_kunci': kata_kunci,
            'teks_bersih': str(teks_bersih)
        }, None
    except Exception as e:
        return None, f"Error prediksi: {str(e)}"
def ekstrak_kata_kunci(teks_bersih, original_tokens):
    if not teks_bersih or not vectorizer:
        return []
    try:
        feature_names = vectorizer.get_feature_names_out()
        tfidf_vector = vectorizer.transform([teks_bersih])
        feature_array = tfidf_vector.toarray().flatten()
        top_indices = feature_array.argsort()[-8:][::-1]
        kata_kunci = []
        for idx in top_indices:
            if feature_array[idx] > 0:
                kata_kunci.append(str(feature_names[idx]))
        return kata_kunci[:6]
    except Exception:
        return [str(tok) for tok in list(set(original_tokens))[:5]]
def get_stats():
    total = Prediksi.query.count()
    positif = Prediksi.query.filter_by(sentimen='positif').count()
    negatif = Prediksi.query.filter_by(sentimen='negatif').count()
    netral = Prediksi.query.filter_by(sentimen='netral').count()
    return {
        'total': total,
        'positif': positif,
        'negatif': negatif,
        'netral': netral
    }
def get_trend_data():
    prediksi_list = Prediksi.query.order_by(Prediksi.waktu.asc()).all()
    if not prediksi_list:
        return {'labels': [], 'positif': [], 'negatif': [], 'netral': []}
    trend = {}
    for p in prediksi_list:
        waktu_wib = p.waktu
        if waktu_wib.tzinfo is None:
            waktu_wib = pytz.utc.localize(waktu_wib).astimezone(pytz.timezone('Asia/Jakarta'))
        tanggal = waktu_wib.strftime('%d %b')
        if tanggal not in trend:
            trend[tanggal] = {'positif': 0, 'negatif': 0, 'netral': 0}
        trend[tanggal][p.sentimen] += 1
    return {
        'labels': list(trend.keys()),
        'positif': [t['positif'] for t in trend.values()],
        'negatif': [t['negatif'] for t in trend.values()],
        'netral': [t['netral'] for t in trend.values()]
    }
def generate_wordcloud(sentimen_filter=None):
    query = Prediksi.query
    if sentimen_filter:
        query = query.filter_by(sentimen=sentimen_filter)
    teks_list = query.with_entities(Prediksi.teks_bersih).all()
    if not teks_list:
        return None
    all_text = ' '.join([t[0] for t in teks_list if t[0]])
    if not all_text.strip():
        return None
    wc = WordCloud(
        width=800, height=400,
        background_color='white',
        colormap='viridis',
        max_words=50,
        font_path=None
    ).generate(all_text)
    img = io.BytesIO()
    wc.to_image().save(img, format='PNG')
    img.seek(0)
    return base64.b64encode(img.getvalue()).decode()
def generate_pie_chart():
    stats = get_stats()
    if stats['total'] == 0:
        return None
    plt.style.use('dark_background')
    fig, ax = plt.subplots(figsize=(6, 6))
    fig.patch.set_alpha(0)
    ax.patch.set_alpha(0)
    labels = ['Positif', 'Netral', 'Negatif']
    sizes = [stats['positif'], stats['netral'], stats['negatif']]
    colors = ['#10b981', '#3b82f6', '#ef4444']
    explode = (0.05, 0.05, 0.05)
    wedges, texts, autotexts = ax.pie(
        sizes, explode=explode, labels=labels, colors=colors,
        autopct='%1.1f%%', startangle=90,
        textprops={'color': '#f1f5f9', 'fontsize': 13, 'fontweight': '600'},
        pctdistance=0.75
    )
    for autotext in autotexts:
        autotext.set_color('#ffffff')
        autotext.set_fontsize(14)
        autotext.set_fontweight('700')
    for text in texts:
        text.set_color('#cbd5e1')
        text.set_fontsize(13)
    ax.set_title('Distribusi Sentimen', fontsize=15, fontweight='700', color='#f1f5f9', pad=20)
    img = io.BytesIO()
    plt.savefig(img, format='PNG', dpi=150, bbox_inches='tight', transparent=True, facecolor=fig.get_facecolor())
    img.seek(0)
    plt.close(fig)
    return base64.b64encode(img.getvalue()).decode()
@app.route('/')
def index():
    stats = get_stats()
    return render_template('index.html', 
                         model_ready=model_loaded, 
                         stats=stats)
@app.route('/predict', methods=['POST'])
def predict():
    teks = request.form.get('teks', '').strip()
    if not teks:
        return jsonify({'error': 'Masukkan teks terlebih dahulu!'}), 400
    if len(teks) < 5:
        return jsonify({'error': 'Teks minimal 5 karakter!'}), 400
    if not model_loaded:
        return jsonify({'error': 'Model AI belum tersedia!'}), 500
    hasil, error = predict_sentiment(teks)
    if error:
        return jsonify({'error': error}), 500
    try:
        prediksi = Prediksi(
            teks_asli=str(teks),
            teks_bersih=str(hasil['teks_bersih']),
            sentimen=str(hasil['sentimen']),
            prob_positif=float(hasil['probabilitas'].get('positif', 0.0)),
            prob_netral=float(hasil['probabilitas'].get('netral', 0.0)),
            prob_negatif=float(hasil['probabilitas'].get('negatif', 0.0)),
            kata_kunci=json.dumps(hasil['kata_kunci'], ensure_ascii=False),
            waktu=get_wib_time()
        )
        db.session.add(prediksi)
        db.session.commit()
    except Exception as db_err:
        db.session.rollback()
        print(f"DB save warning: {db_err}")
    return jsonify(hasil)
@app.route('/upload-csv', methods=['POST'])
def upload_csv():
    if 'file' not in request.files:
        return jsonify({'error': 'Tidak ada file yang diupload!'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'File kosong!'}), 400
    if not file.filename.endswith('.csv'):
        return jsonify({'error': 'Hanya file CSV yang diterima!'}), 400
    if not model_loaded:
        return jsonify({'error': 'Model AI belum tersedia!'}), 500
    try:
        df = pd.read_csv(file)
        kolom_teks = None
        for col in ['teks', 'aspirasi', 'text', 'kalimat', 'pesan']:
            if col in df.columns:
                kolom_teks = col
                break
        if kolom_teks is None:
            kolom_teks = df.columns[0]
        hasil_list = []
        for teks in df[kolom_teks].astype(str):
            if len(teks.strip()) >= 5:
                hasil, _ = predict_sentiment(teks.strip())
                if hasil:
                    try:
                        prediksi = Prediksi(
                            teks_asli=str(teks.strip()),
                            teks_bersih=str(hasil['teks_bersih']),
                            sentimen=str(hasil['sentimen']),
                            prob_positif=float(hasil['probabilitas'].get('positif', 0.0)),
                            prob_netral=float(hasil['probabilitas'].get('netral', 0.0)),
                            prob_negatif=float(hasil['probabilitas'].get('negatif', 0.0)),
                            kata_kunci=json.dumps(hasil['kata_kunci'], ensure_ascii=False),
                            waktu=get_wib_time()
                        )
                        db.session.add(prediksi)
                    except Exception:
                        pass
                    hasil_list.append({
                        'teks': teks.strip()[:100],
                        'sentimen': hasil['sentimen'],
                        'positif': float(hasil['probabilitas'].get('positif', 0.0)),
                        'netral': float(hasil['probabilitas'].get('netral', 0.0)),
                        'negatif': float(hasil['probabilitas'].get('negatif', 0.0))
                    })
        try:
            db.session.commit()
        except Exception as db_err:
            db.session.rollback()
            print(f"DB batch save warning: {db_err}")
        return jsonify({
            'success': True,
            'total': len(hasil_list),
            'data': hasil_list
        })
    except Exception as e:
        return jsonify({'error': f'Gagal membaca CSV: {str(e)}'}), 400
@app.route('/download-hasil-csv', methods=['POST'])
def download_hasil_csv():
    data = request.get_json()
    if not data or 'rows' not in data:
        return jsonify({'error': 'Tidak ada data untuk didownload'}), 400
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Teks', 'Sentimen', 'Positif (%)', 'Netral (%)', 'Negatif (%)'])
    for row in data['rows']:
        writer.writerow([
            row.get('teks', ''),
            row.get('sentimen', ''),
            row.get('positif', 0),
            row.get('netral', 0),
            row.get('negatif', 0)
        ])
    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=hasil_upload_csv.csv'}
    )
@app.route('/download-hasil')
def download_hasil():
    prediksi_list = Prediksi.query.order_by(Prediksi.waktu.desc()).limit(100).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Teks', 'Sentimen', 'Positif (%)', 'Netral (%)', 'Negatif (%)', 'Kata Kunci', 'Waktu (WIB)'])
    for p in prediksi_list:
        waktu_wib = p.waktu
        if waktu_wib.tzinfo is None:
            waktu_wib = pytz.utc.localize(waktu_wib).astimezone(pytz.timezone('Asia/Jakarta'))
        writer.writerow([
            p.teks_asli, p.sentimen, p.prob_positif, p.prob_netral, 
            p.prob_negatif, p.kata_kunci, waktu_wib.strftime('%Y-%m-%d %H:%M:%S WIB')
        ])
    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=hasil_prediksi.csv'}
    )
@app.route('/dashboard')
def dashboard():
    stats = get_stats()
    trend = get_trend_data()
    pie_chart = generate_pie_chart()
    wordcloud_positif = generate_wordcloud('positif')
    wordcloud_negatif = generate_wordcloud('negatif')
    wordcloud_netral = generate_wordcloud('netral')
    return render_template('dashboard.html',
                         stats=stats,
                         trend=trend,
                         pie_chart=pie_chart,
                         wordcloud_positif=wordcloud_positif,
                         wordcloud_negatif=wordcloud_negatif,
                         wordcloud_netral=wordcloud_netral)
@app.route('/api/stats')
def api_stats():
    stats = get_stats()
    trend = get_trend_data()
    return jsonify({
        'stats': stats,
        'trend': trend
    })
@app.route('/riwayat')
def riwayat():
    prediksi_list = Prediksi.query.order_by(Prediksi.waktu.desc()).all()
    return render_template('riwayat.html', prediksi_list=prediksi_list)
@app.route('/metode')
def metode():
    akurasi = 0
    precision = 0
    recall = 0
    f1 = 0
    total_data = 0
    history_file = os.path.join(DATA_DIR, 'training_history.csv')
    if os.path.exists(history_file):
        try:
            df = pd.read_csv(history_file)
            if len(df) > 0:
                last = df.iloc[-1]
                akurasi = round(float(last.get('accuracy', 0)), 2)
                precision = round(float(last.get('precision', akurasi)), 2)
                recall = round(float(last.get('recall', akurasi)), 2)
                f1 = round(float(last.get('f1_score', akurasi)), 2)
                total_data = int(last.get('total_data', 0))
        except Exception:
            pass
    return render_template('metode.html',
                         akurasi=akurasi,
                         precision=precision,
                         recall=recall,
                         f1=f1,
                         total_data=total_data)
@app.errorhandler(404)
def page_not_found(e):
    return render_template('base.html', content='''
        <div style="text-align:center; padding:50px;">
            <h1>404</h1>
            <p>Halaman tidak ditemukan</p>
            <a href="/">← Kembali ke Beranda</a>
        </div>
    '''), 404
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8082)
