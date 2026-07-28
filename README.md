# Sentimen AI - Sistem Analisis Sentimen Aspirasi (Website Final)

**Sentimen AI** adalah aplikasi berbasis web (Flask) yang menggunakan teknologi *Natural Language Processing* (NLP) dan *Machine Learning* untuk menganalisis sentimen teks berbahasa Indonesia (Positif, Netral, dan Negatif). Aplikasi ini dirancang untuk menganalisis aspirasi, ulasan, atau pesan baik secara tunggal maupun massal melalui file CSV.

---

## 🛠️ Persyaratan Sistem (Prerequisites)

Sebelum melakukan instalasi, pastikan sistem Anda telah terinstal:
* **Python**: Versi 3.8 hingga 3.12 (Disarankan Python 3.10 / 3.11).
* **Pip**: Package manager untuk Python (biasanya sudah bawaan saat instal Python).
* **Koneksi Internet**: Dibutuhkan saat instalasi library dan pertama kali menjalankan aplikasi untuk mengunduh corpus NLTK (punkt & stopwords).

---

## 📥 Cara Instalasi

### 1. Masuk ke Direktori Proyek
Buka CMD atau PowerShell, lalu arahkan ke dalam folder proyek ini:
```bash
cd "c:\Users\Lenovo\Documents\Tugas Kuliah\Kecerdasan Buatan\folder final projek ai\sentimen-AI (Website final)"
```

### 2. Buat Virtual Environment (Opsional, sangat disarankan)
Agar library tidak bentrok dengan proyek Python lainnya, buat virtual environment:
* **Pada Windows:**
  ```bash
  python -m venv venv
  .\venv\Scripts\activate
  ```
* **Pada Linux / macOS:**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```
*(Jika berhasil aktif, akan muncul tanda `(venv)` di sebelah kiri prompt terminal Anda).*

### 3. Instal Dependensi Library
Jalankan perintah berikut untuk menginstal seluruh library yang dibutuhkan (Flask, SQLAlchemy, Pandas, Scikit-Learn, NLTK, Sastrawi, dll.):
```bash
pip install -r requirements.txt
```

---

## 🚀 Cara Menjalankan Aplikasi

1. Pastikan Anda berada di dalam folder proyek (dan virtual environment sudah aktif jika menggunakannya).
2. Jalankan perintah:
   ```bash
   python app.py
   ```
3. Tunggu beberapa saat hingga muncul indikator bahwa server Flask telah berjalan:
   ```text
    * Running on all addresses (0.0.0.0)
    * Running on http://127.0.0.1:8082
    * Running on http://<IP-Lokal>:8082
   ```
4. Buka browser (Chrome, Edge, Firefox, dll) dan akses alamat:
   👉 **http://localhost:8082** atau **http://127.0.0.1:8082**

---

## 💡 Panduan Penggunaan

### 1. Analisis Sentimen Teks Tunggal (Beranda / `/`)
* Pada halaman utama, ketik atau tempel (paste) teks aspirasi, ulasan, atau masukan pada kotak teks yang tersedia.
* Klik tombol **Analisis** atau **Prediksi**.
* Hasil analisis akan langsung ditampilkan berupa:
  * **Label Sentimen** (Positif, Netral, atau Negatif).
  * **Probabilitas Sentimen** dalam persentase.
  * **Kata Kunci (Keywords)** yang terdeteksi dalam teks.

### 2. Analisis Massal / Batch Upload CSV (`/upload-csv`)
* Gunakan fitur upload file jika Anda memiliki ratusan atau ribuan data teks yang ingin dianlisis sekaligus.
* **Format File CSV:**
  * File harus bertipe `.csv`.
  * Pastikan terdapat header kolom bernama salah satu dari berikut: `teks`, `aspirasi`, `text`, `kalimat`, atau `pesan`. *(Jika tidak ada nama kolom tersebut, aplikasi secara otomatis akan membaca kolom pertama sebagai teks)*.
* Setelah upload selesai, sistem akan memproses seluruh baris dan menampilkan ringkasan hasilnya.

### 3. Mengunduh Hasil Analisis (`/download-hasil` atau `/download-hasil-csv`)
* Hasil prediksi yang telah diproses (baik tunggal maupun massal) disimpan di dalam database SQLite (`instance/sentimen.db`).
* Anda dapat mengunduh seluruh data riwayat tersebut dalam format file **CSV** atau **Excel** untuk kebutuhan pembuatan laporan atau analisis lanjutan.

### 4. Dashboard Statistik & Visualisasi (`/dashboard`)
* Akses halaman **Dashboard** melalui menu navigasi atas.
* Pada halaman ini Anda dapat melihat:
  * Distribusi persentase sentimen (Grafik Pie / Bar Chart).
  * **WordCloud**: Visualisasi kata-kata yang paling sering muncul dari seluruh aspirasi yang masuk.
  * Statistik ringkas mengenai tren masukan dari pengguna.

### 5. Riwayat Prediksi (`/riwayat`)
* Menampilkan tabel berisi riwayat analisis sentimen sebelumnya yang sudah diurutkan dari waktu terbaru.
* Menampilkan teks asli, teks bersih (hasil preprocessing), sentimen, serta waktu analisis.

### 6. Informasi Evaluasi Model (`/metode`)
* Menampilkan penjelasan mengenai metode *Machine Learning* yang digunakan beserta metrik performa model (Akurasi, Precision, Recall, dan F1-Score) berdasarkan data pelatihan yang tersimpan di `data/training_history.csv`.

---

## 📁 Struktur Folder Proyek

```text
sentimen-AI (Website final)/
├── app.py                 # File utama aplikasi web Flask
├── requirements.txt       # Daftar dependensi library Python
├── README.md              # Dokumentasi & panduan penggunaan proyek
├── data/                  # Folder model ML & dataset training
│   ├── model_sentimen.pkl # Model klasifikasi sentimen yang telah dilatih
│   ├── vectorizer.pkl     # Pembobot kata (TF-IDF Vectorizer)
│   ├── label_mapping.pkl  # Pemetaan label sentimen
│   └── training_history.csv # Catatan evaluasi performa model
├── instance/              # Folder penyimpanan database lokal SQLite
│   └── sentimen.db        # Database riwayat prediksi
├── static/                # Aset statis web
│   ├── style.css          # Desain tampilan CSS
│   ├── script.js          # Logika interaktif JavaScript
│   └── images/            # File gambar dan ikon
├── templates/             # File tampilan HTML (Jinja2)
│   ├── base.html          # Kerangka dasar layout web
│   ├── index.html         # Halaman beranda & input teks
│   ├── dashboard.html     # Halaman grafik & WordCloud
│   ├── riwayat.html       # Halaman tabel riwayat prediksi
│   └── metode.html        # Halaman informasi model & akurasi
└── uploads/               # Direktori sementara untuk upload file CSV
```

---

## ⚠️ Catatan Paling Penting
* Pada saat pertama kali `app.py` dijalankan, library `nltk` akan mengunduh corpus (`punkt`, `punkt_tab`, dan `stopwords`). Pastikan komputer terhubung ke internet saat jalankan pertama kali.
* Jika sewaktu-waktu terjadi error *"Model AI belum tersedia"*, pastikan file di dalam folder `data/` (`model_sentimen.pkl`, `vectorizer.pkl`, dll.) tidak terhapus atau dipindahkan.
