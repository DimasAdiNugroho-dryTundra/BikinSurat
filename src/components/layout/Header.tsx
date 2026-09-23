import React from "react";
import { Building2 } from "lucide-react";
import { ActiveView } from "@/types";

interface HeaderProps {
  activeView: ActiveView;
  organizationName: string;
  onNewTemplate?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  organizationName,
}) => {
  const getBreadcrumb = () => {
    switch (activeView) {
      case "generator":
      case "catalog":
        return {
          parent: "Dokumen",
          title: "Buat Surat Resmi",
        };
      case "builder":
        return {
          parent: "Desain",
          title: "Editor Format Templat",
        };
      case "history":
        return {
          parent: "Arsip",
          title: "Riwayat Dokumen Terbit",
        };
      case "settings":
        return {
          parent: "Sistem",
          title: "Profil Instansi & Organisasi",
        };
      default:
        return { parent: "Aplikasi", title: "BikinSurat" };
    }
  };

  const { parent, title } = getBreadcrumb();

  return (
    <header className="h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800/80 px-4 flex items-center justify-between shrink-0 select-none">
      <div className="flex items-center space-x-3">
        <div>
          <div className="flex items-center space-x-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
            <span>BikinSurat</span>
            <span>/</span>
            <span>{parent}</span>
          </div>
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Organization Name Badge */}
        <div className="flex items-center space-x-2 px-2.5 py-1 rounded-sm bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 text-xs">
          <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="font-medium truncate max-w-[240px]">
            {organizationName || "PT. INOVASI MAJU BERSAMA"}
          </span>
        </div>
      </div>
    </header>
  );
};
