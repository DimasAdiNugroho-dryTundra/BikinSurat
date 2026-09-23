import React, { useState } from "react";
import {
  History,
  Search,
  FileText,
  RotateCcw,
  Printer,
  FileCode,
  Calendar,
  User,
  Hash,
} from "lucide-react";
import { DocumentHistoryItem } from "@/types";

interface HistoryViewProps {
  history: DocumentHistoryItem[];
  onRepopulate: (historyItem: DocumentHistoryItem) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onRepopulate,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const getRecipientName = (item: DocumentHistoryItem): string => {
    if (item.nama_penerima && item.nama_penerima.trim() && item.nama_penerima !== "-") {
      return item.nama_penerima.trim();
    }
    // Fallback: extract from filled_values_json if older record didn't save recipient_name
    if (item.nilai_isian_json) {
      try {
        const parsed = JSON.parse(item.nilai_isian_json);
        const keys = [
          "nama_pegawai",
          "nama_karyawan",
          "nama_pemohon",
          "nama_penerima",
          "nama_lengkap",
          "nama_siswa",
          "nama_mahasiswa",
          "nama_peserta",
          "nama",
        ];
        for (const k of keys) {
          if (parsed[k] && typeof parsed[k] === "string" && parsed[k].trim()) {
            return parsed[k].trim();
          }
        }
      } catch {
        // ignore
      }
    }
    return "-";
  };

  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return "-";
    if (dateStr.endsWith("Z") || dateStr.includes("T")) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      }
    }
    return dateStr;
  };

  const filteredHistory = history.filter((item) => {
    const q = searchQuery.toLowerCase();
    const recipient = getRecipientName(item).toLowerCase();
    return (
      item.judul_dokumen.toLowerCase().includes(q) ||
      (item.nomor_surat && item.nomor_surat.toLowerCase().includes(q)) ||
      recipient.includes(q)
    );
  });

  const getFormatBadge = (fmt: string) => {
    switch (fmt) {
      case "CETAK_LANGSUNG":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/40 text-[10px] font-medium">
            <Printer className="w-2.5 h-2.5" />
            Cetak Native
          </span>
        );
      case "PDF":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 text-[10px] font-medium">
            <FileText className="w-2.5 h-2.5" />
            PDF Vektor
          </span>
        );
      case "DOCX":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 text-[10px] font-medium">
            <FileCode className="w-2.5 h-2.5" />
            DOCX Word
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px]">
            {fmt}
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Riwayat Dokumen Terbit
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Jejak audit dan arsip surat yang telah dicetak atau diekspor
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor surat atau judul..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition shadow-xs"
          />
        </div>
      </div>

      {/* History Table */}
      {filteredHistory.length > 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Nomor & Judul Dokumen</th>
                <th className="px-4 py-2.5 font-semibold">Penerima / Pemohon</th>
                <th className="px-4 py-2.5 font-semibold">Format</th>
                <th className="px-4 py-2.5 font-semibold">Waktu Terbit</th>
                <th className="px-4 py-2.5 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredHistory.map((item) => {
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-start space-x-2">
                        <div className="p-1.5 rounded-sm bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                            {item.judul_dokumen}
                          </div>
                          <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            <Hash className="w-2.5 h-2.5 text-blue-500" />
                            <span>{item.nomor_surat || "Tanpa Nomor Resmi"}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1.5 text-zinc-600 dark:text-zinc-300 text-xs">
                        <User className="w-3 h-3 text-zinc-400" />
                        <span>{item.nama_penerima || "-"}</span>
                        <span>{getRecipientName(item)}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {getFormatBadge(item.format_ekspor)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1 text-zinc-400 text-[10px]">
                        <Calendar className="w-3 h-3 text-zinc-400" />
                        <span>{item.dibuat_pada}</span>
                        <span>{formatDisplayDate(item.dibuat_pada)}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onRepopulate(item)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition text-xs font-medium cursor-pointer"
                        title="Muat ulang isian surat untuk dicetak kembali"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Isi Ulang</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-sm border border-dashed border-zinc-300 dark:border-zinc-800 p-8 space-y-2.5">
          <div className="w-10 h-10 rounded-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Belum Ada Riwayat Dokumen
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Setiap kali Anda mencetak atau mengekspor surat, snapshot naskah akan tercatat di sini secara otomatis.
          </p>
        </div>
      )}
    </div>
  );
};
