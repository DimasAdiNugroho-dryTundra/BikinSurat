import React, { useState, useEffect } from "react";
import {
  Building2,
  Save,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Globe,
} from "lucide-react";
import { AppSetting } from "@/types";
import { BikinsuratAPI } from "@/lib/ipc";

interface SettingsViewProps {
  settings: AppSetting[];
  onSettingsUpdated: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSettingsUpdated,
}) => {
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    const data: { [key: string]: string } = {};
    settings.forEach((s) => {
      data[s.kunci] = s.nilai;
    });
    setFormData(data);
  }, [settings]);

  const handleChange = (key: string, val: string) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(formData)) {
        await BikinsuratAPI.updateSetting(key, value);
      }
      onSettingsUpdated();
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2500);
    } catch (err) {
      console.error("Gagal menyimpan pengaturan:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Profil Instansi & Organisasi
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Informasi identitas resmi yang digunakan sebagai rujukan data dan kop surat
          </p>
        </div>

        {showSavedToast && (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-sm bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Pengaturan berhasil disimpan</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Profil Organisasi */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm p-4 space-y-4 shadow-xs">
          <div className="flex items-center space-x-2 pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Identitas Resmi Organisasi / Perusahaan
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Nama Resmi Organisasi / Instansi
              </label>
              <input
                type="text"
                value={formData.nama_organisasi || ""}
                onChange={(e) => handleChange("nama_organisasi", e.target.value)}
                placeholder="PT. Inovasi Maju Bersama"
                className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-zinc-400" />
                Alamat Kantor Lengkap
              </label>
              <textarea
                rows={2}
                value={formData.alamat_organisasi || ""}
                onChange={(e) => handleChange("alamat_organisasi", e.target.value)}
                placeholder="Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan"
                className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-zinc-400" />
                Nomor Telepon Kantor
              </label>
              <input
                type="text"
                value={formData.telepon_organisasi || ""}
                onChange={(e) => handleChange("telepon_organisasi", e.target.value)}
                placeholder="(021) 555-0199"
                className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-zinc-400" />
                Alamat Surel Resmi (Email)
              </label>
              <input
                type="email"
                value={formData.surel_organisasi || ""}
                onChange={(e) => handleChange("surel_organisasi", e.target.value)}
                placeholder="administrasi@inovasimaju.id"
                className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <Globe className="w-3 h-3 text-zinc-400" />
                Situs Web Resmi
              </label>
              <input
                type="text"
                value={formData.website_organisasi || ""}
                onChange={(e) => handleChange("website_organisasi", e.target.value)}
                placeholder="https://www.inovasimaju.id"
                className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>


        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-xs shadow-xs transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
