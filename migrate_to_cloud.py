"""
Script untuk menyalin data riwayat dari SQLite lokal (instance/sentimen.db)
ke Cloud Database PostgreSQL (Supabase / Neon).

Cara penggunaan:
  python migrate_to_cloud.py "postgresql://user:password@host/dbname"
"""
import sys
import os
import sqlite3
from datetime import datetime

def migrate():
    target_url = None
    if len(sys.argv) > 1:
        target_url = sys.argv[1].strip()
    else:
        target_url = os.environ.get('DATABASE_URL')

    if not target_url:
        print("❌ Error: Harap masukkan URL koneksi database PostgreSQL!")
        print("Contoh:")
        print('  python migrate_to_cloud.py "postgresql://postgres:password@db.supabase.co:5432/postgres"')
        return

    if target_url.startswith('postgres://'):
        target_url = target_url.replace('postgres://', 'postgresql://', 1)

    sqlite_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'sentimen.db')
    if not os.path.exists(sqlite_path):
        sqlite_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sentimen.db')

    if not os.path.exists(sqlite_path):
        print(f"❌ File SQLite lokal tidak ditemukan di {sqlite_path}")
        return

    print(f"📖 Membaca data dari SQLite: {sqlite_path}")
    conn_sqlite = sqlite3.connect(sqlite_path)
    cursor_sqlite = conn_sqlite.cursor()

    try:
        cursor_sqlite.execute("SELECT teks_asli, teks_bersih, sentimen, prob_positif, prob_netral, prob_negatif, kata_kunci, waktu FROM prediksi")
        rows = cursor_sqlite.fetchall()
        print(f"🔍 Total {len(rows)} data ditemukan di SQLite lokal.")
    except Exception as e:
        print(f"❌ Error membaca SQLite: {e}")
        return
    finally:
        conn_sqlite.close()

    if not rows:
        print("ℹ️ Tidak ada data yang perlu dimigrasi.")
        return

    os.environ['DATABASE_URL'] = target_url
    from app import app, db, Prediksi

    with app.app_context():
        print("⚡ Menghubungkan ke PostgreSQL Cloud...")
        db.create_all()

        count = 0
        for r in rows:
            waktu_val = datetime.now()
            if r[7]:
                try:
                    waktu_val = datetime.fromisoformat(str(r[7]))
                except Exception:
                    pass

            p = Prediksi(
                teks_asli=r[0],
                teks_bersih=r[1],
                sentimen=r[2],
                prob_positif=r[3] or 0.0,
                prob_netral=r[4] or 0.0,
                prob_negatif=r[5] or 0.0,
                kata_kunci=r[6],
                waktu=waktu_val
            )
            db.session.add(p)
            count += 1

        db.session.commit()
        print(f"🎉 SUKSES! Sebanyak {count} data berhasil dimigrasikan ke Cloud Database.")

if __name__ == '__main__':
    migrate()
