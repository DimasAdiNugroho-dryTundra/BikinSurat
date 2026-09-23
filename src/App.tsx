import { useState, useEffect, useCallback } from "react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { TemplateCatalogView } from "@/views/TemplateCatalogView";
import { GeneratorView } from "@/views/GeneratorView";
import { BuilderFocusView } from "@/views/BuilderFocusView";
import { SettingsView } from "@/views/SettingsView";
import { HistoryView } from "@/views/HistoryView";
import {
  ActiveView,
  TemplateItem,
  AppSetting,
  DocumentHistoryItem,
  DraftItem,
} from "@/types";
import { BikinsuratAPI } from "@/lib/ipc";

export function AppContent() {
  const [activeView, setActiveView] = useState<ActiveView>("generator");
  const [generatorStage, setGeneratorStage] = useState<"catalog" | "workspace">("catalog");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [history, setHistory] = useState<DocumentHistoryItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [activeDraftId, setActiveDraftId] = useState<string | undefined>(undefined);
  const [repopulateData, setRepopulateData] = useState<{ [key: string]: string } | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [tmplData, settingData, historyData] = await Promise.all([
        BikinsuratAPI.getTemplates(),
        BikinsuratAPI.getSettings(),
        BikinsuratAPI.getDocumentHistory(),
      ]);
      setTemplates(tmplData);
      setSettings(settingData);
      setHistory(historyData);
    } catch (err) {
      console.error("Gagal memuat data awal:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Global keyboard shortcuts (Ctrl+B for sidebar toggle, Ctrl+N for new template)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputOrEditor =
        target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          Boolean(target.closest("[contenteditable='true']")));

      // Ctrl+\ for sidebar toggle
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
      // Ctrl+N for new template when not typing in input
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        if (!isInputOrEditor) {
          e.preventDefault();
          setSelectedTemplate(null);
          setActiveView("builder");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getOrgName = () => {
    return (
      settings.find((s) => s.kunci === "nama_organisasi")?.nilai ||
      "PT. INOVASI MAJU BERSAMA"
    );
  };

  // Navigating sidebar
  const handleNavChange = (view: ActiveView) => {
    setActiveView(view);
    if (view === "generator") {
      // Always reset to catalog & drafts hub when clicking Buat Surat in sidebar
      setGeneratorStage("catalog");
    }
  };

  // Select template to open workspace
  const handleSelectForGenerate = (template: TemplateItem) => {
    setSelectedTemplate(template);
    setRepopulateData(undefined);
    setActiveDraftId(undefined);
    setGeneratorStage("workspace");
  };

  // Select draft to resume in workspace
  const handleSelectDraft = (draft: DraftItem) => {
    const tmpl = templates.find((t) => t.id === draft.templat_id);
    if (tmpl) {
      setSelectedTemplate(tmpl);
      try {
        const parsed = JSON.parse(draft.nilai_isian_json);
        setRepopulateData(parsed);
      } catch {
        setRepopulateData(undefined);
      }
      setActiveDraftId(draft.id);
      setGeneratorStage("workspace");
    }
  };

  // Select template for editing format in builder
  const handleSelectForEdit = (template: TemplateItem) => {
    setSelectedTemplate(template);
    setActiveView("builder");
  };

  // Duplicate template
  const handleDuplicate = async (template: TemplateItem) => {
    const duplicatePayload: TemplateItem = {
      ...template,
      id: "",
      judul: `${template.judul} (Salinan)`,
      apakah_favorit: false,
    };
    await BikinsuratAPI.saveTemplate(duplicatePayload);
    await loadInitialData();
  };

  // Delete template
  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus templat surat ini?")) {
      await BikinsuratAPI.deleteTemplate(id);
      await loadInitialData();
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (template: TemplateItem) => {
    const updated: TemplateItem = {
      ...template,
      apakah_favorit: !template.apakah_favorit,
    };
    await BikinsuratAPI.saveTemplate(updated);
    await loadInitialData();
  };

  // New template design
  const handleNewTemplate = () => {
    setSelectedTemplate(null);
    setActiveView("builder");
  };

  // Repopulate from history
  const handleRepopulate = (historyItem: DocumentHistoryItem) => {
    const tmpl = templates.find((t) => t.id === historyItem.templat_id);
    if (tmpl) {
      try {
        const parsed = JSON.parse(historyItem.nilai_isian_json);
        setRepopulateData(parsed);
      } catch {
        setRepopulateData(undefined);
      }
      setSelectedTemplate(tmpl);
      setActiveDraftId(undefined);
      setActiveView("generator");
      setGeneratorStage("workspace");
    }
  };

  return (
    <div className="flex h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased overflow-hidden">
      {/* Sidebar Navigation (3 core items) */}
      <Sidebar
        activeView={activeView}
        setActiveView={handleNavChange}
        templateCount={templates.length}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activeView={activeView}
          organizationName={getOrgName()}
          onNewTemplate={handleNewTemplate}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(false)}
        />

        <main className="flex-1 overflow-y-auto bg-zinc-100/80 dark:bg-zinc-950">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-zinc-500 font-mono">Memuat basis data...</p>
            </div>
          ) : (
            <>
              {/* Buat Surat Flow (Stage 1: Catalog & Drafts Hub | Stage 2: Form & Paper Workspace) */}
              {(activeView === "generator" || activeView === "catalog") && (
                generatorStage === "catalog" ? (
                  <TemplateCatalogView
                    templates={templates}
                    onSelectTemplateForGenerate={handleSelectForGenerate}
                    onSelectTemplateForEdit={handleSelectForEdit}
                    onSelectDraft={handleSelectDraft}
                    onDuplicateTemplate={handleDuplicate}
                    onDeleteTemplate={handleDelete}
                    onToggleFavorite={handleToggleFavorite}
                    onNewTemplate={handleNewTemplate}
                  />
                ) : (
                  <GeneratorView
                    template={selectedTemplate || templates[0]}
                    templates={templates}
                    initialValues={repopulateData}
                    initialDraftId={activeDraftId}
                    onSelectTemplate={(t) => setSelectedTemplate(t)}
                    onBackToCatalog={() => setGeneratorStage("catalog")}
                    onDocumentGenerated={loadInitialData}
                    onNewTemplate={handleNewTemplate}
                    onEditTemplate={handleSelectForEdit}
                  />
                )
              )}

              {/* Editor Templat Focus View */}
              {activeView === "builder" && (
                <BuilderFocusView
                  initialTemplate={selectedTemplate}
                  onBackToCatalog={() => {
                    setActiveView("generator");
                    setGeneratorStage("catalog");
                  }}
                  onSaved={async () => {
                    await loadInitialData();
                    setActiveView("generator");
                    setGeneratorStage("catalog");
                  }}
                />
              )}

              {/* History & Snapshot View */}
              {activeView === "history" && (
                <HistoryView
                  history={history}
                  onRepopulate={handleRepopulate}
                />
              )}

              {/* Settings View */}
              {activeView === "settings" && (
                <SettingsView
                  settings={settings}
                  onSettingsUpdated={loadInitialData}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
