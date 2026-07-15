import React, { useState, useEffect } from "react";
import { 
  Zap, RefreshCw, CheckCircle2, ChevronRight, Server, 
  Activity, ArrowDown, ArrowUp, Info, AlertTriangle, ShieldCheck
} from "lucide-react";
import { VpnServer } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface SpeedTestPanelProps {
  activeServer: VpnServer | null;
  theme: "dark" | "light";
}

export const SpeedTestPanel: React.FC<SpeedTestPanelProps> = ({
  activeServer,
  theme
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testStep, setTestStep] = useState<"idle" | "ping" | "download" | "upload" | "finished">("idle");
  const [progress, setProgress] = useState(0);

  // Test stats
  const [ping, setPing] = useState(0);
  const [jitter, setJitter] = useState(0);
  const [download, setDownload] = useState(0);
  const [upload, setUpload] = useState(0);
  const [stability, setStability] = useState(0);

  const startTest = () => {
    if (isRunning) return;
    setIsRunning(true);
    setTestStep("ping");
    setProgress(10);
    setPing(0);
    setJitter(0);
    setDownload(0);
    setUpload(0);
    setStability(0);
  };

  useEffect(() => {
    if (!isRunning) return;

    let timer: NodeJS.Timeout;

    if (testStep === "ping") {
      timer = setTimeout(() => {
        // Mock Ping test
        const basePing = activeServer ? activeServer.Ping : Math.floor(Math.random() * 50) + 15;
        setPing(basePing + Math.floor(Math.random() * 10));
        setJitter(Math.floor(Math.random() * 8) + 1);
        setTestStep("download");
        setProgress(40);
      }, 1500);
    } else if (testStep === "download") {
      // Simulate download progress/ticker
      let ticks = 0;
      const interval = setInterval(() => {
        setDownload(parseFloat((Math.random() * 40 + 25).toFixed(1))); // 25 - 65 Mbps
        ticks++;
        if (ticks >= 10) {
          clearInterval(interval);
          setTestStep("upload");
          setProgress(75);
        }
      }, 200);
      return () => clearInterval(interval);
    } else if (testStep === "upload") {
      let ticks = 0;
      const interval = setInterval(() => {
        setUpload(parseFloat((Math.random() * 15 + 10).toFixed(1))); // 10 - 25 Mbps
        ticks++;
        if (ticks >= 10) {
          clearInterval(interval);
          setStability(Math.floor(Math.random() * 10) + 90); // 90% - 100%
          setTestStep("finished");
          setProgress(100);
          setIsRunning(false);
        }
      }, 200);
      return () => clearInterval(interval);
    }

    return () => clearTimeout(timer);
  }, [isRunning, testStep, activeServer]);

  // Determine health index description
  const getRecommendation = () => {
    if (ping === 0) return "آماده برای تست سرعت اتصال...";
    if (ping < 45 && stability > 93) {
      return "کیفیت عالی! اتصال شما پایدار است و پاسخ‌دهی فوق‌العاده سریعی دارد. مناسب برای بازی و مکالمه تصویری.";
    }
    if (ping < 110 && stability > 88) {
      return "کیفیت مطلوب. سرعت اتصال مناسب وب‌گردی و تماشای ویدئوهای باکیفیت بالا است.";
    }
    return "کیفیت متوسط. ممکن است به دلیل پینگ بالا یا ناپایداری جزئی شبکه، افت سرعت را تجربه کنید. پیشنهاد می‌شود سرور دیگری را انتخاب کنید.";
  };

  return (
    <div className="space-y-6">
      {/* Gauge Meter container */}
      <div className={`p-6 rounded-3xl ${
        theme === "dark" 
          ? "bg-slate-900/60 border border-slate-800/80" 
          : "bg-white border border-slate-100 shadow-sm"
      } flex flex-col items-center justify-center relative overflow-hidden`}>
        
        <h3 className={`text-xs font-bold ${theme === "dark" ? "text-slate-300" : "text-slate-800"} mb-5 flex items-center gap-1.5`}>
          <Activity size={14} className="text-cyan-400" />
          تست سرعت و کیفیت شبکه VpnG
        </h3>

        {/* Speedometer Gauge Visualizer */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Semicircle Track */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="76"
              className="stroke-slate-800/30"
              strokeWidth="10"
              fill="none"
              strokeDasharray="240 360"
              strokeLinecap="round"
            />
            {/* Animated Progress indicator */}
            <motion.circle
              cx="96"
              cy="96"
              r="76"
              className={testStep === "upload" ? "stroke-cyan-500" : "stroke-emerald-500"}
              strokeWidth="10"
              fill="none"
              strokeDasharray={`${(progress / 100) * 240} 360`}
              strokeLinecap="round"
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 0.5 }}
            />
          </svg>

          {/* Central digital value */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            {testStep === "idle" && (
              <>
                <Zap size={28} className="text-slate-500 mb-1" />
                <span className="text-[10px] text-slate-500 font-bold">آماده تست</span>
              </>
            )}
            
            {testStep === "ping" && (
              <>
                <RefreshCw size={24} className="text-emerald-500 animate-spin mb-1" />
                <span className="text-[10px] text-emerald-400 font-bold">تست پینگ...</span>
              </>
            )}

            {testStep === "download" && (
              <>
                <ArrowDown size={28} className="text-emerald-400 animate-bounce mb-1" />
                <span className="text-2xl font-black font-mono text-emerald-400">{download || "0.0"}</span>
                <span className="text-[9px] text-slate-500 font-bold">دانلود Mbps</span>
              </>
            )}

            {testStep === "upload" && (
              <>
                <ArrowUp size={28} className="text-cyan-400 animate-bounce mb-1" />
                <span className="text-2xl font-black font-mono text-cyan-400">{upload || "0.0"}</span>
                <span className="text-[9px] text-slate-500 font-bold">آپلود Mbps</span>
              </>
            )}

            {testStep === "finished" && (
              <>
                <CheckCircle2 size={28} className="text-emerald-400 mb-1" />
                <span className="text-2xl font-black font-mono text-emerald-400">{download || "0.0"}</span>
                <span className="text-[9px] text-slate-500 font-bold">دانلود Mbps</span>
              </>
            )}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={startTest}
          disabled={isRunning}
          className={`mt-4 px-6 py-2.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
            isRunning
              ? "bg-slate-500/10 border border-slate-500/20 text-slate-400 animate-pulse"
              : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/10"
          }`}
        >
          <Zap size={13} className={isRunning ? "animate-ping" : ""} />
          {isRunning ? "در حال اجرای تست..." : "شروع تست سرعت"}
        </button>
      </div>

      {/* Speed Metrics display cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Latency (Ping) */}
        <div className={`p-4 rounded-2xl ${
          theme === "dark" ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-slate-100 shadow-sm"
        }`}>
          <p className="text-[10px] text-slate-500 font-bold">تأخیر (Ping)</p>
          <p className={`text-lg font-black font-mono mt-1 ${ping > 0 ? "text-emerald-400" : "text-slate-500"}`}>
            {ping > 0 ? `${ping} ms` : "---"}
          </p>
          <p className="text-[8px] text-slate-500 mt-1">جیتر نوسان: {jitter > 0 ? `${jitter} ms` : "0 ms"}</p>
        </div>

        {/* Network Stability */}
        <div className={`p-4 rounded-2xl ${
          theme === "dark" ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-slate-100 shadow-sm"
        }`}>
          <p className="text-[10px] text-slate-500 font-bold">پایداری اتصال (Stability)</p>
          <p className={`text-lg font-black font-mono mt-1 ${stability > 0 ? "text-emerald-400" : "text-slate-500"}`}>
            {stability > 0 ? `${stability}%` : "---"}
          </p>
          <p className="text-[8px] text-slate-500 mt-1">نرخ پایداری پکت‌های ارسالی</p>
        </div>

        {/* Upload Rate */}
        <div className={`p-4 rounded-2xl ${
          theme === "dark" ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-slate-100 shadow-sm"
        }`}>
          <p className="text-[10px] text-slate-500 font-bold">حداکثر سرعت آپلود</p>
          <p className={`text-lg font-black font-mono mt-1 ${upload > 0 ? "text-cyan-400" : "text-slate-500"}`}>
            {upload > 0 ? `${upload} Mbps` : "---"}
          </p>
          <p className="text-[8px] text-slate-500 mt-1">سرعت ارسال فایل</p>
        </div>

        {/* Current Server */}
        <div className={`p-4 rounded-2xl ${
          theme === "dark" ? "bg-slate-900/60 border border-slate-800/80" : "bg-white border border-slate-100 shadow-sm"
        } flex flex-col justify-between`}>
          <div>
            <p className="text-[10px] text-slate-500 font-bold">سرور تحت تست</p>
            <p className={`text-[11px] font-bold truncate mt-1 ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}>
              {activeServer ? activeServer.HostName : "سرور پیش‌فرض"}
            </p>
          </div>
          <p className="text-[8px] text-slate-500 font-mono mt-1 truncate">{activeServer ? activeServer.IP : "0.0.0.0"}</p>
        </div>
      </div>

      {/* Recommendation and Status Log Description */}
      <div className={`p-4 rounded-3xl ${
        theme === "dark" ? "bg-slate-950 border border-slate-900" : "bg-slate-50 border border-slate-100"
      }`}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <Info size={16} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400">توصیه هوشمند VpnG</span>
            <p className={`text-xs mt-1 leading-relaxed ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
              {getRecommendation()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
