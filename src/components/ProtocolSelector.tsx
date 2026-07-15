import React from "react";
import { Shield, Globe, Network, ChevronRight, X } from "lucide-react";
import { VpnServer } from "../types";
import { motion } from "motion/react";

interface ProtocolSelectorProps {
  server: VpnServer;
  onSelectProtocol: (protocol: "SoftEther" | "OpenVPN_TCP" | "OpenVPN_UDP" | "SSTP") => void;
  onClose: () => void;
  theme: "dark" | "light";
}

export const ProtocolSelector: React.FC<ProtocolSelectorProps> = ({
  server,
  onSelectProtocol,
  onClose,
  theme
}) => {
  // A helper component to render the beautiful green star shield icon from the screenshot
  const StarShieldIcon = () => (
    <div className="relative w-11 h-11 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 flex-shrink-0">
      <div className="absolute top-1 right-1 text-[7px] text-emerald-500">★</div>
      <Shield className="text-emerald-500 stroke-[2]" size={22} />
      <span className="absolute bottom-2.5 font-sans text-[7px] font-bold text-emerald-400">6</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ y: "100%", opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0.5 }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className={`w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 pb-8 space-y-6 shadow-2xl border relative z-10 ${
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

        {/* Header Block mimicking Screenshot 2 */}
        <div className="space-y-4">
          <h3 className="text-base font-black tracking-wide pr-8 font-sans">
            Select VPN Protocol
          </h3>

          {/* Dynamic Orb Block */}
          <div className={`p-4 rounded-2xl flex items-center gap-3.5 border ${
            theme === "dark" ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-100"
          }`}>
            {/* Circular network orb icon */}
            <div className="w-11 h-11 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Network size={20} className="text-indigo-400 stroke-[2]" />
            </div>

            <div className="space-y-0.5 truncate flex-1 text-left" dir="ltr">
              <h4 className="text-xs font-bold font-mono text-slate-800 dark:text-slate-100 truncate">
                {server.HostName}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">
                {server.CountryLong}
              </p>
            </div>
          </div>
        </div>

        {/* Available Protocols section heading */}
        <div className="space-y-3.5">
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider font-sans">
            Available Protocols
          </span>

          {/* List of custom-styled protocol action cards */}
          <div className="space-y-3">
            
            {/* SoftEther TCP Option */}
            <button
              onClick={() => onSelectProtocol("SoftEther")}
              className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 text-left cursor-pointer group ${
                theme === "dark" 
                  ? "bg-slate-950/30 hover:bg-slate-950/60 border-slate-800/80 hover:border-emerald-500/40" 
                  : "bg-white hover:bg-slate-50/80 border-slate-150 hover:border-emerald-500/40 shadow-sm"
              }`}
              dir="ltr"
            >
              <div className="flex items-center gap-3.5">
                <StarShieldIcon />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    SoftEther VPN (TCP)
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Available on port 1381
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
            </button>

            {/* OpenVPN TCP Option */}
            <button
              onClick={() => onSelectProtocol("OpenVPN_TCP")}
              className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 text-left cursor-pointer group ${
                theme === "dark" 
                  ? "bg-slate-950/30 hover:bg-slate-950/60 border-slate-800/80 hover:border-emerald-500/40" 
                  : "bg-white hover:bg-slate-50/80 border-slate-150 hover:border-emerald-500/40 shadow-sm"
              }`}
              dir="ltr"
            >
              <div className="flex items-center gap-3.5">
                <StarShieldIcon />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    OpenVPN (TCP)
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Available on port 1381
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
            </button>

            {/* OpenVPN UDP Option */}
            <button
              onClick={() => onSelectProtocol("OpenVPN_UDP")}
              className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 text-left cursor-pointer group ${
                theme === "dark" 
                  ? "bg-slate-950/30 hover:bg-slate-950/60 border-slate-800/80 hover:border-emerald-500/40" 
                  : "bg-white hover:bg-slate-50/80 border-slate-150 hover:border-emerald-500/40 shadow-sm"
              }`}
              dir="ltr"
            >
              <div className="flex items-center gap-3.5">
                <StarShieldIcon />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    OpenVPN (UDP)
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Available on port 1205
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
            </button>

            {/* MS-SSTP Option */}
            <button
              onClick={() => onSelectProtocol("SSTP")}
              disabled={server["MS-SSTP"] === "0" || server["MS-SSTP"] === false}
              className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 text-left cursor-pointer group ${
                server["MS-SSTP"] === "0" || server["MS-SSTP"] === false
                  ? "opacity-40 cursor-not-allowed"
                  : theme === "dark" 
                  ? "bg-slate-950/30 hover:bg-slate-950/60 border-slate-800/80 hover:border-emerald-500/40" 
                  : "bg-white hover:bg-slate-50/80 border-slate-150 hover:border-emerald-500/40 shadow-sm"
              }`}
              dir="ltr"
            >
              <div className="flex items-center gap-3.5">
                <StarShieldIcon />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    MS-SSTP
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {server["MS-SSTP"] === "0" || server["MS-SSTP"] === false ? "Not supported by this host" : "Available on port 1381"}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
            </button>

          </div>
        </div>
      </motion.div>
    </div>
  );
};
