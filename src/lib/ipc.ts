import { TemplateItem, AppSetting, DocumentHistoryItem, DraftItem } from "@/types";

// Check if running inside Tauri Webview
export const isTauri = (): boolean => {
  return typeof window !== "undefined" && Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
};

// Fallback mock store for browser development
const initialMockTemplates: TemplateItem[] = [
  {
    id: "tmpl-surat-tugas-001",
    judul: "Surat Perintah Tugas (SPT)",
    deskripsi: "Surat penugasan kedinasan resmi karyawan untuk perjalanan luar kantor",
    kategori: "Operasional",
    konten_json: "{}",
    konten_html: `<div style="text-align: center; margin-bottom: 20px;">
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
</div>`,
    ukuran_kertas: "A4",
    orientasi: "PORTRAIT",
    margin_atas_mm: 25,
    margin_bawah_mm: 20,
    margin_kiri_mm: 25,
    margin_kanan_mm: 20,
    apakah_favorit: true,
    pola_penomoran: "{{NOMOR}}/SPT-OPS/{{BULAN_ROMAWI}}/{{TAHUN}}",
    counter_terakhir: 0,
    dibuat_pada: "2026-09-22 10:00:00",
    diperbarui_pada: "2026-09-22 10:00:00",
    variabel: [
      { id: "v1", templat_id: "tmpl-surat-tugas-001", kunci_variabel: "nomor_surat", label_input: "Nomor Surat Tugas", tipe_variabel: "SYSTEM_DOC_NUMBER", wajib_diisi: true, urutan_tampil: 1 },
      { id: "v2", templat_id: "tmpl-surat-tugas-001", kunci_variabel: "nama_pejabat", label_input: "Nama Pemberi Tugas", tipe_variabel: "SHORT_TEXT", wajib_diisi: true, nilai_bawaan: "Hendra Wijaya, S.E., M.M.", urutan_tampil: 2 },
      { id: "v3", templat_id: "tmpl-surat-tugas-001", kunci_variabel: "jabatan_pejabat", label_input: "Jabatan Pemberi Tugas", tipe_variabel: "SHORT_TEXT", wajib_diisi: true, nilai_bawaan: "Direktur Operasional", urutan_tampil: 3 },
      { id: "v4", templat_id: "tmpl-surat-tugas-001", kunci_variabel: "nama_pegawai", label_input: "Nama Pegawai yang Ditugaskan", tipe_variabel: "SHORT_TEXT", wajib_diisi: true, urutan_tampil: 4 },
      { id: "v5", templat_id: "tmpl-surat-tugas-001", kunci_variabel: "nik_pegawai", label_input: "NIK / NIP Pegawai", tipe_variabel: "SHORT_TEXT", wajib_diisi: true, urutan_tampil: 5 },
      { id: "v6", templat_id: "tmpl-surat-tugas-001", kunci_variabel: "jabatan_pegawai", label_input: "Jabatan / Divisi Pegawai", tipe_variabel: "SHORT_TEXT", wajib_diisi: true, urutan_tampil: 6 },
      { id: "v7", templat_id: "tmpl-surat-tugas-001", kunci_variabel: "tujuan_penugasan", label_input: "Tujuan / Keperluan Tugas", tipe_variabel: "LONG_TEXT", wajib_diisi: true, urutan_tampil: 7 },
      { id: "v8", templat_id: "tmpl-surat-tugas-001", kunci_variabel: "kota_tujuan", label_input: "Kota Tujuan Perjalanan", tipe_variabel: "SHORT_TEXT", wajib_diisi: true, nilai_bawaan: "Bandung, Jawa Barat", urutan_tampil: 8 },
      { id: "v9", templat_id: "tmpl-surat-tugas-001", kunci_variabel: "tanggal_berangkat", label_input: "Tanggal Mulai Bertugas", tipe_variabel: "DATE", wajib_diisi: true, urutan_tampil: 9 },
      { id: "v10", templat_id: "tmpl-surat-tugas-001", kunci_variabel: "tanggal_kembali", label_input: "Tanggal Selesai Bertugas", tipe_variabel: "DATE", wajib_diisi: true, urutan_tampil: 10 },
      { id: "v11", templat_id: "tmpl-surat-tugas-001", kunci_variabel: "kota_terbit", label_input: "Kota Penerbitan Surat", tipe_variabel: "SHORT_TEXT", wajib_diisi: true, nilai_bawaan: "Jakarta", urutan_tampil: 11 },
      { id: "v12", templat_id: "tmpl-surat-tugas-001", kunci_variabel: "tanggal_terbit", label_input: "Tanggal Penerbitan Surat", tipe_variabel: "SYSTEM_CURRENT_DATE", wajib_diisi: true, urutan_tampil: 12 },
    ],
  },
  {
    id: "tmpl-surat-ket-kerja-002",
    judul: "Surat Keterangan Kerja (Paklaring)",
    deskripsi: "Surat resmi verifikasi masa kerja karyawan aktif atau alumni untuk perbankan / visa",
    kategori: "HRD",
    konten_json: "{}",
    konten_html: `<div style="text-align: center; margin-bottom: 20px;">
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
</div>`,
    ukuran_kertas: "A4",
    orientasi: "PORTRAIT",
    margin_atas_mm: 25,
    margin_bawah_mm: 20,
    margin_kiri_mm: 25,
    margin_kanan_mm: 20,
    apakah_favorit: true,
    pola_penomoran: "{{NOMOR}}/SKK-HRD/{{BULAN_ROMAWI}}/{{TAHUN}}",
    counter_terakhir: 0,
    dibuat_pada: "2026-09-22 10:15:00",
    diperbarui_pada: "2026-09-22 10:15:00",
    variabel: [
      { id: "v20", templat_id: "tmpl-surat-ket-kerja-002", kunci_variabel: "nomor_surat", label_input: "Nomor Surat", tipe_variabel: "SYSTEM_DOC_NUMBER", wajib_diisi: true, urutan_tampil: 1 },
      { id: "v21", templat_id: "tmpl-surat-ket-kerja-002", kunci_variabel: "nama_hrd", label_input: "Nama Pimpinan HRD", tipe_variabel: "SHORT_TEXT", wajib_diisi: true, nilai_bawaan: "Siti Rahmawati, S.Psi.", urutan_tampil: 2 },
      { id: "v22", templat_id: "tmpl-surat-ket-kerja-002", kunci_variabel: "jabatan_hrd", label_input: "Jabatan HRD", tipe_variabel: "SHORT_TEXT", wajib_diisi: true, nilai_bawaan: "Head of People & Culture", urutan_tampil: 3 },
      { id: "v23", templat_id: "tmpl-surat-ket-kerja-002", kunci_variabel: "nama_karyawan", label_input: "Nama Lengkap Karyawan", tipe_variabel: "SHORT_TEXT", wajib_diisi: true, urutan_tampil: 4 },
      { id: "v24", templat_id: "tmpl-surat-ket-kerja-002", kunci_variabel: "nik_karyawan", label_input: "NIK KTP Karyawan", tipe_variabel: "SHORT_TEXT", wajib_diisi: true, urutan_tampil: 5 },
      { id: "v25", templat_id: "tmpl-surat-ket-kerja-002", kunci_variabel: "jabatan_terakhir", label_input: "Jabatan Terakhir", tipe_variabel: "SHORT_TEXT", wajib_diisi: true, urutan_tampil: 6 },
      { id: "v26", templat_id: "tmpl-surat-ket-kerja-002", kunci_variabel: "departemen", label_input: "Divisi / Departemen", tipe_variabel: "SHORT_TEXT", wajib_diisi: true, urutan_tampil: 7 },
      { id: "v27", templat_id: "tmpl-surat-ket-kerja-002", kunci_variabel: "tanggal_masuk", label_input: "Tanggal Mulai Bekerja", tipe_variabel: "DATE", wajib_diisi: true, urutan_tampil: 8 },
      { id: "v28", templat_id: "tmpl-surat-ket-kerja-002", kunci_variabel: "tanggal_keluar", label_input: "Tanggal Akhir Kerja", tipe_variabel: "SHORT_TEXT", wajib_diisi: true, nilai_bawaan: "Sekarang", urutan_tampil: 9 },
      { id: "v29", templat_id: "tmpl-surat-ket-kerja-002", kunci_variabel: "keperluan_surat", label_input: "Tujuan Surat", tipe_variabel: "SHORT_TEXT", wajib_diisi: true, nilai_bawaan: "Pengajuan KPR / Administrasi Perbankan", urutan_tampil: 10 },
      { id: "v30", templat_id: "tmpl-surat-ket-kerja-002", kunci_variabel: "tanggal_terbit", label_input: "Tanggal Cetak", tipe_variabel: "SYSTEM_CURRENT_DATE", wajib_diisi: true, urutan_tampil: 11 },
    ],
  },
  {
    id: "tmpl-surat-izin-cuti-003",
    judul: "Permohonan Izin / Cuti Karyawan",
    deskripsi: "Formulir pengajuan cuti tahunan, sakit, atau izin keperluan mendesak karyawan",
    kategori: "HRD",
    konten_json: "{}",
    konten_html: `<div style="text-align: center; margin-bottom: 20px;">
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
<p>Bermaksud untuk mengajukan izin cuti <strong>{{jenis_cuti}}</strong> selama <strong>{{jumlah_hari}} hari kerja</strong> terhitung mulai tanggal <strong>{{tanggal_mulai}}</strong> sampai dengan <strong>{{tanggal_selesai}}</strong> dengan alasan:</p>
<div style="margin: 15px 0 20px 20px; padding: 10px; background-color: #f8fafc; border-left: 3px solid #6366f1;">
  <p style="margin: 0;"><em>{{alasan_cuti}}</em></p>
</div>
<p>Selama masa cuti tersebut, tugas dan tanggung jawab mendesak didelegasikan kepada: <strong>{{delegasi_tugas}}</strong>.</p>
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
</table>`,
    ukuran_kertas: "A4",
    orientasi: "PORTRAIT",
    margin_atas_mm: 25,
    margin_bawah_mm: 20,
    margin_kiri_mm: 25,
    margin_kanan_mm: 20,
    apakah_favorit: false,
    pola_penomoran: "{{NOMOR}}/CUTI-HRD/{{BULAN_ROMAWI}}/{{TAHUN}}",
    counter_terakhir: 0,
    dibuat_pada: "2026-09-22 10:30:00",
    diperbarui_pada: "2026-09-22 10:30:00",
    variabel: [
      { id: "v31", templat_id: "tmpl-surat-izin-cuti-003", kunci_variabel: "nomor_surat", label_input: "Nomor Registrasi Cuti", tipe_variabel: "SYSTEM_DOC_NUMBER", wajib_diisi: true, urutan_tampil: 1 },
      { id: "v32", templat_id: "tmpl-surat-izin-cuti-003", kunci_variabel: "atasan_langsung", label_input: "Nama Atasan Langsung", tipe_variabel: "SHORT_TEXT", wajib_diisi: true, nilai_bawaan: "Budi Santoso, S.T.", urutan_tampil: 2 },
      { id: "v33", templat_id: "tmpl-surat-izin-cuti-003", kunci_variabel: "nama_pemohon", label_input: "Nama Karyawan Pemohon", tipe_variabel: "SHORT_TEXT", wajib_diisi: true, urutan_tampil: 3 },
      { id: "v34", templat_id: "tmpl-surat-izin-cuti-003", kunci_variabel: "nik_pemohon", label_input: "NIK Karyawan", tipe_variabel: "SHORT_TEXT", wajib_diisi: true, urutan_tampil: 4 },
      { id: "v35", templat_id: "tmpl-surat-izin-cuti-003", kunci_variabel: "jabatan_pemohon", label_input: "Jabatan Pemohon", tipe_variabel: "SHORT_TEXT", wajib_diisi: true, urutan_tampil: 5 },
      { id: "v36", templat_id: "tmpl-surat-izin-cuti-003", kunci_variabel: "jenis_cuti", label_input: "Jenis Cuti", tipe_variabel: "DROPDOWN", wajib_diisi: true, nilai_bawaan: "Cuti Tahunan", konfigurasi_json: '{"options": ["Cuti Tahunan", "Cuti Sakit", "Cuti Melahirkan", "Cuti Menikah", "Izin Khusus"]}', urutan_tampil: 6 },
      { id: "v37", templat_id: "tmpl-surat-izin-cuti-003", kunci_variabel: "jumlah_hari", label_input: "Jumlah Hari Kerja", tipe_variabel: "NUMBER", wajib_diisi: true, nilai_bawaan: "3", urutan_tampil: 7 },
      { id: "v38", templat_id: "tmpl-surat-izin-cuti-003", kunci_variabel: "tanggal_mulai", label_input: "Tanggal Mulai Cuti", tipe_variabel: "DATE", wajib_diisi: true, urutan_tampil: 8 },
      { id: "v39", templat_id: "tmpl-surat-izin-cuti-003", kunci_variabel: "tanggal_selesai", label_input: "Tanggal Selesai Cuti", tipe_variabel: "DATE", wajib_diisi: true, urutan_tampil: 9 },
      { id: "v40", templat_id: "tmpl-surat-izin-cuti-003", kunci_variabel: "alasan_cuti", label_input: "Alasan Permohonan Cuti", tipe_variabel: "LONG_TEXT", wajib_diisi: true, urutan_tampil: 10 },
      { id: "v41", templat_id: "tmpl-surat-izin-cuti-003", kunci_variabel: "delegasi_tugas", label_input: "Rekan Pelimpahan Tugas", tipe_variabel: "SHORT_TEXT", wajib_diisi: true, urutan_tampil: 11 },
    ],
  },
];

let mockSettings: AppSetting[] = [
  { kunci: "nama_organisasi", nilai: "PT. INOVASI MAJU BERSAMA", deskripsi: "Nama Resmi Organisasi / Perusahaan" },
  { kunci: "alamat_organisasi", nilai: "Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan", deskripsi: "Alamat Lengkap Kantor" },
  { kunci: "telepon_organisasi", nilai: "(021) 555-0199", deskripsi: "Nomor Telepon Resmi Kantor" },
  { kunci: "surel_organisasi", nilai: "administrasi@inovasimaju.id", deskripsi: "Alamat Surel Resmi Organisasi" },
  { kunci: "penomoran_tahun_berjalan", nilai: "2026", deskripsi: "Tahun Aktif Counter Penomoran Surat" },
  { kunci: "penomoran_urutan_terakhir", nilai: "42", deskripsi: "Nomor Urut Surat Terakhir yang Diterbitkan" },
  { kunci: "format_penomoran_default", nilai: "{{NOMOR}}/SK-DIR/{{BULAN_ROMAWI}}/{{TAHUN}}", deskripsi: "Format Penomoran Surat Default" },
  { kunci: "tema_aplikasi", nilai: "sistem", deskripsi: "Pilihan Tema UI" },
];

const loadStoredTemplates = (): TemplateItem[] => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("bikinsurat_mock_templates");
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  return initialMockTemplates;
};

const saveStoredTemplates = (tmpls: TemplateItem[]) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("bikinsurat_mock_templates", JSON.stringify(tmpls));
    } catch {
      // ignore
    }
  }
};

let mockTemplates: TemplateItem[] = loadStoredTemplates();

const loadStoredHistory = (): DocumentHistoryItem[] => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("bikinsurat_mock_history");
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  return [];
};

const saveStoredHistory = (hist: DocumentHistoryItem[]) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("bikinsurat_mock_history", JSON.stringify(hist));
    } catch {
      // ignore
    }
  }
};

let mockHistory: DocumentHistoryItem[] = loadStoredHistory();

const loadStoredDrafts = (): DraftItem[] => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("bikinsurat_mock_drafts");
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  return [];
};

const saveStoredDrafts = (drafts: DraftItem[]) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("bikinsurat_mock_drafts", JSON.stringify(drafts));
    } catch {
      // ignore
    }
  }
};

let mockDrafts: DraftItem[] = loadStoredDrafts();

// Strongly Typed API Wrapper
export const BikinsuratAPI = {
  getTemplates: async (): Promise<TemplateItem[]> => {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke<TemplateItem[]>("get_templates");
    }
    return Promise.resolve([...mockTemplates]);
  },

  getTemplateById: async (id: string): Promise<TemplateItem | null> => {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke<TemplateItem | null>("get_template_by_id", { id });
    }
    const found = mockTemplates.find((t) => t.id === id);
    return Promise.resolve(found ? { ...found } : null);
  },

  saveTemplate: async (payload: TemplateItem): Promise<string> => {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke<string>("save_template", { payload });
    }
    const id = payload.id || `tmpl-${Date.now()}`;
    const idx = mockTemplates.findIndex((t) => t.id === id);
    if (idx >= 0) {
      mockTemplates[idx] = { ...payload, id };
    } else {
      mockTemplates.unshift({ ...payload, id });
    }
    saveStoredTemplates(mockTemplates);
    return Promise.resolve(id);
  },

  deleteTemplate: async (id: string): Promise<void> => {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke<void>("delete_template", { id });
    }
    mockTemplates = mockTemplates.filter((t) => t.id !== id);
    saveStoredTemplates(mockTemplates);
    return Promise.resolve();
  },

  getSettings: async (): Promise<AppSetting[]> => {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke<AppSetting[]>("get_settings");
    }
    return Promise.resolve([...mockSettings]);
  },

  updateSetting: async (key: string, value: string): Promise<void> => {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke<void>("update_setting", { key, value });
    }
    const item = mockSettings.find((s) => s.kunci === key);
    if (item) item.nilai = value;
    return Promise.resolve();
  },

  fetchNextDocNumber: async (templateId?: string, formatPattern?: string): Promise<string> => {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke<string>("fetch_next_document_number", { templateId, formatPattern });
    }
    const currentSeq = parseInt(mockSettings.find((s) => s.kunci === "penomoran_urutan_terakhir")?.nilai || "42", 10);
    const nextSeq = currentSeq + 1;
    const item = mockSettings.find((s) => s.kunci === "penomoran_urutan_terakhir");
    if (item) item.nilai = nextSeq.toString();

    const tmpl = templateId ? mockTemplates.find((t) => t.id === templateId) : null;
    const year = (tmpl?.tahun_penomoran || new Date().getFullYear()).toString();
    const pattern = formatPattern || tmpl?.pola_penomoran || "{{NOMOR}}/SK-DIR/{{BULAN_ROMAWI}}/{{TAHUN}}";
    return pattern
      .replace("{{NOMOR}}", String(nextSeq).padStart(3, "0"))
      .replace("{{TAHUN}}", year)
      .replace("{{BULAN_ROMAWI}}", "IX")
      .replace("{{BULAN}}", "09")
      .replace("{{HARI}}", "22");
  },

  getDocumentHistory: async (): Promise<DocumentHistoryItem[]> => {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke<DocumentHistoryItem[]>("get_document_history");
    }
    return Promise.resolve([...mockHistory]);
  },

  recordDocumentHistory: async (payload: {
    template_id: string;
    document_number?: string;
    document_title: string;
    recipient_name?: string;
    filled_values_json: string;
    rendered_preview_html: string;
    export_format: string;
    file_path?: string;
  }): Promise<string> => {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke<string>("record_document_history", { payload });
    }
    const id = `hist-${Date.now()}`;
    const pad = (n: number) => String(n).padStart(2, "0");
    const now = new Date();
    const localNowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    mockHistory.unshift({
      id,
      templat_id: payload.template_id,
      nomor_surat: payload.document_number,
      judul_dokumen: payload.document_title,
      nama_penerima: payload.recipient_name,
      nilai_isian_json: payload.filled_values_json,
      hasil_pratinjau_html: payload.rendered_preview_html,
      format_ekspor: payload.export_format as "CETAK_LANGSUNG" | "PDF" | "DOCX",
      lokasi_berkas: payload.file_path,
      dibuat_pada: localNowStr,
    });
    saveStoredHistory(mockHistory);
    return Promise.resolve(id);
  },

  getDrafts: async (): Promise<DraftItem[]> => {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke<DraftItem[]>("get_drafts");
    }
    return Promise.resolve([...mockDrafts]);
  },

  saveDraft: async (payload: {
    id?: string;
    templat_id: string;
    judul_draf: string;
    nilai_isian_json: string;
    hasil_pratinjau_html?: string;
  }): Promise<string> => {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke<string>("save_draft", { payload });
    }
    const id = payload.id || `draft-${Date.now()}`;
    const pad = (n: number) => String(n).padStart(2, "0");
    const now = new Date();
    const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const idx = mockDrafts.findIndex((d) => d.id === id);
    const item: DraftItem = {
      id,
      templat_id: payload.templat_id,
      judul_draf: payload.judul_draf,
      nilai_isian_json: payload.nilai_isian_json,
      hasil_pratinjau_html: payload.hasil_pratinjau_html,
      dibuat_pada: idx >= 0 ? mockDrafts[idx].dibuat_pada : nowStr,
      diperbarui_pada: nowStr,
    };
    if (idx >= 0) {
      mockDrafts[idx] = item;
    } else {
      mockDrafts.unshift(item);
    }
    saveStoredDrafts(mockDrafts);
    return Promise.resolve(id);
  },

  deleteDraft: async (id: string): Promise<void> => {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke<void>("delete_draft", { id });
    }
    mockDrafts = mockDrafts.filter((d) => d.id !== id);
    saveStoredDrafts(mockDrafts);
    return Promise.resolve();
  },
};
