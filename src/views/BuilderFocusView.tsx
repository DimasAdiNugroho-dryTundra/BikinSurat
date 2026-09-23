import React, { useState, useEffect, useRef } from "react";
import {
  TemplateItem,
  VariableItem,
  VariableType,
} from "@/types";
import { BikinsuratAPI } from "@/lib/ipc";
import {
  ArrowLeft,
  Save,
  Plus,
  Tag,
  Sliders,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckCircle2,
  Trash2,
  Table as TableIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Hash,
  X,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";

interface BuilderFocusViewProps {
  initialTemplate?: TemplateItem | null;
  onBackToCatalog: () => void;
  onSaved: () => void;
}

export const BuilderFocusView: React.FC<BuilderFocusViewProps> = ({
  initialTemplate,
  onBackToCatalog,
  onSaved,
}) => {
  const [judul, setJudul] = useState(initialTemplate?.judul || "Templat Surat Baru");
  const [kategori, setKategori] = useState(initialTemplate?.kategori || "Umum");
  const [deskripsi, setDeskripsi] = useState(initialTemplate?.deskripsi || "");
  const [polaPenomoran, setPolaPenomoran] = useState(
    initialTemplate?.pola_penomoran || "{{NOMOR}}/SK-DIR/{{BULAN_ROMAWI}}/{{TAHUN}}"
  );
  const [counterTerakhir, setCounterTerakhir] = useState(
    initialTemplate?.counter_terakhir ?? 0
  );
  const [tahunPenomoran, setTahunPenomoran] = useState<number>(
    initialTemplate?.tahun_penomoran ?? new Date().getFullYear()
  );
  const [ukuranKertas, setUkuranKertas] = useState<"A4" | "F4" | "LETTER">(
    initialTemplate?.ukuran_kertas || "A4"
  );
  const [orientasi, setOrientasi] = useState<"PORTRAIT" | "LANDSCAPE">(
    initialTemplate?.orientasi || "PORTRAIT"
  );
  const [marginTop, setMarginTop] = useState(initialTemplate?.margin_atas_mm || 25);
  const [marginBottom, setMarginBottom] = useState(initialTemplate?.margin_bawah_mm || 20);
  const [marginLeft, setMarginLeft] = useState(initialTemplate?.margin_kiri_mm || 25);
  const [marginRight, setMarginRight] = useState(initialTemplate?.margin_kanan_mm || 20);

  const [selectedFont, setSelectedFont] = useState("Times New Roman");
  const [selectedSize, setSelectedSize] = useState("3");
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Unsaved changes state
  const [isDirty, setIsDirty] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Dropdown options state
  const [dropdownOptions, setDropdownOptions] = useState<string[]>(["Opsi 1", "Opsi 2"]);
  const [newOptionInput, setNewOptionInput] = useState("");

  // Table Modal State
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(2);
  const [tableCols, setTableCols] = useState(2);
  const [tableBordered, setTableBordered] = useState(false);

  const [variables, setVariables] = useState<VariableItem[]>(
    initialTemplate?.variabel || [
      {
        id: "v-new-1",
        templat_id: "",
        kunci_variabel: "nomor_surat",
        label_input: "Nomor Surat",
        tipe_variabel: "SYSTEM_DOC_NUMBER",
        wajib_diisi: true,
        urutan_tampil: 1,
      },
      {
        id: "v-new-2",
        templat_id: "",
        kunci_variabel: "nama_penerima",
        label_input: "Nama Penerima",
        tipe_variabel: "SHORT_TEXT",
        wajib_diisi: true,
        urutan_tampil: 2,
      },
    ]
  );

  const [newVarKey, setNewVarKey] = useState("");
  const [newVarLabel, setNewVarLabel] = useState("");
  const [newVarType, setNewVarType] = useState<VariableType>("SHORT_TEXT");

  const [htmlContent, setHtmlContent] = useState(
    initialTemplate?.konten_html ||
    `<div style="text-align: center; margin-bottom: 25px;">
  <h2 style="font-size: 16pt; font-weight: bold; margin: 0; text-decoration: underline;">SURAT RESMI</h2>
  <p style="margin: 4px 0 0 0; font-size: 11pt;">Nomor: {{nomor_surat}}</p>
</div>

<p>Yang bertanda tangan di bawah ini menerangkan bahwa:</p>
<table style="width: 100%; margin-left: 20px; margin-bottom: 15px; border-collapse: collapse;">
  <tr>
    <td style="width: 180px; padding: 4px 0;">Nama Lengkap</td>
    <td style="width: 20px;">:</td>
    <td><strong>{{nama_penerima}}</strong></td>
  </tr>
</table>

<p>Demikian surat ini dibuat untuk dipergunakan sebagaimana mestinya.</p>`
  );

  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditorInitialized = useRef(false);
  const selectionRangeRef = useRef<Range | null>(null);

  // Save caret / selection position
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        selectionRangeRef.current = range.cloneRange();
      }
    }
  };

  // Restore caret position
  const restoreSelection = () => {
    if (selectionRangeRef.current && editorRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(selectionRangeRef.current);
      }
    }
  };

  // Convert raw html with {{key}} into editor HTML with editable and styleable tags
  const toEditorHtml = (rawHtml: string) => {
    return rawHtml.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_m, key) => {
      return `<span class="variable-tag text-blue-600 dark:text-blue-400 font-mono font-semibold">{{${key}}}</span>`;
      return `<span class="variable-tag text-blue-600 dark:text-blue-400 font-mono font-semibold" style="user-select: all; -webkit-user-select: all; cursor: pointer;">{{${key}}}</span>`;
    });
  };

  // Convert editor tags back into clean html while preserving formatting
  const fromEditorHtml = (html: string) => {
    // 1. Unwrap variable-tag styling spans so formatting applied to/inside the tag is preserved
    let clean = html.replace(/<span class="variable-tag[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, "$1");
    // 2. Also unwrap any legacy variable chips if present
    clean = clean.replace(/<span[^>]*data-var-key="([^"]+)"[^>]*>.*?<\/span>/gi, "{{$1}}");
    return clean;
  };

  // Sync editor content
  useEffect(() => {
    if (editorRef.current && !isEditorInitialized.current) {
      editorRef.current.innerHTML = toEditorHtml(htmlContent);
      isEditorInitialized.current = true;
    }
  }, []);

  // Execute formatting command
  const execCmd = (cmd: string, val: string = "") => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      setHtmlContent(fromEditorHtml(editorRef.current.innerHTML));
      setIsDirty(true);
      saveSelection();
    }
  };

  // Insert tag into editor at cursor
  const insertTagAtCursor = (key: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    if (selectionRangeRef.current) {
      restoreSelection();
    }
    const tagHtml = `<span class="variable-tag text-blue-600 dark:text-blue-400 font-mono font-semibold" style="user-select: all; -webkit-user-select: all; cursor: pointer;">{{${key}}}</span>&nbsp;`;
    document.execCommand("insertHTML", false, tagHtml);
    saveSelection();
    setHtmlContent(fromEditorHtml(editorRef.current.innerHTML));
    setIsDirty(true);
  };

  // Handle clicking on variable tag: select whole tag atomically
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const tag = target.closest(".variable-tag") as HTMLElement | null;
    if (tag) {
      const sel = window.getSelection();
      if (sel) {
        const range = document.createRange();
        range.selectNode(tag);
        sel.removeAllRanges();
        sel.addRange(range);
        saveSelection();
      }
    }
  };

  // Insert Table Modal Submit
  const handleInsertTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorRef.current) return;

    editorRef.current.focus();
    const borderStyle = tableBordered
      ? "border: 1px solid #d1d5db;"
      : "border: none;";
    const cellBorderStyle = tableBordered
      ? "border: 1px solid #d1d5db; padding: 6px 10px;"
      : "padding: 4px 0;";

    let rowsHtml = "";
    for (let r = 0; r < tableRows; r++) {
      let cellsHtml = "";
      for (let c = 0; c < tableCols; c++) {
        const placeholder = `Kolom ${c + 1}`;
        cellsHtml += `<td style="${cellBorderStyle}">${placeholder}</td>`;
      }
      rowsHtml += `<tr>${cellsHtml}</tr>`;
    }

    const tableHtml = `
<table style="width: 100%; margin-bottom: 15px; border-collapse: collapse; ${borderStyle}">
  <tbody>
    ${rowsHtml}
  </tbody>
</table>
<p></p>`;

    document.execCommand("insertHTML", false, tableHtml);
    if (editorRef.current) {
      setHtmlContent(fromEditorHtml(editorRef.current.innerHTML));
    }
    setIsDirty(true);
    setShowTableModal(false);
  };

  // Insert Image via File Picker
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (editorRef.current) {
        editorRef.current.focus();
        const imgHtml = `<p style="text-align: center; margin: 10px 0;"><img src="${dataUrl}" alt="${file.name}" style="max-width: 240px; height: auto;" /></p><p></p>`;
        document.execCommand("insertHTML", false, imgHtml);
        setHtmlContent(fromEditorHtml(editorRef.current.innerHTML));
        setIsDirty(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Intercept KeyDown for MS Word experience:
  // - Tab inserts 4 non-breaking spaces instead of shifting focus
  // - Shortcuts: Ctrl+B (Bold), Ctrl+I (Italic), Ctrl+U (Underline), Ctrl+S (Strikethrough / Coret)
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
      if (editorRef.current) {
        setHtmlContent(fromEditorHtml(editorRef.current.innerHTML));
        setIsDirty(true);
      }
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        e.stopPropagation();
        execCmd("bold");
      } else if (key === "i") {
        e.preventDefault();
        e.stopPropagation();
        execCmd("italic");
      } else if (key === "u") {
        e.preventDefault();
        e.stopPropagation();
        execCmd("underline");
      } else if (key === "s") {
        // Ctrl+S executes Strikethrough (coret teks) per user specification
        e.preventDefault();
        e.stopPropagation();
        execCmd("strikeThrough");
      } else if (key === "l") {
        e.preventDefault();
        e.stopPropagation();
        execCmd("justifyLeft");
      } else if (key === "e") {
        e.preventDefault();
        e.stopPropagation();
        execCmd("justifyCenter");
      } else if (key === "r") {
        e.preventDefault();
        e.stopPropagation();
        execCmd("justifyRight");
      } else if (key === "j") {
        e.preventDefault();
        e.stopPropagation();
        execCmd("justifyFull");
      } else if (key === "z") {
        e.preventDefault();
        e.stopPropagation();
        execCmd("undo");
      } else if (key === "y") {
        e.preventDefault();
        e.stopPropagation();
        execCmd("redo");
      }
    }
  };

  // Add variable
  const handleAddVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVarKey.trim() || !newVarLabel.trim()) return;

    const formattedKey = newVarKey.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    let konfigurasiJson: string | undefined = undefined;
    if (newVarType === "DROPDOWN") {
      const validOptions = dropdownOptions.filter((o) => o.trim() !== "");
      konfigurasiJson = JSON.stringify({
        options: validOptions.length > 0 ? validOptions : ["Pilihan 1", "Pilihan 2"],
      });
    }

    const newVar: VariableItem = {
      id: `var-${Date.now()}`,
      templat_id: initialTemplate?.id || "",
      kunci_variabel: formattedKey,
      label_input: newVarLabel.trim(),
      tipe_variabel: newVarType,
      wajib_diisi: true,
      urutan_tampil: variables.length + 1,
      konfigurasi_json: konfigurasiJson,
    };

    setVariables([...variables, newVar]);
    setNewVarKey("");
    setNewVarLabel("");
    setDropdownOptions(["Opsi 1", "Opsi 2"]);
    setNewOptionInput("");
    setIsDirty(true);
  };

  const handleDeleteVariable = (id: string) => {
    setVariables(variables.filter((v) => v.id !== id));
    setIsDirty(true);
  };

  // Save template (as published or draft)
  const handleSave = async (isDraft: boolean = false) => {
    setIsSaving(true);
    try {
      const cleanHtml = editorRef.current
        ? fromEditorHtml(editorRef.current.innerHTML)
        : htmlContent;

      const payload: TemplateItem = {
        id: initialTemplate?.id || "",
        judul,
        deskripsi,
        kategori,
        konten_json: "{}",
        konten_html: cleanHtml,
        ukuran_kertas: ukuranKertas,
        orientasi,
        margin_atas_mm: marginTop,
        margin_bawah_mm: marginBottom,
        margin_kiri_mm: marginLeft,
        margin_kanan_mm: marginRight,
        apakah_favorit: initialTemplate?.apakah_favorit || false,
        apakah_draf: isDraft,
        pola_penomoran: polaPenomoran,
        counter_terakhir: counterTerakhir,
        tahun_penomoran: tahunPenomoran,
        variabel: variables,
      };

      await BikinsuratAPI.saveTemplate(payload);
      setIsDirty(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Navigation guard
  const handleAttemptBack = () => {
    if (isDirty) {
      setShowExitModal(true);
    } else {
      onBackToCatalog();
    }
  };

  // Paper size dimensions helper
  const getPaperDimensions = () => {
    const sizes: Record<string, { w: number; h: number }> = {
      A4: { w: 210, h: 297 },
      F4: { w: 215, h: 330 },
      LETTER: { w: 216, h: 279 },
    };
    const size = sizes[ukuranKertas] || sizes.A4;
    if (orientasi === "LANDSCAPE") {
      return { width: `${size.h}mm`, minHeight: `${size.w}mm` };
    }
    return { width: `${size.w}mm`, minHeight: `${size.h}mm` };
  };

  const paperDimensions = getPaperDimensions();

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden select-none relative">
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Insert Table Modal */}
      {showTableModal && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm shadow-xl w-full max-w-sm p-4 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <h3 className="font-bold text-xs flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                <TableIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Sisipkan Tabel ke Naskah
              </h3>
              <button
                onClick={() => setShowTableModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInsertTable} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Jumlah Baris
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={tableRows}
                    onChange={(e) => setTableRows(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Jumlah Kolom
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={tableCols}
                    onChange={(e) => setTableCols(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Model Tampilan
                </label>
                <select
                  value={tableBordered ? "bordered" : "borderless"}
                  onChange={(e) => setTableBordered(e.target.value === "bordered")}
                  className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs"
                >
                  <option value="borderless">Tanpa Garis (Format Kolom / Identitas Surat)</option>
                  <option value="bordered">Dengan Garis Kotak (Tabel Data / Lampiran)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="px-3 py-1.5 rounded-sm text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-sm bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  Sisipkan Tabel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 px-3 py-1.5 rounded-sm bg-zinc-900 text-white text-xs shadow-lg border border-zinc-700 animate-fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Templat berhasil disimpan ke basis data!</span>
        </div>
      )}

      {/* STICKY TOP RICH-TEXT TOOLBAR (MS Word Style) */}
      <div className="h-12 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleAttemptBack}
            className="p-1 rounded-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="Kembali ke Buat Surat"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={judul}
            onChange={(e) => {
              setJudul(e.target.value);
              setIsDirty(true);
            }}
            className="font-semibold text-xs px-2 py-1 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm border border-transparent focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition w-56"
            placeholder="Judul Templat..."
          />
        </div>

        {/* Rich-Text Formatting Buttons (Word style) */}
        <div className="flex items-center space-x-1 overflow-x-auto py-1">
          {/* Font Family */}
          <select
            value={selectedFont}
            onChange={(e) => {
              setSelectedFont(e.target.value);
              execCmd("fontName", e.target.value);
            }}
            className="text-[11px] px-1.5 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-sm cursor-pointer"
            title="Pilih Huruf (Font)"
          >
            <option value="Times New Roman">Times New Roman</option>
            <option value="Arial">Arial</option>
            <option value="Calibri">Calibri</option>
            <option value="Georgia">Georgia</option>
            <option value="Courier New">Courier New</option>
          </select>

          {/* Font Size */}
          <select
            value={selectedSize}
            onChange={(e) => {
              setSelectedSize(e.target.value);
              execCmd("fontSize", e.target.value);
            }}
            className="text-[11px] px-1 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-sm cursor-pointer"
            title="Ukuran Huruf"
          >
            <option value="1">10 pt</option>
            <option value="2">11 pt</option>
            <option value="3">12 pt</option>
            <option value="4">14 pt</option>
            <option value="5">18 pt</option>
            <option value="6">24 pt</option>
          </select>

          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-0.5"></div>

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={() => execCmd("undo")}
            className="p-1.5 rounded-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd("redo")}
            className="p-1.5 rounded-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-0.5"></div>

          {/* Style buttons */}
          <div className="flex items-center space-x-0.5 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-sm border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => execCmd("bold")}
              className="p-1.5 rounded-sm hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              title="Tebal (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("italic")}
              className="p-1.5 rounded-sm hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              title="Miring (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("underline")}
              className="p-1.5 rounded-sm hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              title="Garis Bawah (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("strikeThrough")}
              className="p-1.5 rounded-sm hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              title="Coretan (Ctrl+S)"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Align buttons */}
          <div className="flex items-center space-x-0.5 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-sm border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => execCmd("justifyLeft")}
              className="p-1.5 rounded-sm hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              title="Rata Kiri (Ctrl+L)"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("justifyCenter")}
              className="p-1.5 rounded-sm hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              title="Rata Tengah (Ctrl+E)"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("justifyRight")}
              className="p-1.5 rounded-sm hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              title="Rata Kanan (Ctrl+R)"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("justifyFull")}
              className="p-1.5 rounded-sm hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              title="Rata Kanan Kiri / Justify (Ctrl+J)"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* List, Table, Image */}
          <div className="flex items-center space-x-0.5 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-sm border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => execCmd("insertUnorderedList")}
              className="p-1.5 rounded-sm hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              title="Daftar Bullet"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd("insertOrderedList")}
              className="p-1.5 rounded-sm hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              title="Daftar Bernomor"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setShowTableModal(true)}
              className="p-1.5 rounded-sm hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              title="Sisipkan Tabel"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-sm hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              title="Sisipkan Gambar / Logo"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-0.5"></div>

          {/* Zoom controls */}
          <div className="flex items-center space-x-0.5 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-sm border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
              className="p-1.5 rounded-sm hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              title="Perkecil / Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1 min-w-[36px] text-center text-zinc-700 dark:text-zinc-300 select-none">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}
              className="p-1.5 rounded-sm hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              title="Perbesar / Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(100)}
              className="p-1.5 rounded-sm hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              title="Reset Zoom (100%)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Save buttons */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-xs transition cursor-pointer"
            title="Simpan sebagai draf templat"
          >
            <Save className="w-3.5 h-3.5 text-amber-500" />
            <span>Simpan Draf</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-sm bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-xs transition cursor-pointer"
            title="Simpan dan terbitkan templat surat"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Menyimpan..." : "Simpan Templat"}</span>
          </button>
        </div>
      </div>

      {/* WORKSPACE AREA: Canvas & Right Variable Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* CENTER: Canvas Editor Paper Sheet */}
        <div className="flex-1 overflow-auto p-8 flex justify-center items-start bg-zinc-200 dark:bg-zinc-950">
          <div
            style={{
              width: paperDimensions.width,
              minHeight: paperDimensions.minHeight,
              paddingTop: `${marginTop}mm`,
              paddingBottom: `${marginBottom}mm`,
              paddingLeft: `${marginLeft}mm`,
              paddingRight: `${marginRight}mm`,
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
              marginBottom: zoomLevel > 100 ? `${(zoomLevel - 100) * 8}px` : "2rem",
            }}
            className="document-paper font-serif text-[12pt] leading-relaxed relative outline-none select-text cursor-text transition-all duration-200"
          >
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onClick={handleEditorClick}
              onKeyDown={handleEditorKeyDown}
              onKeyUp={saveSelection}
              onMouseUp={saveSelection}
              onSelect={saveSelection}
              onInput={() => {
                if (editorRef.current) {
                  setHtmlContent(fromEditorHtml(editorRef.current.innerHTML));
                  setIsDirty(true);
                  saveSelection();
                }
              }}
              className="outline-none min-h-[200mm]"
            />
          </div>
        </div>

        {/* RIGHT SIDEBAR: Variable Inspector & Paper Settings */}
        <div className="w-76 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-500" />
              Daftar Variabel & Tag
            </span>
            <span className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-sm text-zinc-600 dark:text-zinc-400">
              {variables.length}
            </span>
          </div>

          {/* List of Variables */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {variables.map((v) => (
              <div
                key={v.id}
                className="group flex items-center justify-between p-2 rounded-sm bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 transition"
              >
                <button
                  type="button"
                  onClick={() => insertTagAtCursor(v.kunci_variabel)}
                  className="flex-1 text-left min-w-0 cursor-pointer"
                  title="Klik untuk menyisipkan ke naskah"
                >
                  <span className="block font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 truncate">
                    {"{{" + v.kunci_variabel + "}}"}
                  </span>
                  <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                    {v.label_input} • {v.tipe_variabel}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteVariable(v.id)}
                  className="p-1 rounded-sm text-zinc-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  title="Hapus variabel"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Variable Form */}
          <form
            onSubmit={handleAddVariable}
            className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-2"
          >
            <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Tambah Variabel Baru
            </span>

            <input
              type="text"
              placeholder="kunci (misal: nama_karyawan)"
              value={newVarKey}
              onChange={(e) => setNewVarKey(e.target.value)}
              className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs font-mono"
            />

            <input
              type="text"
              placeholder="Label Form (misal: Nama Karyawan)"
              value={newVarLabel}
              onChange={(e) => setNewVarLabel(e.target.value)}
              className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs"
            />

            <div className="flex space-x-1">
              <select
                value={newVarType}
                onChange={(e) => setNewVarType(e.target.value as VariableType)}
                className="flex-1 px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-[11px]"
              >
                <option value="SHORT_TEXT">Teks Singkat</option>
                <option value="LONG_TEXT">Paragraf</option>
                <option value="DATE">Tanggal</option>
                <option value="CURRENCY">Mata Uang (Rp)</option>
                <option value="NUMBER">Angka</option>
                <option value="DROPDOWN">Pilihan (Dropdown)</option>
                <option value="SYSTEM_DOC_NUMBER">Nomor Surat Otomatis</option>
                <option value="SYSTEM_CURRENT_DATE">Tanggal Cetak Hari Ini</option>
              </select>

              <button
                type="submit"
                className="px-2.5 py-1 rounded-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Dropdown Options Builder */}
            {newVarType === "DROPDOWN" && (
              <div className="space-y-1.5 p-2 bg-zinc-100 dark:bg-zinc-800/80 rounded-sm border border-zinc-200 dark:border-zinc-700/80">
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Daftar Pilihan Dropdown:
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    type="text"
                    placeholder="Ketik opsi lalu klik (+)..."
                    value={newOptionInput}
                    onChange={(e) => setNewOptionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newOptionInput.trim()) {
                          setDropdownOptions([...dropdownOptions, newOptionInput.trim()]);
                          setNewOptionInput("");
                        }
                      }
                    }}
                    className="flex-1 px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newOptionInput.trim()) {
                        setDropdownOptions([...dropdownOptions, newOptionInput.trim()]);
                        setNewOptionInput("");
                      }
                    }}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-sm text-xs font-bold cursor-pointer"
                    title="Tambah Opsi"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pt-1">
                  {dropdownOptions.map((opt, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-[10px] text-zinc-700 dark:text-zinc-300"
                    >
                      <span>{opt}</span>
                      <button
                        type="button"
                        onClick={() => setDropdownOptions(dropdownOptions.filter((_, i) => i !== idx))}
                        className="text-zinc-400 hover:text-rose-500 cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </form>

          {/* Pola Penomoran Mandiri & Spesifikasi Kertas */}
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5 max-h-64 overflow-y-auto">
            {/* Pola Penomoran Templat */}
            <div className="space-y-1">
              <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <Hash className="w-3 h-3 text-blue-500" />
                Pola Penomoran Surat
              </span>
              <input
                type="text"
                value={polaPenomoran}
                onChange={(e) => {
                  setPolaPenomoran(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="{{NOMOR}}/SK-DIR/{{BULAN_ROMAWI}}/{{TAHUN}}"
                className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs font-mono text-blue-600 dark:text-blue-400"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {["{{NOMOR}}", "{{BULAN_ROMAWI}}", "{{BULAN}}", "{{TAHUN}}", "{{HARI}}"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setPolaPenomoran((prev) => prev + tag);
                      setIsDirty(true);
                    }}
                    className="text-[9px] font-mono px-1 py-0.5 rounded-xs bg-zinc-200 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                    title={`Sisipkan ${tag}`}
                  >
                    +{tag}
                  </button>
                ))}
              </div>

              {/* Counter awal urutan */}
              <div className="pt-1.5 flex items-center justify-between">
                <label className="text-[10px] text-zinc-500">Nomor Urut Terakhir:</label>
                <input
                  type="number"
                  min={0}
                  value={counterTerakhir}
                  onChange={(e) => {
                    setCounterTerakhir(Math.max(0, parseInt(e.target.value, 10) || 0));
                    setIsDirty(true);
                  }}
                  className="w-20 px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs font-mono text-right"
                  title="Urutan terakhir yang terbit untuk templat ini"
                />
              </div>

              {/* Tahun acuan penomoran */}
              <div className="pt-1.5 flex items-center justify-between">
                <label className="text-[10px] text-zinc-500">Tahun Penomoran:</label>
                <input
                  type="number"
                  value={tahunPenomoran}
                  onChange={(e) => {
                    setTahunPenomoran(parseInt(e.target.value, 10) || new Date().getFullYear());
                    setIsDirty(true);
                  }}
                  className="w-20 px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs font-mono text-right"
                  title="Tahun acuan penomoran surat"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <label className="text-[10px] text-zinc-400 block mb-1">Kategori</label>
              <input
                type="text"
                value={kategori}
                onChange={(e) => {
                  setKategori(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="misal: HRD, Operasional"
                className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">Deskripsi Singkat</label>
              <textarea
                rows={2}
                value={deskripsi}
                onChange={(e) => {
                  setDeskripsi(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Penjelasan fungsi templat..."
                className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs"
              />
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <Sliders className="w-3 h-3" />
                Spesifikasi Kertas & Margin
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-zinc-400">Ukuran</label>
                  <select
                    value={ukuranKertas}
                    onChange={(e) => {
                      setUkuranKertas(e.target.value as "A4" | "F4" | "LETTER");
                      setIsDirty(true);
                    }}
                    className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs"
                  >
                    <option value="A4">A4 (210x297)</option>
                    <option value="F4">F4 / Folio</option>
                    <option value="LETTER">Letter</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400">Orientasi</label>
                  <select
                    value={orientasi}
                    onChange={(e) => {
                      setOrientasi(e.target.value as "PORTRAIT" | "LANDSCAPE");
                      setIsDirty(true);
                    }}
                    className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs"
                  >
                    <option value="PORTRAIT">Tegak</option>
                    <option value="LANDSCAPE">Mendatar</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="text-[10px] text-zinc-400 block mb-1">Margin (mm): T, B, L, R</label>
                <div className="grid grid-cols-4 gap-1 text-[10px]">
                  <input
                    type="number"
                    value={marginTop}
                    onChange={(e) => {
                      setMarginTop(Number(e.target.value));
                      setIsDirty(true);
                    }}
                    placeholder="Atas"
                    title="Margin Atas"
                    className="px-1.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm"
                  />
                  <input
                    type="number"
                    value={marginBottom}
                    onChange={(e) => {
                      setMarginBottom(Number(e.target.value));
                      setIsDirty(true);
                    }}
                    placeholder="Bawah"
                    title="Margin Bawah"
                    className="px-1.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm"
                  />
                  <input
                    type="number"
                    value={marginLeft}
                    onChange={(e) => {
                      setMarginLeft(Number(e.target.value));
                      setIsDirty(true);
                    }}
                    placeholder="Kiri"
                    title="Margin Kiri"
                    className="px-1.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm"
                  />
                  <input
                    type="number"
                    value={marginRight}
                    onChange={(e) => {
                      setMarginRight(Number(e.target.value));
                      setIsDirty(true);
                    }}
                    placeholder="Kanan"
                    title="Margin Kanan"
                    className="px-1.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Guard Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm shadow-xl w-full max-w-sm p-4 space-y-4 animate-scale-in">
            <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Perubahan Belum Disimpan
              </h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Terdapat perubahan pada templat yang belum Anda simpan. Apakah Anda ingin menyimpannya sebagai draf sebelum keluar?
            </p>
            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={async () => {
                  setShowExitModal(false);
                  await handleSave(true);
                  onBackToCatalog();
                }}
                className="w-full py-2 px-3 rounded-sm bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Simpan Draf
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowExitModal(false);
                    onBackToCatalog();
                  }}
                  className="flex-1 py-1.5 px-3 rounded-sm bg-zinc-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-zinc-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition cursor-pointer text-center"
                >
                  Tetap Keluar
                </button>
                <button
                  type="button"
                  onClick={() => setShowExitModal(false)}
                  className="flex-1 py-1.5 px-3 rounded-sm bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-xs font-medium text-zinc-800 dark:text-zinc-200 transition cursor-pointer text-center"
                >
                  Kembali
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
