import React from "react";
import { Shield, Globe, Network, ChevronRight, X, Zap, Cpu, Lock } from "lucide-react";
import { VpnServer } from "../types";
import { motion } from "motion/react";
import { translations, Language } from "../lib/translations";

export type SelectorProtocol = 
  | "SOFETHER_TCP"
  | "SOFETHER_UDP"
  | "OPENVPN_TCP"
  | "OPENVPN_UDP"
  | "SSTP"
  | "L2TP";

interface ProtocolSelectorProps {
  server: VpnServer;
  onSelectProtocol: (protocol: SelectorProtocol) => void;
  onClose: () => void;
  theme: "dark" | "light";
  language: Language;
}

export const ProtocolSelector: React.FC<ProtocolSelectorProps> = ({
  server,
  onSelectProtocol,
  onClose,
  theme,
  language
}) => {
  const t = translations[language];

  // A helper component to render the beautiful green star shield icon
  const StarShieldIcon = ({ colorClass = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" }: { colorClass?: string }) => (
    <div className={`relative w-11 h-11 rounded-2xl flex items-center justify-center border flex-shrink-0 ${colorClass}`}>
      <div className="absolute top-1 right-1 text-[7px]">★</div>
      <Shield className="stroke-[2]" size={20} />
      <span className="absolute bottom-2.5 font-sans text-[7px] font-bold">6</span>
    </div>
  );

  const protocolsList: {
    id: SelectorProtocol;
    label: string;
    desc: string;
    supported: boolean;
    icon: React.ReactNode;
  }[] = [
    {
      id: "SOFETHER_TCP",
      label: "SOFETHER TCP",
      desc: language === "fa" ? "سافت‌اتر TCP بر بستر پورت ایمن HTTPS/TLS ۴۴۳" : "SoftEther TCP over secure HTTPS/TLS port 443 ✅ Supported",
      supported: true,
      icon: <StarShieldIcon colorClass="text-emerald-500 bg-emerald-500/10 border-emerald-500/20" />
    },
    {
      id: "SOFETHER_UDP",
      label: "SOFETHER UDP",
      desc: language === "fa" ? "سافت‌اتر UDP پرسرعت برای اتصالات گیمینگ" : "SoftEther UDP protocol for high-performance low latency",
      supported: true,
      icon: <StarShieldIcon colorClass="text-cyan-400 bg-cyan-500/10 border-cyan-500/20" />
    },
    {
      id: "OPENVPN_TCP",
      label: "Open VPN TCP",
      desc: language === "fa" ? "پروتکل اوپن‌وی‌پی‌ان بر بستر پروتکل قابل اعتماد TCP" : "OpenVPN secure tunneling over reliable TCP protocol",
      supported: server.OpenVPN === "1" || server.OpenVPN === true,
      icon: <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
        <Network size={20} className="stroke-[2]" />
      </div>
    },
    {
      id: "OPENVPN_UDP",
      label: "Open VPN UDP",
      desc: language === "fa" ? "پروتکل اوپن‌وی‌پی‌ان سریع بر بستر UDP" : "OpenVPN high-speed tunnel over UDP protocol",
      supported: server.OpenVPN === "1" || server.OpenVPN === true,
      icon: <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
        <Zap size={20} className="stroke-[2]" />
      </div>
    },
    {
      id: "SSTP",
      label: "SSTP",
      desc: language === "fa" ? "پروتکل امن مایکروسافت بومی برای ویندوز و اندروید" : "Secure Socket Tunneling Protocol natively bypassing firewalls",
      supported: server["MS-SSTP"] === "1" || server["MS-SSTP"] === true,
      icon: <div className="w-11 h-11 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0">
        <Cpu size={20} className="stroke-[2]" />
      </div>
    },
    {
      id: "L2TP",
      label: "L2TP",
      desc: language === "fa" ? "پروتکل استاندارد امنیتی L2TP/IPSec" : "Standard L2TP/IPSec tunnel with pre-shared key credentials",
      supported: server.L2TP_IPsec === "1" || server.L2TP_IPsec === true,
      icon: <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
        <Lock size={18} />
      </div>
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ y: "100%", opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0.5 }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className={`w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 pb-8 space-y-6 shadow-2xl border relative z-10 max-h-[90vh] overflow-y-auto ${
          theme === "dark" 
            ? "bg-slate-900 border-slate-800 text-slate-100" 
            : "bg-white border-slate-200 text-slate-800"
        }`}
      >
        {/* Android drag handle indicator */}
        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 cursor-pointer" onClick={onClose} />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 hover:bg-slate-500/10 rounded-full text-slate-400 dark:text-slate-500 transition-colors cursor-pointer"
          aria-label="Close"
          id="btn-close-protocol-selector"
        >
          <X size={18} />
        </button>

        {/* Header Block */}
        <div className="space-y-4">
          <h3 className="text-base font-black tracking-wide pr-8 font-sans text-left">
            {t.chooseProtocolTitle}
          </h3>
          <p className="text-[11px] text-slate-500 text-left leading-relaxed">
            {t.chooseProtocolDesc}
          </p>

          {/* Dynamic Orb Block */}
          <div className={`p-4 rounded-2xl flex items-center gap-3.5 border ${
            theme === "dark" ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-100"
          }`}>
            <div className="w-11 h-11 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Network size={20} className="text-indigo-400 stroke-[2]" />
            </div>

            <div className="space-y-0.5 truncate flex-1 text-left" dir="ltr">
              <h4 className="text-xs font-bold font-mono text-slate-800 dark:text-slate-100 truncate">
                {server.HostName}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">
                {server.CountryLong} ({server.IP})
              </p>
            </div>
          </div>
        </div>

        {/* Available Protocols list */}
        <div className="space-y-3">
          {protocolsList.map((proto) => (
            <button
              key={proto.id}
              disabled={!proto.supported}
              onClick={() => onSelectProtocol(proto.id)}
              className={`w-full p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 text-left cursor-pointer group ${
                !proto.supported
                  ? "opacity-35 cursor-not-allowed border-slate-200/50 dark:border-slate-850/50"
                  : theme === "dark" 
                  ? "bg-slate-950/30 hover:bg-slate-950/60 border-slate-800/80 hover:border-emerald-500/40" 
                  : "bg-white hover:bg-slate-50/80 border-slate-150 hover:border-emerald-500/40 shadow-sm"
              }`}
              dir="ltr"
            >
              <div className="flex items-center gap-3.5 text-left">
                {proto.icon}
                <div className="text-left">
                  <h4 className={`text-xs font-bold ${!proto.supported ? "text-slate-400 dark:text-slate-600" : "text-slate-800 dark:text-slate-200"} flex items-center gap-2`}>
                    {proto.label}
                    {!proto.supported && (
                      <span className="text-[8px] font-sans px-1 bg-rose-500/10 text-rose-400 rounded-md border border-rose-500/10 font-normal">
                        {language === "fa" ? "پشتیبانی نمی‌شود" : "Not Supported"}
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {proto.desc}
                  </p>
                </div>
              </div>
              {proto.supported && (
                <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
