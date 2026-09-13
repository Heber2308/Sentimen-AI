-- Tabel aspirasi dengan struktur lengkap untuk ST Bhinneka
-- Jalankan di Supabase SQL Editor

-- Tipe enumerasi untuk status aspirasi
CREATE TYPE aspirasi_status AS ENUM (
  'baru',
  'ditinjau',
  'diproses',
  'selesai',
  'ditolak'
);

-- Tipe enumerasi untuk urgensi
CREATE TYPE aspirasi_urgensi AS ENUM (
  'rendah',
  'normal',
  'tinggi',
  'mendesak'
);

-- Tipe enumerasi untuk unit tujuan
CREATE TYPE aspirasi_unit AS ENUM (
  'akademik',
  'fasilitas',
  'keuangan',
  'kemahasiswaan',
  'lainnya'
);

-- Tabel aspirasi (menggantikan prediksi)
CREATE TABLE aspirasi (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  
  -- Identitas pengirim
  user_id UUID NOT NULL REFERENCES auth.users(id),
  email_pengirim TEXT,
  anonim BOOLEAN DEFAULT FALSE,
  
  -- Konten aspirasi
  teks_asli TEXT NOT NULL,
  teks_bersih TEXT,
  
  -- Sentimen (hasil AI)
  sentimen TEXT CHECK (sentimen IN ('positif', 'netral', 'negatif')),
  prob_positif NUMERIC(5, 2) DEFAULT 0,
  prob_netral NUMERIC(5, 2) DEFAULT 0,
  prob_negatif NUMERIC(5, 2) DEFAULT 0,
  kata_kunci TEXT[],
  
  -- Kategori aspirasi
  unit aspirasi_unit NOT NULL DEFAULT 'lainnya',
  urgensi aspirasi_urgensi NOT NULL DEFAULT 'normal',
  
  -- Status tindak lanjut
  status aspirasi_status NOT NULL DEFAULT 'baru',
  pic_unit UUID REFERENCES auth.users(id),
  catatan_admin TEXT,
  tanggal_selesai TIMESTAMPTZ,
  
  -- Metadata
  nomor_tiket TEXT UNIQUE,
  waktu_dibuat TIMESTAMPTZ DEFAULT NOW(),
  waktu_diubah TIMESTAMPTZ DEFAULT NOW(),
  
  -- Waktu komitmen SLA (berdasarkan urgensi)
  sla_deadline TIMESTAMPTZ
);

-- Index untuk performa query
CREATE INDEX idx_aspirasi_user_id ON aspirasi(user_id);
CREATE INDEX idx_aspirasi_status ON aspirasi(status);
CREATE INDEX idx_aspirasi_unit ON aspirasi(unit);
CREATE INDEX idx_aspirasi_urgensi ON aspirasi(urgensi);
CREATE INDEX idx_aspirasi_waktu_dibuat ON aspirasi(waktu_dibuat DESC);
CREATE INDEX idx_aspirasi_nomor_tiket ON aspirasi(nomor_tiket);

-- Tabel log riwayat perubahan status
CREATE TABLE aspirasi_log (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  aspirasi_id BIGINT NOT NULL REFERENCES aspirasi(id) ON DELETE CASCADE,
  status_lama aspirasi_status,
  status_baru aspirasi_status NOT NULL,
  catatan TEXT,
  diubah_oleh UUID REFERENCES auth.users(id),
  waktu_perubahan TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aspirasi_log_aspirasi_id ON aspirasi_log(aspirasi_id);

-- Tabel profil pengguna (menyimpan role dan unit)
CREATE TABLE profil_pengguna (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  nama_lengkap TEXT,
  role TEXT NOT NULL CHECK (role IN ('mahasiswa', 'admin_unit', 'superadmin')) DEFAULT 'mahasiswa',
  unit aspirasi_unit,
  foto_profil TEXT,
  waktu_dibuat TIMESTAMPTZ DEFAULT NOW(),
  waktu_diubah TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel konfigurasi SLA per urgensi
CREATE TABLE sla_config (
  urgensi aspirasi_urgensi PRIMARY KEY,
  jam_target INTEGER NOT NULL, -- dalam jam
  deskripsi TEXT
);

-- Insert konfigurasi SLA default
INSERT INTO sla_config (urgensi, jam_target, deskripsi) VALUES
  ('rendah', 168, '1 minggu'),
  ('normal', 72, '3 hari'),
  ('tinggi', 24, '1 hari'),
  ('mendesak', 4, '4 jam');

-- Enable RLS (Row Level Security)
ALTER TABLE aspirasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE aspirasi_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE profil_pengguna ENABLE ROW LEVEL SECURITY;

-- Policy: Mahasiswa hanya bisa lihat aspirasi mereka sendiri
CREATE POLICY aspirasi_mahasiswa_select ON aspirasi
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    (SELECT role FROM profil_pengguna WHERE user_id = auth.uid()) IN ('admin_unit', 'superadmin')
  );

-- Policy: Mahasiswa hanya bisa membuat aspirasi untuk diri sendiri
CREATE POLICY aspirasi_mahasiswa_insert ON aspirasi
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admin dan superadmin bisa update aspirasi sesuai unit mereka
CREATE POLICY aspirasi_admin_update ON aspirasi
  FOR UPDATE
  USING (
    (SELECT role FROM profil_pengguna WHERE user_id = auth.uid()) = 'superadmin' OR
    (
      (SELECT role FROM profil_pengguna WHERE user_id = auth.uid()) = 'admin_unit' AND
      unit = (SELECT unit FROM profil_pengguna WHERE user_id = auth.uid())
    )
  );

-- Function untuk generate nomor tiket otomatis
CREATE OR REPLACE FUNCTION generate_nomor_tiket()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ASP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('aspirasi_id_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk generate nomor tiket saat insert
CREATE OR REPLACE FUNCTION trigger_generate_nomor_tiket()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nomor_tiket IS NULL THEN
    NEW.nomor_tiket := 'ASP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEW.id::TEXT, 5, '0');
  END IF;
  NEW.sla_deadline := NOW() + (
    SELECT INTERVAL '1 hour' * jam_target FROM sla_config WHERE urgensi = NEW.urgensi
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER aspirasi_generate_nomor_tiket
BEFORE INSERT ON aspirasi
FOR EACH ROW
EXECUTE FUNCTION trigger_generate_nomor_tiket();

-- Trigger untuk log perubahan status
CREATE OR REPLACE FUNCTION trigger_log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO aspirasi_log (aspirasi_id, status_lama, status_baru, diubah_oleh)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  NEW.waktu_diubah := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER aspirasi_log_status_change
BEFORE UPDATE ON aspirasi
FOR EACH ROW
EXECUTE FUNCTION trigger_log_status_change();
