import React, { useState, useEffect, useRef } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { 
  Shield, Zap, Activity, Clock, Server, RefreshCw, 
  ArrowUpRight, ArrowDownLeft, Terminal, ShieldCheck, ShieldAlert
} from "lucide-react";
import { VpnServer, VpnProfile, TrafficDataPoint } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { translations, Language } from "../lib/translations";
import { VpnGLogo } from "./VpnGLogo";

interface DashboardProps {
  activeServer: VpnServer | null;
  activeProfile: VpnProfile;
  isConnected: boolean;
  isConnecting: boolean;
  onConnectToggle: () => void;
  connectionLogs: string[];
  trafficHistory: TrafficDataPoint[];
  lastRefreshDate: string;
  onAutoSelectConnect: () => void;
  killSwitchEnabled: boolean;
  theme: "dark" | "light";
  language: Language;
}

export const Dashboard: React.FC<DashboardProps> = ({
  activeServer,
  activeProfile,
  isConnected,
  isConnecting,
  onConnectToggle,
  connectionLogs,
  trafficHistory,
  lastRefreshDate,
  onAutoSelectConnect,
  killSwitchEnabled,
  theme,
  language
}) => {
  const [uptime, setUptime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const t = translations[language];

  useEffect(() => {
    if (isConnected) {
      setUptime(0);
      timerRef.current = setInterval(() => {
        setUptime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isConnected]);

  // Current speeds
  const currentDownloadSpeed = trafficHistory.length > 0 
    ? trafficHistory[trafficHistory.length - 1].download 
    : 0;
  const currentUploadSpeed = trafficHistory.length > 0 
    ? trafficHistory[trafficHistory.length - 1].upload 
    : 0;

  // Format uptime
  const formatUptime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, "0"),
      mins.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0")
    ].join(":");
  };

  const formatSpeed = (kbps: number) => {
    if (kbps >= 1024) {
      return `${(kbps / 1024).toFixed(1)} MB/s`;
    }
    return `${kbps.toFixed(1)} KB/s`;
  };

  return (
    <div className="space-y-6">
      {/* Visual Identity Area - Centering the official brand logo nicely cropped to squircle */}
      <div className="flex flex-col items-center justify-center pt-2">
        <VpnGLogo size={150} showText={true} />
        
        {/* Dynamic connection info tag */}
        <div className="mt-6 mb-4">
          <span className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider flex items-center gap-1.5 ${
            isConnected 
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
              : isConnecting 
              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse" 
              : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-emerald-500 animate-ping" : isConnecting ? "bg-cyan-500 animate-ping" : "bg-slate-500"
            }`} />
            {isConnected ? t.vpnConnected : isConnecting ? t.vpnConnecting : t.vpnDisconnected}
          </span>
        </div>

        {/* Large Glowing Shield Connect Button */}
        <div className="relative my-4 flex items-center justify-center">
          {/* Neon Glow Circles */}
          <AnimatePresence>
            {(isConnected || isConnecting) && (
              <>
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.4, opacity: 0.15 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                  className={`absolute w-44 h-44 rounded-full ${isConnected ? "bg-emerald-500" : "bg-cyan-500"}`}
                />
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.7, opacity: 0.08 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut", delay: 0.5 }}
                  className={`absolute w-44 h-44 rounded-full ${isConnected ? "bg-emerald-500" : "bg-cyan-500"}`}
                />
              </>
            )}
          </AnimatePresence>

          {/* Central Button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onConnectToggle}
            disabled={isConnecting}
            id="vpn_g_main_shield_button"
            className={`w-36 h-36 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative z-10 ${
              isConnected 
                ? "bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-xl shadow-emerald-500/30 border-2 border-emerald-400/30" 
                : isConnecting 
                ? "bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-xl shadow-cyan-500/30 border-2 border-cyan-400/30 animate-pulse" 
                : "bg-gradient-to-tr from-slate-800 to-slate-700 border-2 border-slate-600/40 shadow-lg"
            }`}
          >
            {/* The VpnG logo design overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <svg width="100%" height="100%" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="3 3" />
              </svg>
            </div>

            {/* Glowing Icon */}
            {killSwitchEnabled && !isConnected ? (
              <ShieldAlert className="w-14 h-14 text-amber-500 drop-shadow-lg" />
            ) : isConnected ? (
              <ShieldCheck className="w-16 h-16 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]" />
            ) : (
              <Shield className="w-14 h-14 text-slate-300 drop-shadow-md" />
            )}

            <span className="text-white text-xs font-bold mt-2 tracking-wide font-sans">
              {isConnected ? t.disconnect : isConnecting ? t.connecting : t.connectNow}
            </span>
          </motion.button>
        </div>

        {/* Selected server profile display */}
        <div className="mt-4 text-center max-w-sm">
          <p className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"} flex items-center justify-center gap-1.5`}>
            <Server size={13} className="text-slate-500" />
            {t.activeProfile}: <strong className={theme === "dark" ? "text-slate-200" : "text-slate-800"}>{activeProfile.name}</strong>
          </p>
          {activeServer && (
            <p className="text-xs text-slate-400 mt-1 font-mono flex items-center justify-center gap-1" dir="ltr">
              <span className="inline-block w-4 h-3 rounded-sm bg-slate-800 border border-slate-700/50 flex-shrink-0 text-[8px] flex items-center justify-center font-bold text-white uppercase overflow-hidden">
                {activeServer.CountryShort}
              </span>
              {activeServer.CountryLong} ({activeServer.IP})
            </p>
          )}
        </div>

        {/* Quick actions for connection */}
        {!isConnected && !isConnecting && (
          <button 
            onClick={onAutoSelectConnect}
            className="mt-4 px-4 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold transition-all duration-200 flex items-center gap-1 cursor-pointer"
          >
            <Zap size={12} />
            {t.autoConnect}
          </button>
        )}
      </div>

      {/* Grid of live connection metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-2xl ${
          theme === "dark" ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-slate-100 shadow-sm"
        } flex items-center gap-3`}>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <ArrowDownLeft size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-medium">{t.downloadSpeed}</p>
            <p className={`text-sm font-bold font-mono ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`} dir="ltr">
              {isConnected ? formatSpeed(currentDownloadSpeed) : "0.0 KB/s"}
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-2xl ${
          theme === "dark" ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-slate-100 shadow-sm"
        } flex items-center gap-3`}>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <ArrowUpRight size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-medium">{t.uploadSpeed}</p>
            <p className={`text-sm font-bold font-mono ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`} dir="ltr">
              {isConnected ? formatSpeed(currentUploadSpeed) : "0.0 KB/s"}
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-2xl ${
          theme === "dark" ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-slate-100 shadow-sm"
        } flex items-center gap-3`}>
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 flex-shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-medium">{t.connectedTime}</p>
            <p className={`text-sm font-bold font-mono ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`} dir="ltr">
              {isConnected ? formatUptime(uptime) : "00:00:00"}
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-2xl ${
          theme === "dark" ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-slate-100 shadow-sm"
        } flex items-center gap-3`}>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-medium">{t.ping}</p>
            <p className={`text-sm font-bold font-mono ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`} dir="ltr">
              {isConnected && activeServer ? `${activeServer.Ping} ms` : "---"}
            </p>
          </div>
        </div>
      </div>

      {/* Traffic Monitoring Area Chart */}
      <div className={`p-5 rounded-3xl ${
        theme === "dark" ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-slate-100 shadow-sm"
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="text-emerald-500" size={18} />
            <h3 className={`text-sm font-bold ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}>{t.realtimeTraffic}</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">{t.trafficSpeedUnit}: KB/s</span>
        </div>

        <div className="h-44 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trafficHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <YAxis tickStyle={{ fill: "#64748b", fontSize: 9 }} />
              <Tooltip 
                contentStyle={{ 
                backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff", 
                  borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
                  borderRadius: "12px",
                  fontSize: "11px",
                  color: theme === "dark" ? "#cbd5e1" : "#1e293b"
                }} 
              />
              <Area 
                name={language === "fa" ? "دریافت (Download)" : "Download"}
                type="monotone" 
                dataKey="download" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorDownload)" 
              />
              <Area 
                name={language === "fa" ? "ارسال (Upload)" : "Upload"}
                type="monotone" 
                dataKey="upload" 
                stroke="#06b6d4" 
                strokeWidth={1.5}
                fillOpacity={1} 
                fill="url(#colorUpload)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Connection Logs Panel */}
      <div className={`p-4 rounded-3xl ${
        theme === "dark" ? "bg-slate-950 border border-slate-900" : "bg-slate-50 border border-slate-100"
      }`}>
        <div className="flex items-center gap-2 mb-2 text-slate-500">
          <Terminal size={14} />
          <span className="text-xs font-bold font-sans">{t.connectionHistory}</span>
        </div>
        <div className="h-24 overflow-y-auto font-mono text-[10px] space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 text-left" dir="ltr">
          {connectionLogs.map((log, index) => (
            <div key={index} className="flex items-start gap-1">
              <span className="text-emerald-500 select-none">&gt;</span>
              <p className={theme === "dark" ? "text-slate-300" : "text-slate-700"}>{log}</p>
            </div>
          ))}
          {connectionLogs.length === 0 && (
            <p className="text-slate-500 italic p-1">{t.emptyLogs}</p>
          )}
        </div>
      </div>
    </div>
  );
};
