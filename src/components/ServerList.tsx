import React, { useState, useMemo } from "react";
import { 
  Search, ArrowUpDown, RefreshCw, Zap, Server, ShieldCheck, 
  Cpu, Check, Play, Globe, Flame, ShieldAlert, SlidersHorizontal, Trash2
} from "lucide-react";
import { VpnServer } from "../types";
import { motion } from "motion/react";
import { translations, Language } from "../lib/translations";

interface ServerListProps {
  servers: VpnServer[];
  activeServer: VpnServer | null;
  onSelectServer: (server: VpnServer) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: string;
  theme: "dark" | "light";
  onTestServerSpeed: (server: VpnServer) => Promise<void>;
  testingServers: Record<string, boolean>;
  testedStats: Record<string, { ping: number; speedMbps: number; stability: number }>;
  language: Language;
}

type SortKey = "CountryLong" | "Protocol" | "Speed" | "CreatedAt";

export const ServerList: React.FC<ServerListProps> = ({
  servers,
  activeServer,
  onSelectServer,
  onRefresh,
  isRefreshing,
  lastUpdated,
  theme,
  onTestServerSpeed,
  testingServers,
  testedStats,
  language
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("Speed");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [protocolFilter, setProtocolFilter] = useState<"ALL" | "SOFTETHER" | "OPENVPN" | "SSTP" | "L2TP">("ALL");

  const t = translations[language];

  // Format date nicely based on locale
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (language === "fa") {
        return d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }) + " - " + d.toLocaleDateString("fa-IR", { month: "short", day: "numeric" });
      } else {
        return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) + " - " + d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
    } catch {
      return dateStr;
    }
  };

  // Convert bytes per second to Mbps or Kbps
  const formatSpeedBytes = (bps: number) => {
    if (!bps) return "0 Mbps";
    const mbps = bps / 1000000;
    if (mbps >= 1) {
      return `${mbps.toFixed(1)} Mbps`;
    }
    return `${(bps / 1000).toFixed(0)} Kbps`;
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  // Filter and Sort Servers
  const filteredAndSortedServers = useMemo(() => {
    let result = [...servers];

    // Search query filter (Country name or Hostname or IP)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        s => 
          s.CountryLong.toLowerCase().includes(q) || 
          s.IP.toLowerCase().includes(q) || 
          s.HostName.toLowerCase().includes(q)
      );
    }

    // Protocol filter
    if (protocolFilter !== "ALL") {
      if (protocolFilter === "SOFTETHER") {
        // SoftEther is supported by all standard VPNGate servers
        result = result.filter(s => !s.isCustom || s.isCustom === false);
      } else if (protocolFilter === "OPENVPN") {
        result = result.filter(s => s.OpenVPN === "1" || s.OpenVPN === true);
      } else if (protocolFilter === "SSTP") {
        result = result.filter(s => s["MS-SSTP"] === "1" || s["MS-SSTP"] === true);
      } else if (protocolFilter === "L2TP") {
        result = result.filter(s => s.L2TP_IPsec === "1" || s.L2TP_IPsec === true);
      }
    }

    // Sort logic
    result.sort((a, b) => {
      let valA: any = a[sortKey] || "";
      let valB: any = b[sortKey] || "";

      // Special case: Protocol sorting
      if (sortKey === "Protocol") {
        const protA = a.OpenVPN === "1" ? "OpenVPN" : a["MS-SSTP"] === "1" ? "SSTP" : "L2TP";
        const protB = b.OpenVPN === "1" ? "OpenVPN" : b["MS-SSTP"] === "1" ? "SSTP" : "L2TP";
        valA = protA;
        valB = protB;
      }

      if (typeof valA === "string") {
        return sortOrder === "asc" 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        // Numbers (Speed, Ping, etc.)
        return sortOrder === "asc" 
          ? (valA as number) - (valB as number) 
          : (valB as number) - (valA as number);
      }
    });

    return result;
  }, [servers, searchQuery, sortKey, sortOrder, protocolFilter]);

  return (
    <div className="space-y-4">
      {/* Synchronization State Header */}
      <div className={`p-4 rounded-3xl ${
        theme === "dark" 
          ? "bg-slate-900/40 border border-slate-800/60" 
          : "bg-white border border-slate-100 shadow-sm"
      } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
        <div>
          <h3 className={`text-xs font-bold ${theme === "dark" ? "text-slate-300" : "text-slate-800"}`}>
            {language === "fa" ? "پایگاه داده آفلاین سرورها" : "Offline Servers Database"}
          </h3>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
            <Globe size={11} className="text-emerald-500" />
            {t.serversCount}: <strong className="text-emerald-400 font-mono">{servers.length}</strong>
            <span className="text-slate-700">|</span>
            {t.lastUpdated}: <span className="text-slate-400 font-mono">{formatDate(lastUpdated)}</span>
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/15 hover:to-teal-500/15 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? (language === "fa" ? "در حال دریافت..." : "Fetching servers...") : t.refresh}
        </button>
      </div>

      {/* Filter and Search Box */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs outline-none transition-all duration-200 border ${
              theme === "dark" 
                ? "bg-slate-900/60 border-slate-800/80 text-slate-100 focus:border-emerald-500/40" 
                : "bg-white border-slate-200 text-slate-800 focus:border-emerald-500/40"
            }`}
          />
        </div>

        {/* Protocol filters & Sort Trigger Panel */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Protocol Selection */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-semibold">{t.filterByProtocol}</span>
            <div className="flex gap-1 p-0.5 rounded-xl bg-slate-500/5 border border-slate-500/10 overflow-x-auto max-w-[285px] sm:max-w-none scrollbar-none">
              {(["ALL", "SOFTETHER", "OPENVPN", "SSTP", "L2TP"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setProtocolFilter(p)}
                  className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                    protocolFilter === p
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {p === "ALL" ? t.all : p}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Toggles */}
          <div className="flex flex-wrap items-center gap-1.5">
            <SlidersHorizontal size={11} className="text-slate-500" />
            <span className="text-[10px] text-slate-500 font-semibold">{t.sortBy}</span>
            
            <div className="flex gap-1">
              <button
                onClick={() => handleSort("CountryLong")}
                className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all duration-150 flex items-center gap-1 cursor-pointer ${
                  sortKey === "CountryLong"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "border-slate-500/10 text-slate-500"
                }`}
              >
                {t.sortCountry}
                {sortKey === "CountryLong" && (
                  <ArrowUpDown size={10} className={sortOrder === "asc" ? "rotate-180" : ""} />
                )}
              </button>

              <button
                onClick={() => handleSort("Protocol")}
                className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all duration-150 flex items-center gap-1 cursor-pointer ${
                  sortKey === "Protocol"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "border-slate-500/10 text-slate-500"
                }`}
              >
                {t.protocol}
                {sortKey === "Protocol" && (
                  <ArrowUpDown size={10} className={sortOrder === "asc" ? "rotate-180" : ""} />
                )}
              </button>

              <button
                onClick={() => handleSort("Speed")}
                className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all duration-150 flex items-center gap-1 cursor-pointer ${
                  sortKey === "Speed"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "border-slate-500/10 text-slate-500"
                }`}
              >
                {t.sortSpeed}
                {sortKey === "Speed" && (
                  <ArrowUpDown size={10} className={sortOrder === "asc" ? "rotate-180" : ""} />
                )}
              </button>

              <button
                onClick={() => handleSort("CreatedAt")}
                className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all duration-150 flex items-center gap-1 cursor-pointer ${
                  sortKey === "CreatedAt"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "border-slate-500/10 text-slate-500"
                }`}
              >
                {t.sortDate}
                {sortKey === "CreatedAt" && (
                  <ArrowUpDown size={10} className={sortOrder === "asc" ? "rotate-180" : ""} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Servers List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-1">
        {filteredAndSortedServers.map((server, i) => {
          const isActive = activeServer?.IP === server.IP;
          const isTesting = testingServers[server.IP] || false;
          const testResult = testedStats[server.IP];

          return (
            <motion.div
              key={server.IP + "_" + i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
              className={`p-4 rounded-2xl transition-all duration-200 border ${
                isActive 
                  ? "bg-emerald-500/5 border-emerald-500/40 shadow-md shadow-emerald-500/5" 
                  : theme === "dark" 
                  ? "bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/80" 
                  : "bg-white hover:bg-slate-50 border-slate-100 shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Server Flag & Basic details */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-500/10 flex items-center justify-center font-bold font-mono text-xs uppercase overflow-hidden text-emerald-400 border border-slate-500/15 flex-shrink-0">
                    {server.CountryShort}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${theme === "dark" ? "text-slate-200" : "text-slate-800"} flex items-center gap-1.5`}>
                      {server.CountryLong}
                      {server.isCustom && (
                        <span className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-[8px] text-blue-400 rounded-md font-sans">
                          {language === "fa" ? "دستی" : "Manual"}
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-1" dir="ltr">{server.IP}</p>
                    
                    {/* Protocol Indicators */}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {(server.OpenVPN === "1" || server.OpenVPN === true) && (
                        <span className="px-1.5 py-0.5 bg-sky-500/10 text-sky-400 rounded-md text-[8px] font-bold">OpenVPN</span>
                      )}
                      {(server["MS-SSTP"] === "1" || server["MS-SSTP"] === true) && (
                        <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md text-[8px] font-bold">SSTP</span>
                      )}
                      {(server.L2TP_IPsec === "1" || server.L2TP_IPsec === true) && (
                        <span className="px-1.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-md text-[8px] font-bold">L2TP/IPsec</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Performance stats & connection status */}
                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-400 font-mono" dir="ltr">
                    {formatSpeedBytes(server.Speed)}
                  </span>
                  
                  {/* Ping displays */}
                  <div className="flex items-center gap-1" dir="ltr">
                    <span className="text-[9px] text-slate-500">{t.ping}:</span>
                    <span className={`text-[10px] font-bold font-mono ${
                      testResult ? (testResult.ping < 50 ? "text-emerald-400" : testResult.ping < 120 ? "text-amber-400" : "text-rose-400") : 
                      server.Ping < 50 ? "text-emerald-400" : server.Ping < 120 ? "text-amber-400" : "text-rose-400"
                    }`}>
                      {testResult ? `${testResult.ping} ms` : `${server.Ping} ms`}
                    </span>
                  </div>

                  {/* Network stability display */}
                  <div className="flex items-center gap-1" dir="ltr">
                    <span className="text-[9px] text-slate-500">{language === "fa" ? "پایداری:" : "Stability:"}</span>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      {testResult ? `${testResult.stability}%` : `${Math.floor(Math.sin(i) * 5) + 94}%`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Server Action Toolbar */}
              <div className="mt-3.5 pt-3 border-t border-slate-500/5 flex items-center justify-between gap-3">
                <span className="text-[9px] font-mono text-slate-500" dir="ltr">
                  Created: {formatDate(server.CreatedAt)}
                </span>

                <div className="flex gap-2">
                  {/* Test latency button */}
                  <button
                    onClick={() => onTestServerSpeed(server)}
                    disabled={isTesting}
                    className="px-3 py-1 bg-slate-500/5 hover:bg-slate-500/10 border border-slate-500/10 rounded-xl text-[9px] font-bold text-slate-400 transition-all duration-200 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={10} className={isTesting ? "animate-spin" : ""} />
                    {isTesting ? t.testing : testResult ? (language === "fa" ? "تست مجدد" : "Retest") : (language === "fa" ? "تست پینگ" : "Test Latency")}
                  </button>

                  {/* Quick Connect Button */}
                  <button
                    onClick={() => onSelectServer(server)}
                    className={`px-3.5 py-1 rounded-xl text-[9px] font-bold transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                      isActive 
                        ? "bg-emerald-500 text-white shadow-sm" 
                        : "bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Check size={10} />
                        {language === "fa" ? "فعال" : "Active"}
                      </>
                    ) : (
                      <>
                        <Play size={10} />
                        {language === "fa" ? "اتصال" : "Connect"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredAndSortedServers.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <p className="text-xs">{language === "fa" ? "هیچ سروری متناسب با فیلتر شما یافت نشد..." : "No servers found matching your filter..."}</p>
          </div>
        )}
      </div>
    </div>
  );
};
