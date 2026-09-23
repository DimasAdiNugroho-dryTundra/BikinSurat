export type VariableType =
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "NUMBER"
  | "CURRENCY"
  | "DATE"
  | "DROPDOWN"
  | "SYSTEM_CURRENT_DATE"
  | "SYSTEM_DOC_NUMBER";

export interface VariableItem {
  id: string;
  templat_id: string;
  kunci_variabel: string;
  label_input: string;
  tipe_variabel: VariableType;
  wajib_diisi: boolean;
  nilai_bawaan?: string;
  konfigurasi_json?: string;
  urutan_tampil: number;
}

export interface TemplateItem {
  id: string;
  judul: string;
  deskripsi?: string;
  kategori: string;
  konten_json: string;
  konten_html: string;
  ukuran_kertas: "A4" | "F4" | "LETTER";
  orientasi: "PORTRAIT" | "LANDSCAPE";
  margin_atas_mm: number;
  margin_bawah_mm: number;
  margin_kiri_mm: number;
  margin_kanan_mm: number;
  kop_surat_html?: string;
  catatan_kaki_html?: string;
  apakah_favorit: boolean;
  pola_penomoran?: string;
  counter_terakhir?: number;
  apakah_draf?: boolean;
  tahun_penomoran?: number;
  dibuat_pada?: string;
  diperbarui_pada?: string;
  variabel?: VariableItem[];
}

export interface DraftItem {
  id: string;
  templat_id: string;
  judul_draf: string;
  nilai_isian_json: string;
  hasil_pratinjau_html?: string;
  dibuat_pada: string;
  diperbarui_pada: string;
}

export interface AppSetting {
  kunci: string;
  nilai: string;
  deskripsi?: string;
  diperbarui_pada?: string;
}

export interface DocumentHistoryItem {
  id: string;
  templat_id: string;
  nomor_surat?: string;
  judul_dokumen: string;
  nama_penerima?: string;
  nilai_isian_json: string;
  hasil_pratinjau_html?: string;
  format_ekspor: "CETAK_LANGSUNG" | "PDF" | "DOCX";
  lokasi_berkas?: string;
  dibuat_pada: string;
}

export type ActiveView = "catalog" | "generator" | "builder" | "history" | "settings";

