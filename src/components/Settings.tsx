import React, { useState, useMemo, useEffect } from "react";
import { 
  Shield, AlertOctagon, Moon, Sun, Search, AppWindow, Cpu, ShieldAlert, Globe, Database, Info, ExternalLink, Zap, Layers
} from "lucide-react";
import { AppFilterItem } from "../types";
import { DynamicIcon } from "./Icons";
import { motion } from "motion/react";
import { translations, Language } from "../lib/translations";
import { SelectorProtocol } from "./ProtocolSelector";

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
  defaultProtocol: SelectorProtocol | "SMART_CONNECT";
  onChangeDefaultProtocol: (proto: SelectorProtocol | "SMART_CONNECT") => void;
  onClearDatabase: () => Promise<void>;
  backgroundInterval: number;
  onChangeBackgroundInterval: (mins: number) => Promise<boolean>;
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
  onChangeLanguage,
  defaultProtocol,
  onChangeDefaultProtocol,
  onClearDatabase,
  backgroundInterval,
  onChangeBackgroundInterval
}) => {
  const [appSearch, setAppSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<"ALL" | "Social" | "Browser" | "Entertainment" | "Tools">("ALL");
  const [dbSuccessMessage, setDbSuccessMessage] = useState("");

  const [intervalInput, setIntervalInput] = useState(backgroundInterval.toString());
  const [intervalSuccess, setIntervalSuccess] = useState("");
  const [intervalError, setIntervalError] = useState("");
  const [isSavingInterval, setIsSavingInterval] = useState(false);

  useEffect(() => {
    setIntervalInput(backgroundInterval.toString());
  }, [backgroundInterval]);

  const handleSaveInterval = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntervalError("");
    setIntervalSuccess("");
    const mins = parseInt(intervalInput, 10);
    if (isNaN(mins) || mins < 1 || mins > 1440) {
      setIntervalError(language === "fa" ? "زمان باید بین ۱ تا ۱۴۴۰ دقیقه باشد." : "Interval must be between 1 and 1440 minutes.");
      return;
    }
    setIsSavingInterval(true);
    const success = await onChangeBackgroundInterval(mins);
    setIsSavingInterval(false);
    if (success) {
      const msg = t.harvestIntervalSuccess.replace("{min}", mins.toString());
      setIntervalSuccess(msg);
      setTimeout(() => setIntervalSuccess(""), 4000);
    } else {
      setIntervalError(language === "fa" ? "خطا در برقراری ارتباط با سرور." : "Failed to connect to the server.");
    }
  };

  const t = translations[language];

  const protocolList = useMemo(() => {
    return [
      { 
        id: "SMART_CONNECT" as const, 
        name: t.smartConnectOption, 
        desc: language === "fa" ? "انتخاب خودکار هوشمند بر اساس بهترین پینگ و بالاترین ثبات" : "AI-driven automatic selection based on lowest latency & best quality", 
        icon: "Zap" as const, 
        color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
      },
      { 
        id: "SOFETHER_TCP" as const, 
        name: "SOFETHER TCP", 
        desc: language === "fa" ? "سرعت عالی، مناسب برای دور زدن فیلترینگ شدید (پورت ۴۴۳)" : "Excellent speeds, bypasses strict DPI networks (Port 443)", 
        icon: "Cpu" as const, 
        color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
      },
      { 
        id: "SOFETHER_UDP" as const, 
        name: "SOFETHER_UDP" as const, 
        desc: language === "fa" ? "پروتکل پرسرعت SoftEther بر روی بستر UDP" : "High-speed SoftEther encapsulation on UDP", 
        icon: "Cpu" as const, 
        color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
      },
      { 
        id: "OPENVPN_TCP" as const, 
        name: "OpenVPN TCP", 
        desc: language === "fa" ? "امنیت و پایداری حداکثری اتصال در برابر نوسانات شبکه" : "Industry standard security with high connection stability", 
        icon: "Shield" as const, 
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      },
      { 
        id: "OPENVPN_UDP" as const, 
        name: "OpenVPN UDP", 
        desc: language === "fa" ? "پروتکل اوپن وی‌پی‌ان با تاخیر کم و مناسب برای گیمینگ" : "Low latency OpenVPN standard, great for gaming & VoIP", 
        icon: "Shield" as const, 
        color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
      },
      { 
        id: "SSTP" as const, 
        name: "SSTP", 
        desc: language === "fa" ? "مبتنی بر SSL مایکروسافت، پایداری بالا در شبکه‌های حساس" : "Microsoft-engineered secure SSL protocol, great bypass", 
        icon: "Globe" as const, 
        color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
      },
      { 
        id: "L2TP" as const, 
        name: "L2TP / IPSec", 
        desc: language === "fa" ? "سازگاری گسترده با مک، ویندوز و کلاینت پیش‌فرض اندروید" : "Broad OS compatibility with native system-level support", 
        icon: "Layers" as const, 
        color: "text-rose-400 bg-rose-500/10 border-rose-500/20"
      },
    ];
  }, [language, t]);

  const renderProtocolIcon = (icon: "Zap" | "Cpu" | "Shield" | "Globe" | "Layers", size = 16) => {
    switch (icon) {
      case "Zap": return <Zap size={size} />;
      case "Cpu": return <Cpu size={size} />;
      case "Shield": return <Shield size={size} />;
      case "Globe": return <Globe size={size} />;
      case "Layers": return <Layers size={size} />;
    }
  };

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

      {/* Connection Protocol Settings */}
      <div className={`p-5 rounded-3xl ${
        theme === "dark" ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-slate-100 shadow-sm"
      } space-y-4`}>
        <div className="space-y-1">
          <h3 className={`text-xs font-bold ${theme === "dark" ? "text-slate-200" : "text-slate-800"} flex items-center gap-2`}>
            <Shield size={15} className="text-cyan-400" />
            {t.defaultProtocolLabel}
          </h3>
          <p className="text-[10px] text-slate-500 leading-relaxed text-left">
            {t.defaultProtocolDesc}
          </p>
        </div>

        {/* Custom Redesigned Premium Protocol Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {protocolList.map((proto) => {
            const isSelected = defaultProtocol === proto.id;
            return (
              <button
                key={proto.id}
                type="button"
                onClick={() => onChangeDefaultProtocol(proto.id)}
                className={`flex items-start gap-3 p-3 rounded-2xl border text-right transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                  isSelected 
                    ? theme === "dark"
                      ? "bg-cyan-500/10 border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                      : "bg-cyan-50/60 border-cyan-500/60 shadow-[0_4px_12px_rgba(6,182,212,0.06)]"
                    : theme === "dark"
                      ? "bg-slate-950/40 border-slate-800/80 hover:bg-slate-900/30 hover:border-slate-700"
                      : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/60 hover:border-slate-300"
                }`}
              >
                {/* Visual Indicator on corner */}
                {isSelected && (
                  <div className={`absolute top-0 w-2 h-2 bg-cyan-500 ${
                    language === "fa" ? "left-0 rounded-br-lg" : "right-0 rounded-bl-lg"
                  }`} />
                )}

                {/* Protocol Icon */}
                <div className={`p-2 rounded-xl border transition-all duration-300 shrink-0 ${
                  isSelected 
                    ? "bg-cyan-500 text-white border-cyan-500 shadow-md shadow-cyan-500/10" 
                    : theme === "dark"
                      ? "bg-slate-900 border-slate-800 text-slate-400 group-hover:text-slate-300"
                      : "bg-white border-slate-200 text-slate-500 group-hover:text-slate-700"
                }`}>
                  {renderProtocolIcon(proto.icon, 14)}
                </div>

                {/* Name and Info */}
                <div className="flex-1 space-y-0.5 text-right">
                  <div className={`flex items-center gap-1.5 ${language === "fa" ? "justify-start" : "justify-start"}`}>
                    <span className={`text-[10px] font-bold ${
                      isSelected 
                        ? theme === "dark" ? "text-cyan-400" : "text-cyan-600"
                        : theme === "dark" ? "text-slate-200" : "text-slate-800"
                    }`}>
                      {proto.name}
                    </span>
                    {proto.id === "SMART_CONNECT" && (
                      <span className="px-1.5 py-0.2 bg-amber-500/15 border border-amber-500/20 text-[7px] font-bold text-amber-500 rounded-md">
                        {language === "fa" ? "پیشنهادی" : "AI Recommended"}
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-500 leading-normal line-clamp-2">
                    {proto.desc}
                  </p>
                </div>
              </button>
            );
          })}
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

      {/* Background Harvest Interval Settings */}
      <div className={`p-5 rounded-3xl ${
        theme === "dark" ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-slate-100 shadow-sm"
      } space-y-4`}>
        <div className="space-y-1">
          <h3 className={`text-xs font-bold ${theme === "dark" ? "text-slate-200" : "text-slate-800"} flex items-center gap-2`}>
            <Layers size={15} className="text-amber-400" />
            {t.harvestIntervalLabel}
          </h3>
          <p className="text-[10px] text-slate-500 leading-relaxed text-right sm:text-left">
            {t.harvestIntervalDesc}
          </p>
        </div>

        <form onSubmit={handleSaveInterval} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <input
              type="number"
              min="1"
              max="1440"
              value={intervalInput}
              onChange={(e) => setIntervalInput(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl text-[11px] outline-none border font-sans ${
                theme === "dark" 
                  ? "bg-slate-950 border-slate-800 text-slate-100 focus:border-amber-500/40" 
                  : "bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500/40"
              }`}
            />
            <span className={`absolute top-3 text-[9px] text-slate-500 font-bold ${
              language === "fa" ? "left-4" : "right-4"
            }`}>
              {language === "fa" ? "دقیقه" : "mins"}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSavingInterval}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-950 rounded-xl text-[10px] font-bold transition-all duration-150 cursor-pointer text-center whitespace-nowrap shrink-0"
          >
            {isSavingInterval ? (language === "fa" ? "در حال ثبت..." : "Saving...") : t.harvestIntervalSaveBtn}
          </button>
        </form>

        {intervalSuccess && (
          <p className="text-[10px] text-emerald-500 font-bold animate-pulse text-right sm:text-left">{intervalSuccess}</p>
        )}
        {intervalError && (
          <p className="text-[10px] text-rose-500 font-bold text-right sm:text-left">{intervalError}</p>
        )}
      </div>

      {/* Clear Database Card */}
      <div className={`p-5 rounded-3xl ${
        theme === "dark" ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-slate-100 shadow-sm"
      } space-y-3`}>
        <div className="space-y-1">
          <h3 className={`text-xs font-bold ${theme === "dark" ? "text-slate-200" : "text-slate-800"} flex items-center gap-2`}>
            <Database size={15} className="text-amber-500" />
            {t.clearDatabase}
          </h3>
          <p className="text-[10px] text-slate-500 leading-relaxed text-left">
            {t.clearDatabaseDesc}
          </p>
        </div>

        <div className="pt-1 flex items-center gap-4">
          <button
            type="button"
            onClick={async () => {
              await onClearDatabase();
              setDbSuccessMessage(t.databaseCleared);
              setTimeout(() => setDbSuccessMessage(""), 4000);
            }}
            className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
          >
            {t.clearDatabaseBtn}
          </button>
          {dbSuccessMessage && (
            <span className="text-[10px] text-emerald-500 animate-pulse font-bold">{dbSuccessMessage}</span>
          )}
        </div>
      </div>

      {/* About VpnG Card */}
      <div className={`p-5 rounded-3xl ${
        theme === "dark" ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-slate-100 shadow-sm"
      } space-y-4`}>
        <div className="space-y-1.5">
          <h3 className={`text-xs font-bold ${theme === "dark" ? "text-slate-200" : "text-slate-800"} flex items-center gap-2`}>
            <Info size={15} className="text-indigo-400" />
            {t.aboutTitle}
          </h3>
          <p className="text-[10px] text-slate-500 leading-relaxed text-left">
            {t.aboutDesc}
          </p>
        </div>

        <div className={`p-3.5 rounded-2xl border text-[10px] space-y-2.5 ${
          theme === "dark" ? "bg-slate-950/40 border-slate-850/80 text-slate-300" : "bg-slate-50 border-slate-150 text-slate-700"
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">{language === "fa" ? "نام توسعه‌دهنده" : "Developer"}</span>
            <span className="font-bold">{t.developerName}</span>
          </div>

          <div className="border-t border-slate-500/10 my-1" />

          <div className="space-y-1.5 text-left">
            <span className="text-slate-500 block mb-1">{language === "fa" ? "ماژول هسته" : "Core Module"}</span>
            <p className="text-slate-400 leading-normal mb-2 text-[9px]">
              {t.moduleDetails}
            </p>
            <a
              href="https://github.com/morteza-taheri/VpnG"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-cyan-400 hover:underline font-bold transition-all text-[9px] cursor-pointer"
            >
              <ExternalLink size={10} />
              {t.repoLink}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
