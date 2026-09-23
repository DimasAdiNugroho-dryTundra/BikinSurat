use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use uuid::Uuid;

pub struct DbState {
    pub conn: Mutex<Connection>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSetting {
    pub kunci: String,
    pub nilai: String,
    pub deskripsi: Option<String>,
    pub diperbarui_pada: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VariableItem {
    pub id: String,
    pub templat_id: String,
    pub kunci_variabel: String,
    pub label_input: String,
    pub tipe_variabel: String,
    pub wajib_diisi: bool,
    pub nilai_bawaan: Option<String>,
    pub konfigurasi_json: Option<String>,
    pub urutan_tampil: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateItem {
    pub id: String,
    pub judul: String,
    pub deskripsi: Option<String>,
    pub kategori: String,
    pub konten_json: String,
    pub konten_html: String,
    pub ukuran_kertas: String,
    pub orientasi: String,
    pub margin_atas_mm: i32,
    pub margin_bawah_mm: i32,
    pub margin_kiri_mm: i32,
    pub margin_kanan_mm: i32,
    pub kop_surat_html: Option<String>,
    pub catatan_kaki_html: Option<String>,
    pub apakah_favorit: bool,
    pub pola_penomoran: Option<String>,
    pub counter_terakhir: i32,
    pub apakah_draf: Option<bool>,
    pub tahun_penomoran: Option<i32>,
    pub dibuat_pada: String,
    pub diperbarui_pada: String,
    pub variabel: Option<Vec<VariableItem>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentHistoryItem {
    pub id: String,
    pub templat_id: String,
    pub nomor_surat: Option<String>,
    pub judul_dokumen: String,
    pub nama_penerima: Option<String>,
    pub nilai_isian_json: String,
    pub hasil_pratinjau_html: Option<String>,
    pub format_ekspor: String,
    pub lokasi_berkas: Option<String>,
    pub dibuat_pada: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DraftItem {
    pub id: String,
    pub templat_id: String,
    pub judul_draf: String,
    pub nilai_isian_json: String,
    pub hasil_pratinjau_html: Option<String>,
    pub dibuat_pada: String,
    pub diperbarui_pada: String,
}

pub fn get_db_path() -> PathBuf {
    let base_dir = dirs_or_fallback();
    let db_dir = base_dir.join("database");
    let _ = fs::create_dir_all(&db_dir);
    db_dir.join("basisdata_bikinsurat.db")
}

fn dirs_or_fallback() -> PathBuf {
    if let Some(app_data) = std::env::var_os("APPDATA") {
        PathBuf::from(app_data).join("com.bikinsurat.desktop")
    } else if let Some(home) = std::env::var_os("HOME") {
        PathBuf::from(home).join(".config").join("com.bikinsurat.desktop")
    } else {
        PathBuf::from(".").join("app_data")
    }
}

pub fn init_db() -> Result<Connection, rusqlite::Error> {
    let db_path = get_db_path();
    let conn = Connection::open(db_path)?;

    // Set Pragmas for performance and integrity
    conn.execute_batch(
        "PRAGMA journal_mode = WAL;
         PRAGMA foreign_keys = ON;
         PRAGMA encoding = 'UTF-8';",
    )?;

    // DDL Tables
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS pengaturan_aplikasi (
            kunci TEXT PRIMARY KEY NOT NULL,
            nilai TEXT NOT NULL,
            deskripsi TEXT,
            diperbarui_pada DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS templat_surat (
            id TEXT PRIMARY KEY NOT NULL,
            judul TEXT NOT NULL,
            deskripsi TEXT,
            kategori TEXT NOT NULL DEFAULT 'Umum',
            konten_json TEXT NOT NULL,
            konten_html TEXT NOT NULL,
            ukuran_kertas TEXT NOT NULL DEFAULT 'A4',
            orientasi TEXT NOT NULL DEFAULT 'PORTRAIT',
            margin_atas_mm INTEGER NOT NULL DEFAULT 25,
            margin_bawah_mm INTEGER NOT NULL DEFAULT 20,
            margin_kiri_mm INTEGER NOT NULL DEFAULT 25,
            margin_kanan_mm INTEGER NOT NULL DEFAULT 20,
            kop_surat_html TEXT,
            catatan_kaki_html TEXT,
            apakah_favorit INTEGER NOT NULL DEFAULT 0,
            pola_penomoran TEXT,
            counter_terakhir INTEGER NOT NULL DEFAULT 0,
            dibuat_pada DATETIME DEFAULT CURRENT_TIMESTAMP,
            diperbarui_pada DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS variabel_surat (
            id TEXT PRIMARY KEY NOT NULL,
            templat_id TEXT NOT NULL,
            kunci_variabel TEXT NOT NULL,
            label_input TEXT NOT NULL,
            tipe_variabel TEXT NOT NULL,
            wajib_diisi INTEGER NOT NULL DEFAULT 1,
            nilai_bawaan TEXT,
            konfigurasi_json TEXT,
            urutan_tampil INTEGER NOT NULL DEFAULT 0,
            dibuat_pada DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (templat_id) REFERENCES templat_surat(id) ON DELETE CASCADE,
            CONSTRAINT uq_templat_kunci_variabel UNIQUE (templat_id, kunci_variabel)
        );

        CREATE TABLE IF NOT EXISTS riwayat_dokumen (
            id TEXT PRIMARY KEY NOT NULL,
            templat_id TEXT NOT NULL,
            nomor_surat TEXT,
            judul_dokumen TEXT NOT NULL,
            nama_penerima TEXT,
            nilai_isian_json TEXT NOT NULL,
            hasil_pratinjau_html TEXT,
            format_ekspor TEXT NOT NULL,
            lokasi_berkas TEXT,
            dibuat_pada DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (templat_id) REFERENCES templat_surat(id) ON DELETE RESTRICT
        );

        CREATE TABLE IF NOT EXISTS draf_surat (
            id TEXT PRIMARY KEY NOT NULL,
            templat_id TEXT NOT NULL,
            judul_draf TEXT NOT NULL,
            nilai_isian_json TEXT NOT NULL,
            hasil_pratinjau_html TEXT,
            dibuat_pada DATETIME DEFAULT CURRENT_TIMESTAMP,
            diperbarui_pada DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (templat_id) REFERENCES templat_surat(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_templat_kategori ON templat_surat(kategori);
        CREATE INDEX IF NOT EXISTS idx_templat_judul ON templat_surat(judul);
        CREATE INDEX IF NOT EXISTS idx_variabel_templat_id ON variabel_surat(templat_id);
        CREATE INDEX IF NOT EXISTS idx_riwayat_templat_id ON riwayat_dokumen(templat_id);
        CREATE INDEX IF NOT EXISTS idx_riwayat_nomor_surat ON riwayat_dokumen(nomor_surat);
        CREATE INDEX IF NOT EXISTS idx_riwayat_dibuat_pada ON riwayat_dokumen(dibuat_pada DESC);
        CREATE INDEX IF NOT EXISTS idx_draf_diperbarui_pada ON draf_surat(diperbarui_pada DESC);",
    )?;

    // Migrations for newly added columns
    let _ = conn.execute("ALTER TABLE templat_surat ADD COLUMN pola_penomoran TEXT", []);
    let _ = conn.execute("ALTER TABLE templat_surat ADD COLUMN counter_terakhir INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE templat_surat ADD COLUMN apakah_draf INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE templat_surat ADD COLUMN tahun_penomoran INTEGER NOT NULL DEFAULT 2026", []);

    // Seed Initial Data if empty
    seed_initial_data(&conn)?;

    // Update existing seeded templates with their division-specific numbering patterns
    let _ = conn.execute(
        "UPDATE templat_surat SET pola_penomoran = '{{NOMOR}}/SPT-OPS/{{BULAN_ROMAWI}}/{{TAHUN}}' WHERE id = 'tmpl-surat-tugas-001' AND (pola_penomoran IS NULL OR pola_penomoran = '')",
        [],
    );
    let _ = conn.execute(
        "UPDATE templat_surat SET pola_penomoran = '{{NOMOR}}/SKK-HRD/{{BULAN_ROMAWI}}/{{TAHUN}}' WHERE id = 'tmpl-surat-ket-kerja-002' AND (pola_penomoran IS NULL OR pola_penomoran = '')",
        [],
    );
    let _ = conn.execute(
        "UPDATE templat_surat SET pola_penomoran = '{{NOMOR}}/CUTI-HRD/{{BULAN_ROMAWI}}/{{TAHUN}}' WHERE id = 'tmpl-surat-izin-cuti-003' AND (pola_penomoran IS NULL OR pola_penomoran = '')",
        [],
    );

    // Seed Initial Data if empty
    seed_initial_data(&conn)?;

    Ok(conn)
}

fn seed_initial_data(conn: &Connection) -> Result<(), rusqlite::Error> {
    // 1. Settings Seed
    conn.execute_batch(
        "INSERT OR IGNORE INTO pengaturan_aplikasi (kunci, nilai, deskripsi) VALUES 
        ('nama_organisasi', 'PT. INOVASI MAJU BERSAMA', 'Nama Resmi Organisasi / Perusahaan'),
        ('alamat_organisasi', 'Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan', 'Alamat Lengkap Kantor'),
        ('telepon_organisasi', '(021) 555-0199', 'Nomor Telepon Resmi Kantor'),
        ('surel_organisasi', 'administrasi@inovasimaju.id', 'Alamat Surel Resmi Organisasi'),
        ('penomoran_tahun_berjalan', '2026', 'Tahun Aktif Counter Penomoran Surat'),
        ('penomoran_urutan_terakhir', '42', 'Nomor Urut Surat Terakhir yang Diterbitkan'),
        ('format_penomoran_default', '{{NOMOR}}/SK-DIR/{{BULAN_ROMAWI}}/{{TAHUN}}', 'Format Penomoran Surat Default'),
        ('tema_aplikasi', 'sistem', 'Pilihan Tema UI (terang, gelap, sistem)');",
    )?;

    // Check if templates already seeded
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM templat_surat", [], |r| r.get(0))?;
    if count == 0 {
        // Seed 1: Surat Tugas Perjalanan Dinas
        let t1_id = "tmpl-surat-tugas-001";
        let t1_html = r#"<div style="text-align: center; margin-bottom: 20px;">
  <h2 style="font-size: 16pt; font-weight: bold; margin: 0; text-decoration: underline;">SURAT PERINTAH TUGAS</h2>
  <p style="margin: 4px 0 0 0; font-size: 11pt;">Nomor: {{nomor_surat}}</p>
</div>

<p>Yang bertanda tangan di bawah ini:</p>
<table style="width: 100%; margin-left: 20px; margin-bottom: 15px; border-collapse: collapse;">
  <tr><td style="width: 180px; padding: 3px 0;">Nama Pejabat</td><td style="width: 20px;">:</td><td><strong>{{nama_pejabat}}</strong></td></tr>
  <tr><td style="padding: 3px 0;">Jabatan Pemberi Tugas</td><td>:</td><td>{{jabatan_pejabat}}</td></tr>
</table>

<p>Dengan ini memberikan penugasan dinas kepada:</p>
<table style="width: 100%; margin-left: 20px; margin-bottom: 15px; border-collapse: collapse;">
  <tr><td style="width: 180px; padding: 3px 0;">Nama Lengkap</td><td style="width: 20px;">:</td><td><strong>{{nama_pegawai}}</strong></td></tr>
  <tr><td style="padding: 3px 0;">Nomor Induk / NIK</td><td>:</td><td>{{nik_pegawai}}</td></tr>
  <tr><td style="padding: 3px 0;">Jabatan / Divisi</td><td>:</td><td>{{jabatan_pegawai}}</td></tr>
</table>

<p>Untuk melaksanakan agenda perjalanan dinas kedinasan dengan rincian kegiatan:</p>
<table style="width: 100%; margin-left: 20px; margin-bottom: 15px; border-collapse: collapse;">
  <tr><td style="width: 180px; padding: 3px 0;">Keperluan Tugas</td><td style="width: 20px;">:</td><td>{{tujuan_penugasan}}</td></tr>
  <tr><td style="padding: 3px 0;">Kota / Lokasi Tujuan</td><td>:</td><td>{{kota_tujuan}}</td></tr>
  <tr><td style="padding: 3px 0;">Tanggal Berangkat</td><td>:</td><td>{{tanggal_berangkat}}</td></tr>
  <tr><td style="padding: 3px 0;">Tanggal Selesai</td><td>:</td><td>{{tanggal_kembali}}</td></tr>
</table>

<p>Demikian surat tugas ini dibuat agar dapat dilaksanakan dengan penuh tanggung jawab dan menyampaikan laporan tertulis setelah pelaksanaan tugas selesai.</p>

<div style="margin-top: 40px; float: right; width: 250px; text-align: center;">
  <p>Ditetapkan di: {{kota_terbit}}, {{tanggal_terbit}}</p>
  <p style="margin-bottom: 60px;">Pemberi Perintah Tugas,</p>
  <p style="font-weight: bold; text-decoration: underline;">{{nama_pejabat}}</p>
  <p>{{jabatan_pejabat}}</p>
</div>"#;

        conn.execute(
            "INSERT INTO templat_surat (
                id, judul, deskripsi, kategori, konten_json, konten_html, 
                ukuran_kertas, orientasi, margin_atas_mm, margin_bawah_mm, margin_kiri_mm, margin_kanan_mm, apakah_favorit
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, 1)",
            params![
                t1_id,
                "Surat Perintah Tugas (SPT)",
                "Surat penugasan kedinasan resmi karyawan untuk perjalanan luar kantor",
                "Operasional",
                "{}",
                t1_html,
                "A4",
                "PORTRAIT",
                25,
                20,
                25,
                20
            ],
        )?;

        let t1_vars: Vec<(&str, &str, &str, i32, Option<&str>, Option<&str>, i32)> = vec![
            ("nomor_surat", "Nomor Surat Tugas", "SYSTEM_DOC_NUMBER", 1, None, None, 1),
            ("nama_pejabat", "Nama Pemberi Tugas", "SHORT_TEXT", 1, Some("Hendra Wijaya, S.E., M.M."), None, 2),
            ("jabatan_pejabat", "Jabatan Pemberi Tugas", "SHORT_TEXT", 1, Some("Direktur Operasional"), None, 3),
            ("nama_pegawai", "Nama Pegawai yang Ditugaskan", "SHORT_TEXT", 1, None, None, 4),
            ("nik_pegawai", "NIK / NIP Pegawai", "SHORT_TEXT", 1, None, None, 5),
            ("jabatan_pegawai", "Jabatan / Divisi Pegawai", "SHORT_TEXT", 1, None, None, 6),
            ("tujuan_penugasan", "Tujuan / Keperluan Tugas", "LONG_TEXT", 1, None, None, 7),
            ("kota_tujuan", "Kota Tujuan Perjalanan", "SHORT_TEXT", 1, Some("Bandung, Jawa Barat"), None, 8),
            ("tanggal_berangkat", "Tanggal Mulai Bertugas", "DATE", 1, None, None, 9),
            ("tanggal_kembali", "Tanggal Selesai Bertugas", "DATE", 1, None, None, 10),
            ("kota_terbit", "Kota Penerbitan Surat", "SHORT_TEXT", 1, Some("Jakarta"), None, 11),
            ("tanggal_terbit", "Tanggal Penerbitan Surat", "SYSTEM_CURRENT_DATE", 1, None, None, 12),
        ];

        for v in t1_vars {
            let v_id = Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO variabel_surat (id, templat_id, kunci_variabel, label_input, tipe_variabel, wajib_diisi, nilai_bawaan, konfigurasi_json, urutan_tampil)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![v_id, t1_id, v.0, v.1, v.2, v.3, v.4, v.5, v.6],
            )?;
        }

        // Seed 2: Surat Keterangan Kerja (HRD)
        let t2_id = "tmpl-surat-ket-kerja-002";
        let t2_html = r#"<div style="text-align: center; margin-bottom: 20px;">
  <h2 style="font-size: 16pt; font-weight: bold; margin: 0; text-decoration: underline;">SURAT KETERANGAN KERJA</h2>
  <p style="margin: 4px 0 0 0; font-size: 11pt;">Nomor: {{nomor_surat}}</p>
</div>

<p>Yang bertanda tangan di bawah ini:</p>
<table style="width: 100%; margin-left: 20px; margin-bottom: 15px; border-collapse: collapse;">
  <tr><td style="width: 180px; padding: 3px 0;">Nama Penandatangan</td><td style="width: 20px;">:</td><td><strong>{{nama_hrd}}</strong></td></tr>
  <tr><td style="padding: 3px 0;">Jabatan</td><td>:</td><td>{{jabatan_hrd}}</td></tr>
  <tr><td style="padding: 3px 0;">Perusahaan</td><td>:</td><td>PT. INOVASI MAJU BERSAMA</td></tr>
</table>

<p>Menerangkan dengan sebenarnya bahwa:</p>
<table style="width: 100%; margin-left: 20px; margin-bottom: 15px; border-collapse: collapse;">
  <tr><td style="width: 180px; padding: 3px 0;">Nama Karyawan</td><td style="width: 20px;">:</td><td><strong>{{nama_karyawan}}</strong></td></tr>
  <tr><td style="padding: 3px 0;">Nomor Identitas (KTP)</td><td>:</td><td>{{nik_karyawan}}</td></tr>
  <tr><td style="padding: 3px 0;">Jabatan Terakhir</td><td>:</td><td>{{jabatan_terakhir}}</td></tr>
  <tr><td style="padding: 3px 0;">Departemen</td><td>:</td><td>{{departemen}}</td></tr>
  <tr><td style="padding: 3px 0;">Masa Kerja</td><td>:</td><td>{{tanggal_masuk}} s/d {{tanggal_keluar}}</td></tr>
</table>

<p>Adalah benar pernah menjadi karyawan pada perusahaan kami dan selama masa pengabdiannya telah menunjukkan dedikasi, loyalitas, dan integritas kerja yang sangat baik.</p>
<p>Surat keterangan ini diterbitkan atas permohonan yang bersangkutan guna keperluan: <em>{{keperluan_surat}}</em>.</p>

<div style="margin-top: 40px; float: right; width: 250px; text-align: center;">
  <p>Jakarta, {{tanggal_terbit}}</p>
  <p style="margin-bottom: 60px;">Human Resources Department,</p>
  <p style="font-weight: bold; text-decoration: underline;">{{nama_hrd}}</p>
  <p>{{jabatan_hrd}}</p>
</div>"#;

        conn.execute(
            "INSERT INTO templat_surat (
                id, judul, deskripsi, kategori, konten_json, konten_html, 
                ukuran_kertas, orientasi, margin_atas_mm, margin_bawah_mm, margin_kiri_mm, margin_kanan_mm, apakah_favorit
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, 1)",
            params![
                t2_id,
                "Surat Keterangan Kerja (Paklaring)",
                "Surat resmi verifikasi masa kerja karyawan aktif atau alumni untuk perbankan / visa",
                "HRD",
                "{}",
                t2_html,
                "A4",
                "PORTRAIT",
                25,
                20,
                25,
                20
            ],
        )?;

        let t2_vars: Vec<(&str, &str, &str, i32, Option<&str>, Option<&str>, i32)> = vec![
            ("nomor_surat", "Nomor Surat", "SYSTEM_DOC_NUMBER", 1, None, None, 1),
            ("nama_hrd", "Nama Pimpinan HRD", "SHORT_TEXT", 1, Some("Siti Rahmawati, S.Psi."), None, 2),
            ("jabatan_hrd", "Jabatan HRD", "SHORT_TEXT", 1, Some("Head of People & Culture"), None, 3),
            ("nama_karyawan", "Nama Lengkap Karyawan", "SHORT_TEXT", 1, None, None, 4),
            ("nik_karyawan", "NIK KTP Karyawan", "SHORT_TEXT", 1, None, None, 5),
            ("jabatan_terakhir", "Jabatan Terakhir", "SHORT_TEXT", 1, None, None, 6),
            ("departemen", "Divisi / Departemen", "SHORT_TEXT", 1, None, None, 7),
            ("tanggal_masuk", "Tanggal Mulai Bekerja", "DATE", 1, None, None, 8),
            ("tanggal_keluar", "Tanggal Akhir Kerja / Saat Ini", "SHORT_TEXT", 1, Some("Sekarang"), None, 9),
            ("keperluan_surat", "Tujuan / Keperluan Surat", "SHORT_TEXT", 1, Some("Pengajuan KPR / Administrasi Perbankan"), None, 10),
            ("tanggal_terbit", "Tanggal Cetak", "SYSTEM_CURRENT_DATE", 1, None, None, 11),
        ];

        for v in t2_vars {
            let v_id = Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO variabel_surat (id, templat_id, kunci_variabel, label_input, tipe_variabel, wajib_diisi, nilai_bawaan, konfigurasi_json, urutan_tampil)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![v_id, t2_id, v.0, v.1, v.2, v.3, v.4, v.5, v.6],
            )?;
        }

        // Seed 3: Surat Izin Cuti / Permohonan Izin
        let t3_id = "tmpl-surat-izin-cuti-003";
        let t3_html = r#"<div style="text-align: center; margin-bottom: 20px;">
  <h2 style="font-size: 16pt; font-weight: bold; margin: 0; text-decoration: underline;">FORMULIR PERMOHONAN IZIN CUTI</h2>
  <p style="margin: 4px 0 0 0; font-size: 11pt;">Nomor Formulir: {{nomor_surat}}</p>
</div>

<p>Kepada Yth.<br/><strong>{{atasan_langsung}}</strong><br/>Di Tempat</p>

<p>Saya yang bertanda tangan di bawah ini:</p>
<table style="width: 100%; margin-left: 20px; margin-bottom: 15px; border-collapse: collapse;">
  <tr><td style="width: 180px; padding: 3px 0;">Nama Lengkap</td><td style="width: 20px;">:</td><td><strong>{{nama_pemohon}}</strong></td></tr>
  <tr><td style="padding: 3px 0;">Nomor Induk Karyawan</td><td>:</td><td>{{nik_pemohon}}</td></tr>
  <tr><td style="padding: 3px 0;">Jabatan / Bagian</td><td>:</td><td>{{jabatan_pemohon}}</td></tr>
</table>

<p>Bermaksud untuk mengajukan izin cuti <strong>{{jenis_cuti}}</strong> selama <strong>{{jumlah_hari}} hari kerja</strong> terhitung mulai tanggal <strong>{{tanggal_mulai}}</strong> sampai dengan <strong>{{tanggal_selesai}}</strong> dengan keterangan/alasan sebagai berikut:</p>

<div style="margin: 15px 0 20px 20px; padding: 10px; background-color: #f8fafc; border-left: 3px solid #6366f1;">
  <p style="margin: 0;"><em>{{alasan_cuti}}</em></p>
</div>

<p>Selama masa cuti tersebut, tugas dan tanggung jawab mendesak saya koordinasikan dengan rekan kerja pengganti: <strong>{{delegasi_tugas}}</strong>.</p>

<table style="width: 100%; margin-top: 40px; border-collapse: collapse; text-align: center;">
  <tr>
    <td style="width: 50%;">
      <p>Pemohon Cuti,</p>
      <div style="height: 60px;"></div>
      <p style="font-weight: bold; text-decoration: underline;">{{nama_pemohon}}</p>
    </td>
    <td style="width: 50%;">
      <p>Menyetujui, Atasan Langsung</p>
      <div style="height: 60px;"></div>
      <p style="font-weight: bold; text-decoration: underline;">{{atasan_langsung}}</p>
    </td>
  </tr>
</table>"#;

        conn.execute(
            "INSERT INTO templat_surat (
                id, judul, deskripsi, kategori, konten_json, konten_html, 
                ukuran_kertas, orientasi, margin_atas_mm, margin_bawah_mm, margin_kiri_mm, margin_kanan_mm, apakah_favorit
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, 0)",
            params![
                t3_id,
                "Permohonan Izin / Cuti Karyawan",
                "Formulir pengajuan cuti tahunan, sakit, atau izin keperluan mendesak karyawan",
                "HRD",
                "{}",
                t3_html,
                "A4",
                "PORTRAIT",
                25,
                20,
                25,
                20
            ],
        )?;

        let t3_vars: Vec<(&str, &str, &str, i32, Option<&str>, Option<&str>, i32)> = vec![
            ("nomor_surat", "Nomor Registrasi Cuti", "SYSTEM_DOC_NUMBER", 1, None, None, 1),
            ("atasan_langsung", "Nama Atasan Langsung", "SHORT_TEXT", 1, Some("Budi Santoso, S.T."), None, 2),
            ("nama_pemohon", "Nama Karyawan Pemohon", "SHORT_TEXT", 1, None, None, 3),
            ("nik_pemohon", "NIK Karyawan", "SHORT_TEXT", 1, None, None, 4),
            ("jabatan_pemohon", "Jabatan Pemohon", "SHORT_TEXT", 1, None, None, 5),
            ("jenis_cuti", "Jenis Cuti", "DROPDOWN", 1, Some("Cuti Tahunan"), Some(r#"{"options": ["Cuti Tahunan", "Cuti Sakit", "Cuti Melahirkan", "Cuti Menikah", "Izin Khusus"]}"#), 6),
            ("jumlah_hari", "Jumlah Hari Kerja", "NUMBER", 1, Some("3"), None, 7),
            ("tanggal_mulai", "Tanggal Mulai Cuti", "DATE", 1, None, None, 8),
            ("tanggal_selesai", "Tanggal Selesai Cuti", "DATE", 1, None, None, 9),
            ("alasan_cuti", "Alasan Permohonan Cuti", "LONG_TEXT", 1, None, None, 10),
            ("delegasi_tugas", "Rekan Pelimpahan Tugas Sementara", "SHORT_TEXT", 1, None, None, 11),
        ];

        for v in t3_vars {
            let v_id = Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO variabel_surat (id, templat_id, kunci_variabel, label_input, tipe_variabel, wajib_diisi, nilai_bawaan, konfigurasi_json, urutan_tampil)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![v_id, t3_id, v.0, v.1, v.2, v.3, v.4, v.5, v.6],
            )?;
        }
    }

    Ok(())
}
