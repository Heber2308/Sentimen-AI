# Setup Suara Kampus ST Bhinneka

## Tahap 1: Konfigurasi Supabase

### 1.1 Persiapan Database
1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Buka SQL Editor dan jalankan file `SCHEMA_ASPIRASI.sql` untuk membuat tabel dan struktur data baru
3. Setelah sukses, tabel berikut akan tersedia:
   - `aspirasi` - Menyimpan semua aspirasi
   - `aspirasi_log` - Riwayat perubahan status
   - `profil_pengguna` - Data user dengan role dan unit

### 1.2 Setup Authentication
1. Di Supabase, buka **Authentication > Settings**
2. Aktifkan **Email** provider
3. Di bagian "Email Templates", pastikan custom email validation mengecek domain `@students.satyaterrabhinneka.ac.id`
4. Jika perlu, setup [Email Templates Custom](https://supabase.com/docs/guides/auth/custom-email-templates)

### 1.3 Konfigurasi Environment
1. Copy `.env.example` ke `.env.local`
2. Isi dengan credential Supabase:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Setup email kampus domain untuk validasi (opsional tapi recommended)

## Tahap 2: Migrasi Data (Opsional)

Jika sudah ada data aspirasi di table `prediksi` lama, migrate ke table `aspirasi` baru:

```sql
INSERT INTO aspirasi (user_id, email_pengirim, teks_asli, teks_bersih, sentimen, 
                       prob_positif, prob_netral, prob_negatif, kata_kunci, 
                       unit, urgensi, status, waktu_dibuat)
SELECT 
  gen_random_uuid() as user_id,
  NULL as email_pengirim,
  teks_asli,
  teks_bersih,
  sentimen,
  prob_positif,
  prob_netral,
  prob_negatif,
  kata_kunci::text[],
  'lainnya'::aspirasi_unit,
  'normal'::aspirasi_urgensi,
  'baru'::aspirasi_status,
  waktu
FROM prediksi;
```

## Tahap 3: Setup Admin & Role

Jalankan script untuk membuat user admin awal:

```sql
-- Insert user admin (ganti dengan email yang sesuai)
INSERT INTO auth.users (email, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
VALUES (
  'admin@satyaterrabhinneka.ac.id',
  NOW(),
  '{"name": "Administrator"}',
  '{}',
  NOW(),
  NOW()
);

-- Setup profil admin
INSERT INTO profil_pengguna (user_id, nama_lengkap, role, unit)
SELECT id, 'Administrator', 'superadmin', NULL
FROM auth.users WHERE email = 'admin@satyaterrabhinneka.ac.id';
```

## Tahap 4: Deploy & Testing

1. **Build dan test lokal:**
   ```bash
   npm run build
   npm run dev
   ```

2. **Deploy ke Vercel:**
   ```bash
   git add .
   git commit -m "Setup auth dan schema aspirasi ST Bhinneka"
   git push origin main
   ```

3. **Test fitur:**
   - Login dengan email kampus
   - Kirim aspirasi baru
   - Cek nomor tiket auto-generate
   - Admin lihat dashboard aspirasi

## Struktur Status Aspirasi & SLA

| Status | Deskripsi | SLA |
|--------|-----------|-----|
| **Baru** | Aspirasi baru yang belum ditinjau | - |
| **Ditinjau** | Sudah dibaca admin, dalam proses klasifikasi | 4 jam (mendesak) - 1 minggu (rendah) |
| **Diproses** | Ada tindakan nyata sedang berlangsung | Sesuai SLA urgensi |
| **Selesai** | Aspirasi sudah ditindaklanjuti | Harus ≤ SLA deadline |
| **Ditolak** | Aspirasi tidak valid atau di luar ruang lingkup | - |

## Struktur Unit Aspirasi

- **Akademik** - Terkait proses belajar, kurikulum, dosen, ruang kelas
- **Fasilitas** - Terkait kondisi fisik, ruang, perpustakaan, lab, WiFi, toilet
- **Keuangan** - Terkait pembayaran, beasiswa, UKT, SPP
- **Kemahasiswaan** - Terkait aktivitas, organisasi, kegiatan
- **Lainnya** - Kategori lain yang tidak masuk di atas

## Kebijakan Aspirasi Anonim

- Mahasiswa bisa memilih menyampaikan aspirasi secara anonim
- Jika anonim, nama dan identitas tidak akan ditampilkan
- Email pengirim tetap tersimpan di database untuk verifikasi jika ada tindak lanjut sensitif
- Admin tetap bisa melihat identitas asli jika diperlukan untuk follow-up

## Kontakt & Support

Untuk issue teknis atau pertanyaan, hubungi: dev-team@satyaterrabhinneka.ac.id
