import React, { useState, useMemo } from "react";
import { 
  Shield, AlertOctagon, Moon, Sun, Search, AppWindow, Cpu, ShieldAlert, Globe
} from "lucide-react";
import { AppFilterItem } from "../types";
import { DynamicIcon } from "./Icons";
import { motion } from "motion/react";
import { translations, Language } from "../lib/translations";

interface SettingsProps {
  killSwitchEnabled: boolean;
  onToggleKillSwitch: () => void;
  appFilters: AppFilterItem[];
  onToggleAppFilter: (id: string) => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  dnsLeakProtection: boolean;
  onToggleDnsLeak: () => void;
  onResetPermission?: () => void;
  language: Language;
  onChangeLanguage: (lang: Language) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  killSwitchEnabled,
  onToggleKillSwitch,
  appFilters,
  onToggleAppFilter,
  theme,
  onToggleTheme,
  dnsLeakProtection,
  onToggleDnsLeak,
  onResetPermission,
  language,
  onChangeLanguage
}) => {
  const [appSearch, setAppSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<"ALL" | "Social" | "Browser" | "Entertainment" | "Tools">("ALL");

  const t = translations[language];

  // Filter apps
  const filteredApps = useMemo(() => {
    return appFilters.filter(app => {
      const matchSearch = app.appName.toLowerCase().includes(appSearch.toLowerCase()) || 
                          app.packageName.toLowerCase().includes(appSearch.toLowerCase());
      const matchCategory = activeCategory === "ALL" || app.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [appFilters, appSearch, activeCategory]);

  return (
    <div className="space-y-6">
      {/* Language Settings (Added alongside Persian as requested!) */}
      <div className={`p-5 rounded-3xl ${
        theme === "dark" ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-slate-100 shadow-sm"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className={`text-xs font-bold ${theme === "dark" ? "text-slate-200" : "text-slate-800"} flex items-center gap-2`}>
              <Globe size={15} className="text-emerald-400" />
              {t.languageSelect}
            </h3>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {t.languageSelectDesc}
            </p>
          </div>

          <div className="flex p-0.5 rounded-xl bg-slate-500/5 border border-slate-500/10 self-start sm:self-center">
            <button
              onClick={() => onChangeLanguage("fa")}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-bold transition-all duration-150 cursor-pointer ${
                language === "fa"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              فارسی
            </button>
            <button
              onClick={() => onChangeLanguage("en")}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-bold transition-all duration-150 cursor-pointer ${
                language === "en"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* Dark Theme / Night Mode Settings */}
      <div className={`p-5 rounded-3xl ${
        theme === "dark" ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-slate-100 shadow-sm"
      }`}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className={`text-xs font-bold ${theme === "dark" ? "text-slate-200" : "text-slate-800"} flex items-center gap-2`}>
              {theme === "dark" ? <Moon size={15} className="text-cyan-400" /> : <Sun size={15} className="text-amber-500" />}
              {t.darkMode}
            </h3>
            <p className="text-[10px] text-slate-500">{t.darkModeDesc}</p>
          </div>

          <button
            onClick={onToggleTheme}
            className={`w-14 h-7 rounded-full p-1 transition-all duration-300 relative cursor-pointer ${
              theme === "dark" ? "bg-cyan-500/20 border border-cyan-500/30" : "bg-slate-200"
            }`}
          >
            <motion.div
              layout
              className={`w-5 h-5 rounded-full flex items-center justify-center shadow-md ${
                theme === "dark" ? "bg-cyan-400 self-end ml-auto" : "bg-white"
              }`}
            >
              {theme === "dark" ? <Moon size={11} className="text-slate-950" /> : <Sun size={11} className="text-amber-500" />}
            </motion.div>
          </button>
        </div>
      </div>

      {/* Kill Switch Protection */}
      <div className={`p-5 rounded-3xl border transition-all duration-300 ${
        killSwitchEnabled 
          ? "bg-rose-500/5 border-rose-500/40 shadow-md shadow-rose-500/5" 
          : theme === "dark" 
          ? "bg-slate-900/60 border-slate-800/80" 
          : "bg-white border-slate-100 shadow-sm"
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className={`text-xs font-bold ${theme === "dark" ? "text-slate-200" : "text-slate-800"} flex items-center gap-2`}>
              <AlertOctagon size={15} className={killSwitchEnabled ? "text-rose-500 animate-pulse" : "text-slate-500"} />
              {t.killSwitch}
            </h3>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {t.killSwitchDesc}
            </p>
          </div>

          <button
            onClick={onToggleKillSwitch}
            className={`w-14 h-7 rounded-full p-1 transition-all duration-300 relative flex-shrink-0 cursor-pointer ${
              killSwitchEnabled ? "bg-rose-500/20 border border-rose-500/30" : "bg-slate-200"
            }`}
          >
            <motion.div
              layout
              className={`w-5 h-5 rounded-full flex items-center justify-center shadow-md ${
                killSwitchEnabled ? "bg-rose-500 ml-auto" : "bg-white"
              }`}
            />
          </button>
        </div>

        {killSwitchEnabled && (
          <div className="mt-3.5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 flex items-start gap-2">
            <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>{language === "fa" ? "هشدار امنیتی:" : "Security Warning:"}</strong> {language === "fa" ? "محافظ فعال است. هیچ تبادل داده‌ای خارج از تونل کدگذاری شده VpnG مجاز نخواهد بود." : "Protection is active. No data transfer outside the VpnG encrypted tunnel is allowed."}
            </p>
          </div>
        )}
      </div>

      {/* DNS Leak Protection */}
      <div className={`p-5 rounded-3xl ${
        theme === "dark" ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-slate-100 shadow-sm"
      }`}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className={`text-xs font-bold ${theme === "dark" ? "text-slate-200" : "text-slate-800"} flex items-center gap-2`}>
              <Shield size={15} className="text-emerald-500" />
              {t.dnsLeak}
            </h3>
            <p className="text-[10px] text-slate-500">{t.dnsLeakDesc}</p>
          </div>

          <button
            onClick={onToggleDnsLeak}
            className={`w-14 h-7 rounded-full p-1 transition-all duration-300 relative cursor-pointer ${
              dnsLeakProtection ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-slate-200"
            }`}
          >
            <motion.div
              layout
              className={`w-5 h-5 rounded-full flex items-center justify-center shadow-md ${
                dnsLeakProtection ? "bg-emerald-500 ml-auto" : "bg-white"
              }`}
            />
          </button>
        </div>
      </div>

      {/* App Filter (Selective Tunneling) */}
      <div className={`p-5 rounded-3xl ${
        theme === "dark" ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-slate-100 shadow-sm"
      } space-y-4`}>
        <div className="space-y-1">
          <h3 className={`text-xs font-bold ${theme === "dark" ? "text-slate-200" : "text-slate-800"} flex items-center gap-2`}>
            <AppWindow size={15} className="text-indigo-400" />
            {t.appFilter}
          </h3>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            {t.appFilterDesc}
          </p>
        </div>

        {/* Search inside apps */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder={t.searchApps}
            value={appSearch}
            onChange={(e) => setAppSearch(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-[11px] outline-none border ${
              theme === "dark" 
                ? "bg-slate-950 border-slate-800/80 text-slate-100 focus:border-emerald-500/40" 
                : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500/40"
            }`}
          />
        </div>

        {/* Category filter tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {(["ALL", "Social", "Browser", "Entertainment", "Tools"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg text-[9px] font-bold transition-all duration-150 flex-shrink-0 cursor-pointer ${
                activeCategory === cat
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-500/5 text-slate-500 hover:text-slate-300"
              }`}
            >
              {cat === "ALL" ? t.all : t[cat.toLowerCase() as "social" | "browser" | "entertainment" | "tools"]}
            </button>
          ))}
        </div>

        {/* Apps List */}
        <div className="space-y-2.5 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-1">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className={`p-3 rounded-2xl flex items-center justify-between border ${
                app.bypassVpn 
                  ? theme === "dark" ? "bg-slate-950/40 border-slate-900" : "bg-slate-50/50 border-slate-100"
                  : "bg-emerald-500/5 border-emerald-500/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  app.bypassVpn 
                    ? "bg-slate-500/10 border-slate-500/15 text-slate-400" 
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                }`}>
                  <DynamicIcon name={app.iconName} size={15} />
                </div>
                <div>
                  <h4 className={`text-xs font-semibold ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}>
                    {app.appName}
                  </h4>
                  <p className="text-[9px] text-slate-500 font-mono">{app.packageName}</p>
                </div>
              </div>

              {/* Status control */}
              <button
                onClick={() => onToggleAppFilter(app.id)}
                className={`px-3 py-1.5 rounded-xl text-[9px] font-bold border transition-all duration-200 cursor-pointer ${
                  app.bypassVpn
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/15"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15"
                }`}
              >
                {app.bypassVpn ? t.bypassActive : t.tunnelActive}
              </button>
            </div>
          ))}

          {filteredApps.length === 0 && (
            <p className="text-[11px] text-slate-500 text-center py-6">{t.noApps}</p>
          )}
        </div>
      </div>

      {/* Reset VPN Simulation Permission */}
      {onResetPermission && (
        <div className={`p-5 rounded-3xl ${
          theme === "dark" ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-slate-100 shadow-sm"
        } space-y-3`}>
          <div className="space-y-1">
            <h3 className={`text-xs font-bold ${theme === "dark" ? "text-slate-200" : "text-slate-800"} flex items-center gap-2`}>
              <Cpu size={15} className="text-violet-400" />
              {t.androidTest}
            </h3>
            <p className="text-[10px] text-slate-500">
              {t.androidTestDesc}
            </p>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={onResetPermission}
              className="px-4 py-2 border border-dashed border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 text-violet-400 rounded-xl text-[10px] font-bold transition-colors cursor-pointer"
            >
              {t.resetPermissionBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
