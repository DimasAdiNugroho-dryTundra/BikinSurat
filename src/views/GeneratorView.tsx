import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  TemplateItem,
  VariableItem,
} from "@/types";
import { BikinsuratAPI } from "@/lib/ipc";
import { exportToDocx } from "@/lib/docxExport";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Printer,
  FileDown,
  Save,
  CheckCircle2,
  Calendar,
  Sparkles,
  FileText,
  PlusCircle,
  Edit3,
  ArrowLeft,
  User,
} from "lucide-react";

interface GeneratorViewProps {
  template: TemplateItem;
  templates: TemplateItem[];
  initialValues?: { [key: string]: string };
  initialDraftId?: string;
  onSelectTemplate: (template: TemplateItem) => void;
  onBackToCatalog?: () => void;
  onDocumentGenerated?: () => void;
  onNewTemplate?: () => void;
  onEditTemplate?: (template: TemplateItem) => void;
}

export const GeneratorView: React.FC<GeneratorViewProps> = ({
  template,
  templates,
  initialValues,
  initialDraftId,
  onSelectTemplate,
  onBackToCatalog,
  onDocumentGenerated,
  onEditTemplate,
}) => {
  // Form State
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(initialDraftId || null);
  const [draftTitle, setDraftTitle] = useState<string>("");
  const [recipientName, setRecipientName] = useState<string>("");
  const [isCustomRecipient, setIsCustomRecipient] = useState<boolean>(false);
  const [splitRatio, setSplitRatio] = useState<number>(45);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showToast, setShowToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Unsaved changes modal state
  const [isDirty, setIsDirty] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Date format preferences per key: "name" | "slash" | "dash"
  const [dateFormats, setDateFormats] = useState<{ [key: string]: "name" | "slash" | "dash" }>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingDivider = useRef<boolean>(false);

  // Auto-detect recipient/applicant name from form data
  const detectRecipientFromData = (data: { [key: string]: string }): string => {
    // 1. Direct prioritized keys
    const directKeys = [
      "nama_pegawai",
      "nama_karyawan",
      "nama_pemohon",
      "nama_penerima",
      "nama_lengkap",
      "nama_siswa",
      "nama_mahasiswa",
      "nama_peserta",
      "nama_tujuan",
      "penerima",
      "pemohon",
    ];
    for (const k of directKeys) {
      if (data[k] && data[k].trim()) return data[k].trim();
    }
    // 2. Search template variables matching recipient patterns
    const vars = template.variabel || [];
    for (const v of vars) {
      const k = v.kunci_variabel.toLowerCase();
      const l = v.label_input.toLowerCase();
      // Skip official / issuing person
      if (
        k.includes("pejabat") ||
        k.includes("pemberi") ||
        l.includes("pejabat") ||
        l.includes("pemberi") ||
        k.includes("direktur") ||
        l.includes("direktur")
      ) {
        continue;
      }
      if (
        k.includes("penerima") ||
        k.includes("pemohon") ||
        k.includes("pegawai") ||
        k.includes("karyawan") ||
        k.includes("siswa") ||
        l.includes("penerima") ||
        l.includes("pemohon") ||
        l.includes("pegawai") ||
        l.includes("karyawan") ||
        l.includes("nama lengkap")
      ) {
        if (data[v.kunci_variabel] && data[v.kunci_variabel].trim()) {
          return data[v.kunci_variabel].trim();
        }
      }
    }
    // Fallback: general "nama" key if not pemberi tugas
    if (data["nama"] && data["nama"].trim()) return data["nama"].trim();
    return "";
  };

  // Calculate paper dimensions based on template specification
  const getPaperDimensions = () => {
    const sizes: Record<string, { w: number; h: number }> = {
      A4: { w: 210, h: 297 },
      F4: { w: 215, h: 330 },
      LETTER: { w: 216, h: 279 },
    };
    const size = sizes[template.ukuran_kertas] || sizes.A4;
    if (template.orientasi === "LANDSCAPE") {
      return { width: `${size.h}mm`, minHeight: `${size.w}mm` };
    }
    return { width: `${size.w}mm`, minHeight: `${size.h}mm` };
  };

  const paperDims = getPaperDimensions();

  // Helper date formatter
  const formatDateValue = (dateObj: Date, format: "name" | "slash" | "dash"): string => {
    const d = dateObj.getDate();
    const m = dateObj.getMonth();
    const y = dateObj.getFullYear();
    if (format === "name") {
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember",
      ];
      return `${d} ${months[m]} ${y}`;
    } else if (format === "slash") {
      const dd = String(d).padStart(2, "0");
      const mm = String(m + 1).padStart(2, "0");
      return `${dd}/${mm}/${y}`;
    } else {
      const dd = String(d).padStart(2, "0");
      const mm = String(m + 1).padStart(2, "0");
      return `${y}-${mm}-${dd}`;
    }
  };

  // Initialize form fields from variables
  useEffect(() => {
    const data: { [key: string]: string } = {};

    if (initialValues) {
      Object.assign(data, initialValues);
    }

    const vars = template.variabel || [];
    for (const v of vars) {
      if (data[v.kunci_variabel] !== undefined) continue;

      if (v.tipe_variabel === "SYSTEM_CURRENT_DATE") {
        data[v.kunci_variabel] = formatDateValue(new Date(), "name");
      } else if (v.tipe_variabel === "SYSTEM_DOC_NUMBER") {
        data[v.kunci_variabel] = "[DRAF - BELUM TERBIT]";
      } else if (v.tipe_variabel === "DROPDOWN") {
        let firstOpt = "";
        if (v.konfigurasi_json) {
          try {
            const parsed = JSON.parse(v.konfigurasi_json);
            const opts = parsed.options || parsed.opsi;
            if (Array.isArray(opts) && opts.length > 0) {
              firstOpt = opts[0];
            }
          } catch {
            // ignore
          }
        }
        data[v.kunci_variabel] = v.nilai_bawaan || firstOpt || "";
      } else if (v.nilai_bawaan) {
        data[v.kunci_variabel] = v.nilai_bawaan;
      } else {
        data[v.kunci_variabel] = "";
      }
    }
    setFormData({ ...data });
    setDraftTitle(template.judul);
    const autoRecipient = detectRecipientFromData(data);
    setRecipientName(autoRecipient);
    setIsCustomRecipient(false);
    setIsDirty(false);
  }, [template, initialValues]);

  // Handle Field Changes
  const handleInputChange = (key: string, val: string) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
    setFormData((prev) => {
      const next = { ...prev, [key]: val };
      if (!isCustomRecipient) {
        const detected = detectRecipientFromData(next);
        setRecipientName(detected);
      }
      return next;
    });
    setIsDirty(true);
  };

  // Currency input helper
  const handleCurrencyChange = (key: string, rawVal: string) => {
    const cleanNum = rawVal.replace(/[^0-9]/g, "");
    if (!cleanNum) {
      handleInputChange(key, "");
      return;
    }
    const formatted = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(parseInt(cleanNum, 10));
    handleInputChange(key, formatted);
  };

  // Date format toggle
  const handleFormatChange = (key: string, format: "name" | "slash" | "dash") => {
    setDateFormats((prev) => ({ ...prev, [key]: format }));
    const currentVal = formData[key];
    if (currentVal) {
      const parts = currentVal.match(/\d+/g);
      if (parts && parts.length >= 3) {
        let d = parseInt(parts[0], 10);
        let m = parseInt(parts[1], 10) - 1;
        let y = parseInt(parts[2], 10);
        if (parts[0].length === 4) {
          y = parseInt(parts[0], 10);
          m = parseInt(parts[1], 10) - 1;
          d = parseInt(parts[2], 10);
        }
        const parsedDate = new Date(y, Math.max(0, Math.min(11, m)), d);
        if (!isNaN(parsedDate.getTime())) {
          handleInputChange(key, formatDateValue(parsedDate, format));
        }
      }
    }
  };

  // Date picker handler
  const handleDatePicked = (key: string, isoStr: string) => {
    if (!isoStr) return;
    const parts = isoStr.split("-");
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d);
    const fmt = dateFormats[key] || "name";
    handleInputChange(key, formatDateValue(dateObj, fmt));
  };

  // Replaces {{variable}} tags in HTML with real-time values
  const buildRenderedHtml = (dataMap: { [key: string]: string }, isPublishing: boolean): string => {
    let html = template.konten_html || "";
    const vars = template.variabel || [];

    for (const v of vars) {
      const val = dataMap[v.kunci_variabel];

      let replacement: string;
      if (val && val.trim() !== "") {
        if (val === "[DRAF - BELUM TERBIT]" && !isPublishing) {
          replacement = `<span style="background-color: #fef3c7; color: #b45309; border: 1px dashed #f59e0b; padding: 1px 6px; border-radius: 2px; font-weight: bold; font-size: 0.9em;">[DRAF - BELUM TERBIT]</span>`;
        } else {
          replacement = val;
        }
      } else {
        replacement = `<span style="background-color: #fee2e2; color: #b91c1c; padding: 0 4px; border-radius: 2px;">[${v.label_input}]</span>`;
      }

      html = html.replaceAll(`{{${v.kunci_variabel}}}`, replacement);
      // Also match in case user formatted within or around curly brackets
      const varRegex = new RegExp(`\\{\\{\\s*(?:<[^>]+>)*\\s*${v.kunci_variabel}\\s*(?:<[^>]+>)*\\s*\\}\\}`, "gi");
      html = html.replace(varRegex, replacement);
    }

    return html;
  };

  const renderedHtml = useMemo(() => {
    return buildRenderedHtml(formData, false);
  }, [template, formData]);

  // Ensure real official document number before publishing (printing / export)
  const ensureOfficialDocNumber = async (): Promise<string> => {
    let currentNumber = formData["nomor_surat"];
    if (!currentNumber || currentNumber === "[DRAF - BELUM TERBIT]") {
      const officialNum = await BikinsuratAPI.fetchNextDocNumber(template.id, template.pola_penomoran);
      setFormData((prev) => ({ ...prev, nomor_surat: officialNum }));
      currentNumber = officialNum;
    }
    return currentNumber;
  };

  // Divider Resizing Logic
  const handleMouseDown = () => {
    isDraggingDivider.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingDivider.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
      if (newRatio >= 25 && newRatio <= 75) {
        setSplitRatio(Math.round(newRatio));
      }
    };

    const handleMouseUp = () => {
      if (isDraggingDivider.current) {
        isDraggingDivider.current = false;
        document.body.style.cursor = "default";
        document.body.style.removeProperty("user-select");
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const triggerToast = (message: string, type: "success" | "info" = "success") => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  // Actions
  const handleNativePrint = async () => {
    try {
      const docNum = await ensureOfficialDocNumber();
      const updatedData = { ...formData, nomor_surat: docNum };
      const finalHtml = buildRenderedHtml(updatedData, true);

      // Inject dynamic @page size style for native print
      const styleId = "print-dynamic-page-size";
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      const orient = template.orientasi === "LANDSCAPE" ? "landscape" : "portrait";
      const sz = template.ukuran_kertas === "F4" ? "215mm 330mm" : template.ukuran_kertas === "LETTER" ? "letter" : "A4";
      styleEl.innerHTML = `@page { size: ${sz} ${orient} !important; margin: 0 !important; }`;

      await BikinsuratAPI.recordDocumentHistory({
        template_id: template.id,
        document_number: docNum,
        document_title: template.judul,
        recipient_name: recipientName.trim() || detectRecipientFromData(updatedData) || "-",
        filled_values_json: JSON.stringify(updatedData),
        rendered_preview_html: finalHtml,
        export_format: "CETAK_LANGSUNG",
      });

      if (currentDraftId) {
        await BikinsuratAPI.deleteDraft(currentDraftId);
        setCurrentDraftId(null);
      }

      setIsDirty(false);
      if (onDocumentGenerated) onDocumentGenerated();
      triggerToast("Membuka dialog cetak sistem...", "info");
      window.print();
    } catch (err) {
      console.error(err);
      window.print();
    }
  };

  const handleExportPdf = async () => {
    try {
      const docNum = await ensureOfficialDocNumber();
      const updatedData = { ...formData, nomor_surat: docNum };
      const finalHtml = buildRenderedHtml(updatedData, true);

      const orient = template.orientasi === "LANDSCAPE" ? "landscape" : "portrait";
      const sz = template.ukuran_kertas === "F4" ? [215, 330] : template.ukuran_kertas === "LETTER" ? "letter" : "a4";

      const opt = {
        margin: [
          template.margin_atas_mm || 20,
          template.margin_kiri_mm || 25,
          template.margin_bawah_mm || 20,
          template.margin_kanan_mm || 20,
        ],
        filename: `${template.judul.replace(/[^a-zA-Z0-9]/g, "_")}_${docNum.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: sz, orientation: orient },
      };

      // @ts-expect-error html2pdf is globally imported in index.html
      if (typeof window.html2pdf === "function") {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = finalHtml;
        // @ts-expect-error html2pdf external library
        await window.html2pdf().set(opt).from(tempDiv).save();
      } else {
        window.print();
      }

      await BikinsuratAPI.recordDocumentHistory({
        template_id: template.id,
        document_number: docNum,
        document_title: template.judul,
        recipient_name: recipientName.trim() || detectRecipientFromData(updatedData) || "-",
        filled_values_json: JSON.stringify(updatedData),
        rendered_preview_html: finalHtml,
        export_format: "PDF",
      });

      if (currentDraftId) {
        await BikinsuratAPI.deleteDraft(currentDraftId);
        setCurrentDraftId(null);
      }

      setIsDirty(false);
      if (onDocumentGenerated) onDocumentGenerated();
      triggerToast("Dokumen PDF berhasil diekspor!", "success");
    } catch (err) {
      console.error("Gagal ekspor PDF:", err);
      triggerToast("Gagal menghasilkan PDF", "info");
    }
  };

  const handleExportDocx = async () => {
    try {
      const docNum = await ensureOfficialDocNumber();
      const updatedData = { ...formData, nomor_surat: docNum };
      const finalHtml = buildRenderedHtml(updatedData, true);

      const cleanFileName = `${template.judul.replace(/[^a-zA-Z0-9]/g, "_")}_${docNum.replace(/[^a-zA-Z0-9]/g, "-")}.docx`;
      await exportToDocx({
        title: template.judul,
        htmlContent: finalHtml,
        fileName: cleanFileName,
        marginTopMm: template.margin_atas_mm,
        marginBottomMm: template.margin_bawah_mm,
        marginLeftMm: template.margin_kiri_mm,
        marginRightMm: template.margin_kanan_mm,
        paperSize: template.ukuran_kertas,
        orientation: template.orientasi,
      });

      await BikinsuratAPI.recordDocumentHistory({
        template_id: template.id,
        document_number: docNum,
        document_title: template.judul,
        recipient_name: recipientName.trim() || detectRecipientFromData(updatedData) || "-",
        filled_values_json: JSON.stringify(updatedData),
        rendered_preview_html: finalHtml,
        export_format: "DOCX",
      });

      if (currentDraftId) {
        await BikinsuratAPI.deleteDraft(currentDraftId);
        setCurrentDraftId(null);
      }

      setIsDirty(false);
      if (onDocumentGenerated) onDocumentGenerated();
      triggerToast("Dokumen DOCX berhasil diunduh!", "success");
    } catch (err) {
      console.error("Gagal ekspor DOCX:", err);
      triggerToast("Gagal menghasilkan berkas DOCX", "info");
    }
  };

  // Explicit Save Draft to SQLite
  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);
      const title = draftTitle.trim() || `${template.judul} (Draf)`;
      const draftId = await BikinsuratAPI.saveDraft({
        id: currentDraftId || undefined,
        templat_id: template.id,
        judul_draf: title,
        nilai_isian_json: JSON.stringify(formData),
        hasil_pratinjau_html: renderedHtml,
      });

      setCurrentDraftId(draftId);
      setIsDirty(false);
      triggerToast(`Draf "${title}" berhasil disimpan!`, "success");
    } catch (err) {
      console.error("Gagal simpan draf:", err);
      triggerToast("Gagal menyimpan draf", "info");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Reset to New Fresh Letter
  const handleNewLetter = () => {
    if (confirm("Buat surat baru? Isian saat ini akan dibersihkan.")) {
      setCurrentDraftId(null);
      const resetData: { [key: string]: string } = {};
      (template.variabel || []).forEach((v) => {
        if (v.tipe_variabel === "SYSTEM_CURRENT_DATE") {
          resetData[v.kunci_variabel] = formatDateValue(new Date(), "name");
        } else if (v.tipe_variabel === "SYSTEM_DOC_NUMBER") {
          resetData[v.kunci_variabel] = "[DRAF - BELUM TERBIT]";
        } else if (v.nilai_bawaan) {
          resetData[v.kunci_variabel] = v.nilai_bawaan;
        } else {
          resetData[v.kunci_variabel] = "";
        }
      });
      setFormData(resetData);
      setDraftTitle(template.judul);
      setIsDirty(false);
      triggerToast("Mulai membuat surat baru", "info");
    }
  };

  // Check unsaved changes before exiting
  const handleAttemptBack = () => {
    if (isDirty) {
      setShowExitModal(true);
    } else {
      if (onBackToCatalog) onBackToCatalog();
    }
  };

  // Render Form Input Element
  const renderFieldInput = (v: VariableItem) => {
    const val = formData[v.kunci_variabel] || "";
    const activeDateFormat = dateFormats[v.kunci_variabel] || "name";

    switch (v.tipe_variabel) {
      case "LONG_TEXT":
        return (
          <textarea
            rows={3}
            value={val}
            onChange={(e) => handleInputChange(v.kunci_variabel, e.target.value)}
            placeholder={`Masukkan ${v.label_input.toLowerCase()}...`}
            className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition"
          />
        );

      case "CURRENCY":
        return (
          <input
            type="text"
            value={val}
            onChange={(e) => handleCurrencyChange(v.kunci_variabel, e.target.value)}
            placeholder="Rp 0"
            className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition"
          />
        );

      case "DATE":
        return (
          <div className="space-y-1.5">
            <div className="flex items-center space-x-1.5">
              <input
                type="text"
                value={val}
                onChange={(e) => handleInputChange(v.kunci_variabel, e.target.value)}
                placeholder="Contoh: 25 Oktober 2026"
                className="flex-1 px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition"
              />
              <div className="relative">
                <input
                  type="date"
                  onChange={(e) => handleDatePicked(v.kunci_variabel, e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  title="Pilih Tanggal dari Kalender"
                />
                <button
                  type="button"
                  className="p-1.5 rounded-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 transition pointer-events-none"
                >
                  <Calendar className="w-4 h-4 text-blue-500" />
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-[10px] text-zinc-400">Format:</span>
              <button
                type="button"
                onClick={() => handleFormatChange(v.kunci_variabel, "name")}
                className={`px-1.5 py-0.5 rounded-xs text-[9px] font-medium transition cursor-pointer ${activeDateFormat === "name"
                  ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200"
                  }`}
              >
                Nama Bulan
              </button>
              <button
                type="button"
                onClick={() => handleFormatChange(v.kunci_variabel, "slash")}
                className={`px-1.5 py-0.5 rounded-xs text-[9px] font-medium transition cursor-pointer ${activeDateFormat === "slash"
                  ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200"
                  }`}
              >
                DD/MM/YYYY
              </button>
              <button
                type="button"
                onClick={() => handleFormatChange(v.kunci_variabel, "dash")}
                className={`px-1.5 py-0.5 rounded-xs text-[9px] font-medium transition cursor-pointer ${activeDateFormat === "dash"
                  ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200"
                  }`}
              >
                YYYY-MM-DD
              </button>
            </div>
          </div>
        );

      case "DROPDOWN": {
        let options: string[] = [];
        if (v.konfigurasi_json) {
          try {
            const parsed = JSON.parse(v.konfigurasi_json);
            const opts = parsed.options || parsed.opsi;
            if (Array.isArray(opts)) options = opts;
          } catch {
            options = ["Opsi 1", "Opsi 2"];
          }
        }
        if (options.length === 0) options = ["Pilihan 1", "Pilihan 2"];
        return (
          <select
            value={val || options[0] || ""}
            onChange={(e) => handleInputChange(v.kunci_variabel, e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition cursor-pointer"
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      }

      case "SYSTEM_DOC_NUMBER":
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5">
              <input
                type="text"
                value={val}
                onChange={(e) => handleInputChange(v.kunci_variabel, e.target.value)}
                className={`w-full px-2.5 py-1.5 border rounded-sm text-xs font-mono font-semibold focus:outline-none focus:border-blue-500 transition ${val === "[DRAF - BELUM TERBIT]"
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                  : "bg-zinc-100 dark:bg-zinc-800/80 border-zinc-300 dark:border-zinc-700 text-blue-600 dark:text-blue-400"
                  }`}
              />
              <button
                type="button"
                onClick={async () => {
                  const nextNum = await BikinsuratAPI.fetchNextDocNumber(template.id, template.pola_penomoran);
                  handleInputChange(v.kunci_variabel, nextNum);
                  triggerToast("Nomor surat resmi diterbitkan sekarang!", "info");
                }}
                className="px-2 py-1.5 rounded-sm bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-[10px] font-semibold text-blue-700 dark:text-blue-300 shrink-0 border border-blue-200 dark:border-blue-800 transition cursor-pointer"
                title="Terbitkan Nomor Resmi Sekarang (Menaikkan Urutan Counter)"
              >
                Terbitkan
              </button>
            </div>
            <p className="text-[10px] text-zinc-400">
              {val === "[DRAF - BELUM TERBIT]"
                ? "Nomor resmi otomatis diterbitkan saat cetak / ekspor agar tidak membuang urutan."
                : `Format: ${template.pola_penomoran || "{{NOMOR}}/SK-DIR/{{BULAN_ROMAWI}}/{{TAHUN}}"}`}
            </p>
          </div>
        );

      case "SYSTEM_CURRENT_DATE":
        return (
          <div className="space-y-1.5">
            <div className="flex items-center space-x-1.5">
              <input
                type="text"
                value={val}
                onChange={(e) => handleInputChange(v.kunci_variabel, e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
              />
              <div className="relative">
                <input
                  type="date"
                  onChange={(e) => handleDatePicked(v.kunci_variabel, e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  title="Pilih Tanggal Hari Ini"
                />
                <button
                  type="button"
                  className="p-1.5 rounded-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 pointer-events-none"
                >
                  <Calendar className="w-4 h-4 text-blue-500" />
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <input
            type={v.tipe_variabel === "NUMBER" ? "number" : "text"}
            value={val}
            onChange={(e) => handleInputChange(v.kunci_variabel, e.target.value)}
            placeholder={`Masukkan ${v.label_input.toLowerCase()}...`}
            className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition"
          />
        );
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex overflow-hidden relative bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 select-none h-full"
    >
      {/* Toast Notification */}
      {showToast && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 px-3 py-1.5 rounded-sm bg-zinc-900/90 text-white text-xs shadow-lg backdrop-blur border border-zinc-700 animate-fade-in">
          {showToast.type === "success" ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          )}
          <span>{showToast.message}</span>
        </div>
      )}

      {/* SISI KIRI: Dynamic Form Panel (print-hidden) */}
      <div
        style={{ width: `${splitRatio}%` }}
        className="print-hidden flex flex-col border-r border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/95 shrink-0 overflow-hidden h-full"
      >
        {/* Form Header: Quick Template Switcher & Workspace Actions */}
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shrink-0 space-y-2.5">
          {/* Row 1: Template Switcher + Edit Templat */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {onBackToCatalog && (
                <button
                  onClick={handleAttemptBack}
                  className="p-1.5 rounded-sm bg-zinc-200/70 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer shrink-0"
                  title="Kembali ke Pilihan Surat & Draf"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              {/* Template Switcher Dropdown */}
              <div className="flex-1 min-w-0">
                <select
                  value={template.id}
                  onChange={(e) => {
                    const found = templates.find((t) => t.id === e.target.value);
                    if (found) {
                      onSelectTemplate(found);
                    }
                  }}
                  className="w-full text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm px-2 py-1.5 focus:outline-none focus:border-blue-500 truncate cursor-pointer shadow-2xs"
                  title="Pilih Jenis Surat / Templat"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.judul} [{t.kategori || "Umum"}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Button: Edit Templat Ini */}
            <div className="flex items-center space-x-1 shrink-0">
              {onEditTemplate && (
                <button
                  onClick={() => onEditTemplate(template)}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                  title="Edit format dan naskah templat ini"
                >
                  <Edit3 className="w-3 h-3 text-blue-500" />
                  <span>Edit Templat</span>
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Status Draf, Surat Baru, Simpan Draf */}
          <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleNewLetter}
                className="flex items-center space-x-1 px-2 py-1 rounded-sm text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="Bersihkan isian untuk membuat surat baru"
              >
                <PlusCircle className="w-3 h-3" />
                <span>Surat Baru</span>
              </button>

              {currentDraftId && (
                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-sm border border-amber-200 dark:border-amber-800">
                  Mode Draf Aktif
                </span>
              )}
            </div>

            <button
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-sm bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 text-xs font-semibold shadow-xs transition cursor-pointer"
              title="Simpan Isian sebagai Draf (Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingDraft ? "Menyimpan..." : "Simpan Draf"}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Center: Variable Form Inputs (No inline drafts list) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Judul / Catatan Draf */}
          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-sm border border-zinc-200 dark:border-zinc-800 space-y-1">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Nama / Catatan Draf Surat
            </label>
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => {
                setDraftTitle(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Contoh: Surat Tugas Lapangan Pak Budi"
              className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Penerima / Pemohon (Untuk Pencatatan Buku Riwayat) */}
          <div className="p-2.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-sm border border-blue-200 dark:border-blue-800/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Penerima / Pemohon (Buku Riwayat)</span>
              </label>
              <span className="text-[9px] text-zinc-400 font-mono">
                {isCustomRecipient ? "Manual" : "Otomatis dari isian"}
              </span>
            </div>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => {
                setRecipientName(e.target.value);
                setIsCustomRecipient(true);
                setIsDirty(true);
              }}
              placeholder="Contoh: Nama orang / pegawai penerima..."
              className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
            />
            <p className="text-[9px] text-zinc-500 dark:text-zinc-400 leading-tight">
              Dicatat pada kolom Penerima/Pemohon di Buku Riwayat Surat. Terisi otomatis dari variabel nama atau dapat Anda edit manual.
            </p>
          </div>

          {/* Dynamic Input Fields */}
          <div className="space-y-3.5">
            {template.variabel && template.variabel.length > 0 ? (
              template.variabel.map((v) => {
                return (
                  <div key={v.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                        {v.label_input}
                        {v.wajib_diisi && (
                          <span className="text-rose-500 ml-0.5">*</span>
                        )}
                      </label>
                      <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500">
                        {"{{" + v.kunci_variabel + "}}"}
                      </span>
                    </div>
                    {renderFieldInput(v)}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-zinc-400">
                Tidak ada variabel isian pada templat ini.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RESIZABLE SPLIT DIVIDER (print-hidden) */}
      <div
        onMouseDown={handleMouseDown}
        className="print-hidden w-1.5 hover:w-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-blue-500 dark:hover:bg-blue-500 cursor-col-resize shrink-0 transition-colors relative group select-none"
        title="Geser untuk mengatur lebar panel formulir"
      >
        <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-3 h-8 rounded-sm bg-zinc-400 dark:bg-zinc-600 group-hover:bg-blue-500 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="w-0.5 h-3 bg-white"></div>
        </div>
      </div>

      {/* SISI KANAN: Digital Paper Live Preview Canvas */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-zinc-200 dark:bg-zinc-950 h-full">
        {/* FLOATING ACTION TOOLBAR AT TOP (print-hidden) */}
        <div className="print-hidden floating-toolbar absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1 px-2.5 py-1.5 rounded-sm bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-700 shadow-md backdrop-blur select-none">
          {/* Zoom controls */}
          <button
            onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
            className="p-1 rounded-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="Perkecil Zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-zinc-500 w-10 text-center">
            {zoomLevel}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
            className="p-1 rounded-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="Perbesar Zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(100)}
            className="p-1 rounded-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition cursor-pointer"
            title="Reset Zoom (100%)"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-1"></div>

          {/* Reset form data */}
          <button
            onClick={handleNewLetter}
            className="px-2 py-1 rounded-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs transition cursor-pointer"
            title="Reset formulir isian"
          >
            Bersihkan
          </button>

          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-1"></div>

          {/* Export Actions: DOCX, PDF, Print */}
          <button
            onClick={handleExportDocx}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-sm bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium transition cursor-pointer"
            title="Ekspor ke Microsoft Word (.docx)"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Word (DOCX)</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-sm bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium transition cursor-pointer"
            title="Unduh sebagai berkas PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>PDF</span>
          </button>

          <button
            onClick={handleNativePrint}
            className="flex items-center space-x-1 px-3 py-1 rounded-sm bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-xs transition cursor-pointer"
            title="Cetak langsung menggunakan printer (Ctrl+P)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak</span>
          </button>
        </div>

        {/* Paper Canvas Scroll Area */}
        <div className="flex-1 overflow-auto p-8 pt-16 flex justify-center items-start">
          <div
            style={{
              width: paperDims.width,
              minHeight: paperDims.minHeight,
              paddingTop: `${template.margin_atas_mm || 20}mm`,
              paddingBottom: `${template.margin_bawah_mm || 20}mm`,
              paddingLeft: `${template.margin_kiri_mm || 25}mm`,
              paddingRight: `${template.margin_kanan_mm || 20}mm`,
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
            }}
            className="document-paper font-serif text-[12pt] leading-relaxed relative outline-none select-text shadow-xl"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>
      </div>

      {/* Unsaved Changes Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm shadow-xl max-w-sm w-full p-4 space-y-3 animate-scale-in">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Perubahan Belum Disimpan
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
              Anda telah mengisi atau mengubah data surat ini. Pilih tindakan sebelum meninggalkan halaman:
            </p>
            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={async () => {
                  await handleSaveDraft();
                  setShowExitModal(false);
                  setIsDirty(false);
                  if (onBackToCatalog) onBackToCatalog();
                }}
                className="w-full py-1.5 px-3 rounded-sm bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Simpan Draf & Keluar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitModal(false);
                  setIsDirty(false);
                  if (onBackToCatalog) onBackToCatalog();
                }}
                className="w-full py-1.5 px-3 rounded-sm bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold transition cursor-pointer"
              >
                Tetap Keluar (Buang Isian)
              </button>
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="w-full py-1.5 px-3 rounded-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition cursor-pointer"
              >
                Kembali & Lanjutkan Mengisi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
