import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Star,
  Plus,
  Edit3,
  Copy,
  Trash2,
  Tag,
  FileText,
  FileClock,
  ArrowRight,
} from "lucide-react";
import { TemplateItem, DraftItem } from "@/types";
import { BikinsuratAPI } from "@/lib/ipc";

interface TemplateCatalogViewProps {
  templates: TemplateItem[];
  onSelectTemplateForGenerate: (template: TemplateItem) => void;
  onSelectTemplateForEdit: (template: TemplateItem) => void;
  onSelectDraft?: (draft: DraftItem) => void;
  onDuplicateTemplate: (template: TemplateItem) => void;
  onDeleteTemplate: (id: string) => void;
  onToggleFavorite: (template: TemplateItem) => void;
  onNewTemplate: () => void;
}

export const TemplateCatalogView: React.FC<TemplateCatalogViewProps> = ({
  templates,
  onSelectTemplateForGenerate,
  onSelectTemplateForEdit,
  onSelectDraft,
  onDuplicateTemplate,
  onDeleteTemplate,
  onToggleFavorite,
  onNewTemplate,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [activeDraftTab, setActiveDraftTab] = useState<"letters" | "templates">("letters");

  // Saved Drafts State
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);

  const refreshDrafts = async () => {
    try {
      setIsLoadingDrafts(true);
      const data = await BikinsuratAPI.getDrafts();
      setDrafts(data);
    } catch (err) {
      console.error("Gagal memuat draf:", err);
    } finally {
      setIsLoadingDrafts(false);
    }
  };

  useEffect(() => {
    refreshDrafts();
  }, []);

  const handleDeleteDraft = async (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Hapus draf surat ini secara permanen?")) {
      await BikinsuratAPI.deleteDraft(draftId);
      await refreshDrafts();
    }
  };

  // Published templates vs drafts
  const publishedTemplates = useMemo(() => {
    return templates.filter((t) => !t.apakah_draf);
  }, [templates]);

  const templateDrafts = useMemo(() => {
    return templates.filter((t) => Boolean(t.apakah_draf));
  }, [templates]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    publishedTemplates.forEach((t) => {
      if (t.kategori) cats.add(t.kategori);
    });
    return ["Semua", ...Array.from(cats)];
  }, [publishedTemplates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return publishedTemplates.filter((t) => {
      const matchesSearch =
        t.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.deskripsi && t.deskripsi.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.kategori.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "Semua" || t.kategori === selectedCategory;

      const matchesFavorite = !onlyFavorites || t.apakah_favorit;

      return matchesSearch && matchesCategory && matchesFavorite;
    });
  }, [publishedTemplates, searchQuery, selectedCategory, onlyFavorites]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header with Title and New Template Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Pilih Jenis Surat
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Pilih templat surat resmi di bawah ini atau lanjutkan pengerjaan draf yang tersimpan
          </p>
        </div>

        <button
          onClick={onNewTemplate}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-sm bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-xs transition cursor-pointer self-start sm:self-auto"
          title="Rancang Format Templat Baru"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Desain Templat Baru</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-sm border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari naskah, kategori, atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-sm text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {/* Category Tabs */}
          <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-sm border border-zinc-200 dark:border-zinc-700/60">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs font-medium rounded-xs transition cursor-pointer whitespace-nowrap ${selectedCategory === cat
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Star Filter */}
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`p-1.5 rounded-sm border transition cursor-pointer shrink-0 ${onlyFavorites
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-500"
              : "bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/80 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              }`}
            title="Filter Templat Favorit"
          >
            <Star
              className="w-4 h-4"
              fill={onlyFavorites ? "currentColor" : "none"}
            />
          </button>
        </div>
      </div>

      {/* Grid of Published Templates */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const varCount = template.variabel?.length || 0;

            return (
              <div
                key={template.id}
                onClick={() => onSelectTemplateForGenerate(template)}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-sm p-4 flex flex-col justify-between transition-all duration-150 shadow-xs hover:shadow-sm group cursor-pointer relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                      {template.kategori || "Umum"}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(template);
                      }}
                      className="text-zinc-300 hover:text-amber-500 transition cursor-pointer p-0.5"
                      title={template.apakah_favorit ? "Hapus dari favorit" : "Tandai sebagai favorit"}
                    >
                      <Star
                        className={`w-4 h-4 ${template.apakah_favorit
                          ? "text-amber-500 fill-amber-500"
                          : "text-zinc-300 dark:text-zinc-600 hover:text-amber-400"
                          }`}
                      />
                    </button>
                  </div>

                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug line-clamp-1 mb-1">
                    {template.judul}
                  </h3>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                    {template.deskripsi || "Templat naskah resmi instansi."}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[11px] text-zinc-400 dark:text-zinc-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Tag className="w-3 h-3 text-zinc-400" />
                      {varCount} variabel
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[10px] uppercase">
                      {template.ukuran_kertas || "A4"}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateTemplate(template);
                      }}
                      className="p-1 rounded-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                      title="Duplikat Templat"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTemplateForEdit(template);
                      }}
                      className="p-1 rounded-sm text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                      title="Edit Desain Templat"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTemplate(template.id);
                      }}
                      className="p-1 rounded-sm text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Hapus Templat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Tidak ada templat yang cocok
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Coba sesuaikan kata kunci pencarian atau buat templat format baru.
            </p>
          </div>
          <button
            onClick={onNewTemplate}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-sm bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Buat Templat Baru</span>
          </button>
        </div>
      )}

      {/* DAFTAR DRAF TERSIMPAN DI BAWAH KATALOG */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-sm bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <FileClock className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Daftar Draf Tersimpan
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Pekerjaan surat atau perancangan templat yang belum selesai diterbitkan
              </p>
            </div>
          </div>

          {/* Tab Switcher: Draf Surat vs Draf Templat */}
          <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-sm border border-zinc-200 dark:border-zinc-700/60 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveDraftTab("letters")}
              className={`px-3 py-1 text-xs font-medium rounded-xs transition cursor-pointer flex items-center gap-1.5 ${activeDraftTab === "letters"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
            >
              <span>Draf Surat</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-mono font-bold">
                {drafts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDraftTab("templates")}
              className={`px-3 py-1 text-xs font-medium rounded-xs transition cursor-pointer flex items-center gap-1.5 ${activeDraftTab === "templates"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
            >
              <span>Draf Templat</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-mono font-bold">
                {templateDrafts.length}
              </span>
            </button>
          </div>
        </div>

        {activeDraftTab === "letters" ? (
          isLoadingDrafts ? (
            <div className="text-xs text-zinc-400 py-4 text-center">
              Memuat daftar draf tersimpan...
            </div>
          ) : drafts.length === 0 ? (
            <div className="p-4 rounded-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
              Belum ada draf surat tersimpan. Ketika Anda membuat surat dan menekan tombol <span className="font-semibold text-zinc-600 dark:text-zinc-300">Simpan Draf</span>, draf akan muncul di sini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {drafts.map((draft) => {
                const tmpl = templates.find((t) => t.id === draft.templat_id);
                const formattedDate = new Date(draft.diperbarui_pada).toLocaleString("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                });

                return (
                  <div
                    key={draft.id}
                    onClick={() => onSelectDraft && onSelectDraft(draft)}
                    className="bg-white dark:bg-zinc-900 border border-amber-200/80 dark:border-amber-900/40 hover:border-amber-400 dark:hover:border-amber-600 rounded-sm p-3.5 flex flex-col justify-between transition shadow-xs group cursor-pointer"
                  >
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold uppercase">
                          Draf Surat
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {formattedDate}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                        {draft.judul_draf}
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                        Templat: <span className="text-blue-600 dark:text-blue-400 font-medium">{tmpl ? tmpl.judul : "Surat Resmi"}</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectDraft) onSelectDraft(draft);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 cursor-pointer"
                      >
                        <span>Lanjutkan Draf</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteDraft(draft.id, e)}
                        className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                        title="Hapus Draf"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Tab Draf Templat */
          templateDrafts.length === 0 ? (
            <div className="p-4 rounded-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
              Belum ada draf rancangan templat tersimpan. Anda dapat mendesain templat baru dan menyimpannya sebagai draf sebelum diterbitkan.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {templateDrafts.map((tmplDraft) => {
                return (
                  <div
                    key={tmplDraft.id}
                    onClick={() => onSelectTemplateForEdit(tmplDraft)}
                    className="bg-white dark:bg-zinc-900 border border-blue-200/80 dark:border-blue-900/40 hover:border-blue-400 dark:hover:border-blue-600 rounded-sm p-3.5 flex flex-col justify-between transition shadow-xs group cursor-pointer"
                  >
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-bold uppercase">
                          Draf Templat
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {tmplDraft.kategori}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {tmplDraft.judul}
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                        {tmplDraft.deskripsi || "Draf format naskah templat baru"}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTemplateForEdit(tmplDraft);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Lanjutkan Edit Templat</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTemplate(tmplDraft.id);
                        }}
                        className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                        title="Hapus Draf Templat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
};
