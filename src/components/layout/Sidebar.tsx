import React from "react";
import {
  FileSignature,
  History,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  ExternalLink,
} from "lucide-react";
import { ActiveView } from "@/types";
import { useTheme } from "@/components/theme/ThemeProvider";

import { BrandLogo } from "./BrandLogo";

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  templateCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  templateCount,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { effectiveTheme, toggleTheme } = useTheme();

  const navItems = [
    {
      id: "generator" as ActiveView,
      label: "Buat Surat",
      icon: FileSignature,
      badge: templateCount > 0 ? `${templateCount}` : undefined,
      description: "Pilih templat, isi & cetak",
    },
    {
      id: "history" as ActiveView,
      label: "Riwayat Dokumen",
      icon: History,
      description: "Log cetak & ekspor",
    },
    {
      id: "settings" as ActiveView,
      label: "Pengaturan",
      icon: Settings,
      description: "Profil instansi",
    },
  ];

  return (
    <aside
      className={`bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shrink-0 select-none transition-all duration-200 ${isCollapsed ? "w-16" : "w-60"
        }`}
    >
      {/* Top Header & Brand */}
      <div>
        <div
          className={`h-14 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center px-3 ${isCollapsed ? "justify-center" : "justify-between"
            }`}
        >
          {!isCollapsed && (
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <BrandLogo size={30} />
              <div className="truncate">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                    BikinSurat
                  </span>
                  <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded-sm bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    v1.0
                  </span>
                </div>
              </div>
            </div>
          )}

          {isCollapsed && (
            <BrandLogo size={28} />
          )}

          {/* Toggle Collapse Button */}
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition cursor-pointer"
            title={isCollapsed ? "Buka Sidebar (Ctrl+\\)" : "Lipat Sidebar (Ctrl+\\)"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center rounded-sm transition-colors text-xs font-medium cursor-pointer group ${isCollapsed
                  ? "justify-center p-2.5"
                  : "justify-between px-2.5 py-2"
                  } ${isActive
                    ? "bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 font-semibold shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/80"
                  }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${isActive
                      ? "text-zinc-50 dark:text-zinc-900"
                      : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
                      }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate tracking-tight">{item.label}</span>
                  )}
                </div>

                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-sm font-mono font-semibold shrink-0 ${isActive
                      ? "bg-zinc-800 dark:bg-zinc-200 text-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Controls & Copyright */}
      <div className="p-2.5 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/50 dark:bg-zinc-900/40 space-y-2">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center rounded-sm text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition cursor-pointer ${isCollapsed ? "justify-center p-2" : "justify-between px-2.5 py-1.5"
            }`}
          title="Ganti Tema (Ctrl+Shift+D)"
        >
          <div className="flex items-center space-x-2">
            {effectiveTheme === "dark" ? (
              <Moon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            )}
            {!isCollapsed && (
              <span className="text-[11px]">
                {effectiveTheme === "dark" ? "Mode Gelap" : "Mode Terang"}
              </span>
            )}
          </div>
          {!isCollapsed && (
            <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500">
              Ctrl+⇧+D
            </span>
          )}
        </button>

        {!isCollapsed && (
          /* Copyright Link */
          <div className="pt-1 text-center">
            <a
              href="https://github.com/DimasAdiNugroho-dryTundra"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-zinc-400 hover:text-blue-500 dark:text-zinc-500 dark:hover:text-blue-400 transition"
              title="Kunjungi Profil Pengembang di GitHub"
            >
              <span>© DimasAdiNugroho-dryTundra</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        )}
      </div>
    </aside>
  );
};
