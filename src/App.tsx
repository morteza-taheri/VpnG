import React, { useState, useEffect, useRef } from "react";
import { 
  Shield, Server, Activity, Settings as SettingsIcon, Zap, 
  HelpCircle, RefreshCw, Sun, Moon, Info, LayoutDashboard, Database, ListCollapse
} from "lucide-react";
import { VpnServer, VpnProfile, AppFilterItem, TrafficDataPoint, SpeedTestResult } from "./types";
import { INITIAL_PROFILES, INITIAL_APP_FILTERS } from "./data";
import { Dashboard } from "./components/Dashboard";
import { ServerList } from "./components/ServerList";
import { ServerDetails } from "./components/ServerDetails";
import { ProtocolSelector } from "./components/ProtocolSelector";
import { Profiles } from "./components/Profiles";
import { Settings } from "./components/Settings";
import { SpeedTestPanel } from "./components/SpeedTestPanel";
import { motion, AnimatePresence } from "motion/react";
import { Key, Wifi } from "lucide-react";
import { VpnGLogo } from "./components/VpnGLogo";
import { translations } from "./lib/translations";

export default function App() {
  // Navigation tabs: "dashboard" | "servers" | "profiles" | "speedtest" | "settings"
  const [activeTab, setActiveTab] = useState<"dashboard" | "servers" | "profiles" | "speedtest" | "settings">("dashboard");
  
  // Theme state
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("vpng_theme") as "dark" | "light") || "dark";
  });

  // VPN Servers
  const [servers, setServers] = useState<VpnServer[]>([]);
  const [activeServer, setActiveServer] = useState<VpnServer | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Connection Profiles
  const [profiles, setProfiles] = useState<VpnProfile[]>(() => {
    const saved = localStorage.getItem("vpng_profiles");
    return saved ? JSON.parse(saved) : INITIAL_PROFILES;
  });

  // App Filter List
  const [appFilters, setAppFilters] = useState<AppFilterItem[]>(() => {
    const saved = localStorage.getItem("vpng_app_filters");
    return saved ? JSON.parse(saved) : INITIAL_APP_FILTERS;
  });

  // Other configurations
  const [killSwitchEnabled, setKillSwitchEnabled] = useState<boolean>(() => {
    return localStorage.getItem("vpng_kill_switch") === "true";
  });
  const [dnsLeakProtection, setDnsLeakProtection] = useState<boolean>(() => {
    return localStorage.getItem("vpng_dns_leak") !== "false"; // Default true
  });

  // Active Connection states
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);
  const [trafficHistory, setTrafficHistory] = useState<TrafficDataPoint[]>([]);

  // Android VPN Permission Dialog state
  const [showVpnPermission, setShowVpnPermission] = useState(false);
  const [permissionTarget, setPermissionTarget] = useState<"manual" | "auto" | "server" | null>(null);
  const [pendingServer, setPendingServer] = useState<VpnServer | null>(null);

  // Speed test simulation parameters
  const [testingServers, setTestingServers] = useState<Record<string, boolean>>({});
  const [testedStats, setTestedStats] = useState<Record<string, { ping: number; speedMbps: number; stability: number }>>({});

  // Server Details screen state
  const [selectedServerForDetails, setSelectedServerForDetails] = useState<VpnServer | null>(null);

  // Protocol Selector bottom sheet state
  const [showProtocolSelector, setShowProtocolSelector] = useState(false);
  const [serverForProtocolSelector, setServerForProtocolSelector] = useState<VpnServer | null>(null);

  // Simulated Android Status Bar Clock state
  const [currentTime, setCurrentTime] = useState("");

  // Language state (Added alongside Persian as requested!)
  const [language, setLanguage] = useState<"fa" | "en">((): "fa" | "en" => {
    return (localStorage.getItem("vpng_language") as "fa" | "en") || "fa";
  });

  const trafficIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save language to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("vpng_language", language);
  }, [language]);

  // Update clock every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.getHours().toString().padStart(2, '0') + ":" + 
        now.getMinutes().toString().padStart(2, '0')
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 15000); // 15s checks
    return () => clearInterval(interval);
  }, []);

  // Save configurations in local storage whenever they change
  useEffect(() => {
    localStorage.setItem("vpng_profiles", JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem("vpng_app_filters", JSON.stringify(appFilters));
  }, [appFilters]);

  useEffect(() => {
    localStorage.setItem("vpng_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Fetch servers from the Express backend `/api/servers` on load
  useEffect(() => {
    fetchServers(false);
  }, []);

  const fetchServers = async (forceRefresh = false) => {
    setIsRefreshing(true);
    try {
      const url = `/api/servers${forceRefresh ? "?refresh=true" : ""}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.servers) {
        setServers(data.servers);
        setLastUpdated(data.lastUpdated);
        
        // Save to offline backup database in localStorage
        localStorage.setItem("vpng_servers_cache", JSON.stringify(data.servers));
        localStorage.setItem("vpng_servers_last_update", data.lastUpdated);

        // Auto select active server if none selected yet
        if (data.servers.length > 0 && !activeServer) {
          setActiveServer(data.servers[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch servers from API, loading offline database cache...", err);
      // Fallback offline database
      const cached = localStorage.getItem("vpng_servers_cache");
      const cachedDate = localStorage.getItem("vpng_servers_last_update");
      if (cached) {
        setServers(JSON.parse(cached));
        setLastUpdated(cachedDate || new Date().toISOString());
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const activeProfile = profiles.find(p => p.isActive) || profiles[0];

  // Dynamic connection logs handshaking simulations
  const runHandshakeSimulation = () => {
    setIsConnecting(true);
    setIsConnected(false);
    setConnectionLogs([]);

    const steps = [
      { text: "VpnG: سوکت ارتباطی ایجاد شد. در حال مقداردهی اولیه...", delay: 0 },
      { text: `SoftEther: در حال تحلیل آدرس هاست [${activeProfile.host}]...`, delay: 600 },
      { text: `SoftEther: برقراری لایه امنیتی SSL/TLS (AES-256-GCM)...`, delay: 1200 },
      { text: `VpnG: احراز هویت با پروتکل [${activeProfile.protocol}] آغاز شد...`, delay: 1800 },
      { text: `VpnG: درخواست دسترسی کاربر [${activeProfile.username || "Anonymous"}] تایید شد.`, delay: 2400 },
      { text: "SoftEther: اتصال به مجازی هاب (Virtual Hub) با موفقیت انجام شد.", delay: 3000 },
      { text: "VpnG: آدرس آی‌پی محلی ثبت شد: 10.8.0.42", delay: 3600 },
      { text: "VpnG: اتصال با پایداری کامل برقرار شد. سیستم در وضعیت حفاظت کامل قرار گرفت.", delay: 4200 }
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        setConnectionLogs(prev => [...prev, step.text]);
        if (step.delay === 4200) {
          setIsConnecting(false);
          setIsConnected(true);
          startTrafficSimulation();
        }
      }, step.delay);
    });
  };

  // Start real-time traffic consumption metrics updating every second
  const startTrafficSimulation = () => {
    // Populate initial 15 points
    const initialPoints: TrafficDataPoint[] = Array.from({ length: 15 }, (_, i) => {
      const time = new Date(Date.now() - (15 - i) * 1000).toLocaleTimeString("fa-IR", { second: "2-digit" });
      return { time, download: 0, upload: 0 };
    });
    setTrafficHistory(initialPoints);

    if (trafficIntervalRef.current) clearInterval(trafficIntervalRef.current);

    trafficIntervalRef.current = setInterval(() => {
      // Simulate real traffic rates in KB/s
      const isHighTraffic = Math.random() > 0.7;
      const download = isHighTraffic 
        ? Math.floor(Math.random() * 4000) + 2000 // 2-6 MB/s
        : Math.floor(Math.random() * 600) + 50;   // 50-650 KB/s
      
      const upload = isHighTraffic
        ? Math.floor(Math.random() * 1200) + 400
        : Math.floor(Math.random() * 200) + 15;

      const nowStr = new Date().toLocaleTimeString("fa-IR", { second: "2-digit" });

      setTrafficHistory(prev => {
        const next = [...prev.slice(1), { time: nowStr, download, upload }];
        return next;
      });
    }, 1000);
  };

  const handleConnectToggle = () => {
    if (isConnected) {
      // Disconnect
      if (trafficIntervalRef.current) {
        clearInterval(trafficIntervalRef.current);
        trafficIntervalRef.current = null;
      }
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionLogs(prev => [...prev, "VpnG: ارتباط توسط کاربر قطع گردید."]);
    } else {
      const isGranted = localStorage.getItem("vpng_permission_granted") === "true";
      if (!isGranted) {
        setPermissionTarget("manual");
        setShowVpnPermission(true);
      } else {
        runHandshakeSimulation();
      }
    }
  };

  const applyBestServerAndConnect = (best: VpnServer) => {
    setActiveServer(best);

    // Update active profile connection details to match this server
    setProfiles(prev => prev.map(p => {
      if (p.id === activeProfile.id) {
        return {
          ...p,
          host: best.IP,
          name: `Free VPNGate (${best.CountryLong})`
        };
      }
      return p;
    }));

    // Trigger connection flow
    runHandshakeSimulation();
  };

  // Automatically select the best server (lowest ping, highest score/speed)
  const handleAutoSelectConnect = () => {
    if (servers.length === 0) return;
    
    // Sort by ping ascending, then by speed descending
    const sorted = [...servers].sort((a, b) => {
      if (a.Ping !== b.Ping) return a.Ping - b.Ping;
      return b.Speed - a.Speed;
    });

    const best = sorted[0];
    const isGranted = localStorage.getItem("vpng_permission_granted") === "true";
    if (!isGranted) {
      setPendingServer(best);
      setPermissionTarget("auto");
      setShowVpnPermission(true);
    } else {
      applyBestServerAndConnect(best);
    }
  };

  const applySelectedServerAndConnect = (server: VpnServer) => {
    setActiveServer(server);
    // Update active profile configuration
    setProfiles(prev => prev.map(p => {
      if (p.isActive) {
        return {
          ...p,
          host: server.IP,
          name: `Free VPNGate (${server.CountryLong})`
        };
      }
      return p;
    }));
    
    // Redirect to connection dashboard for high usability
    setActiveTab("dashboard");
    
    // Auto-connect
    runHandshakeSimulation();
  };

  // Selecting a server from the servers list
  const handleSelectServer = (server: VpnServer) => {
    setSelectedServerForDetails(server);
  };

  const handleConnectFromDetails = (server: VpnServer) => {
    setServerForProtocolSelector(server);
    setShowProtocolSelector(true);
  };

  const handleSelectProtocol = (protocolType: "SoftEther" | "OpenVPN_TCP" | "OpenVPN_UDP" | "SSTP") => {
    if (!serverForProtocolSelector) return;
    const server = serverForProtocolSelector;

    // Close selector and details screen
    setShowProtocolSelector(false);
    setSelectedServerForDetails(null);

    // Map selection to VpnProfile details
    let protocolName: "SoftEther" | "L2TP" | "OpenVPN" | "SSTP" = "SoftEther";
    let port = 1381;
    let name = `Free VPNGate (${server.CountryLong})`;

    if (protocolType === "SoftEther") {
      protocolName = "SoftEther";
      port = 1381;
    } else if (protocolType === "OpenVPN_TCP") {
      protocolName = "OpenVPN";
      port = 1381;
    } else if (protocolType === "OpenVPN_UDP") {
      protocolName = "OpenVPN";
      port = 1205;
    } else if (protocolType === "SSTP") {
      protocolName = "SSTP";
      port = 1381;
    }

    // Set active server
    setActiveServer(server);

    // Update active profile connection details to match this server and protocol
    setProfiles(prev => prev.map(p => {
      if (p.isActive || p.id === activeProfile.id) {
        return {
          ...p,
          name: name,
          host: server.IP,
          port: port,
          protocol: protocolName,
          authMethod: "ANONYMOUS"
        };
      }
      return p;
    }));

    // Redirect to connection dashboard for high usability
    setActiveTab("dashboard");

    // Check and request Android VPN Permission
    const isGranted = localStorage.getItem("vpng_permission_granted") === "true";
    if (!isGranted) {
      setPermissionTarget("manual");
      setShowVpnPermission(true);
    } else {
      // Direct connection with handshake simulation
      runHandshakeSimulation();
    }
  };

  const handleAcceptPermission = () => {
    localStorage.setItem("vpng_permission_granted", "true");
    setShowVpnPermission(false);
    
    // Put a gorgeous log indicating permission was granted by user
    setConnectionLogs(["VpnG: مجوز سرویس اندروید VPN تایید شد. برقراری تونل امن..."]);

    if (permissionTarget === "manual") {
      runHandshakeSimulation();
    } else if (permissionTarget === "auto" && pendingServer) {
      applyBestServerAndConnect(pendingServer);
    } else if (permissionTarget === "server" && pendingServer) {
      applySelectedServerAndConnect(pendingServer);
    }
    
    setPermissionTarget(null);
    setPendingServer(null);
  };

  const handleDeclinePermission = () => {
    setShowVpnPermission(false);
    setPermissionTarget(null);
    setPendingServer(null);
    setConnectionLogs(["خطا: اتصال ناموفق بود. درخواست اجازه دسترسی VPN لغو شد."]);
  };

  const handleResetPermission = () => {
    localStorage.removeItem("vpng_permission_granted");
    setConnectionLogs(prev => [...prev, "سیستم: مجوز VPN بازنشانی شد. در اتصال بعدی مجدداً کادر تأیید اندروید نمایش داده خواهد شد."]);
  };

  // Trigger individual server speed testing
  const handleTestServerSpeed = async (server: VpnServer) => {
    setTestingServers(prev => ({ ...prev, [server.IP]: true }));
    try {
      const response = await fetch("/api/speedtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: server.IP, hostName: server.HostName })
      });
      const data = await response.json();
      if (data) {
        setTestedStats(prev => ({
          ...prev,
          [server.IP]: {
            ping: data.ping,
            speedMbps: data.speedMbps,
            stability: data.stability
          }
        }));
      }
    } catch (err) {
      console.error("Speed test failed", err);
    } finally {
      setTestingServers(prev => ({ ...prev, [server.IP]: false }));
    }
  };

  // Profile triggers
  const handleSelectProfile = (id: string) => {
    setProfiles(prev => prev.map(p => ({
      ...p,
      isActive: p.id === id
    })));
  };

  const handleAddProfile = (newProfile: Omit<VpnProfile, "id" | "isActive">) => {
    const profile: VpnProfile = {
      id: "custom_" + Math.random().toString(36).substr(2, 9),
      isActive: false,
      ...newProfile
    };
    setProfiles(prev => [...prev, profile]);
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
  };

  // Settings triggers
  const handleToggleKillSwitch = () => {
    const next = !killSwitchEnabled;
    setKillSwitchEnabled(next);
    localStorage.setItem("vpng_kill_switch", String(next));
  };

  const handleToggleDnsLeak = () => {
    const next = !dnsLeakProtection;
    setDnsLeakProtection(next);
    localStorage.setItem("vpng_dns_leak", String(next));
  };

  const handleToggleAppFilter = (id: string) => {
    setAppFilters(prev => prev.map(app => {
      if (app.id === id) {
        return { ...app, bypassVpn: !app.bypassVpn };
      }
      return app;
    }));
  };

  const handleToggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  const t = translations[language];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === "dark" 
        ? "bg-slate-950 text-slate-100 selection:bg-cyan-500/30" 
        : "bg-slate-50 text-slate-800 selection:bg-emerald-500/20"
    } font-sans pb-24 ${language === "fa" ? "rtl" : "ltr"}`} dir={language === "fa" ? "rtl" : "ltr"}>
      
      {/* Real-time Android Status Bar mimicking Screenshots */}
      <div className={`w-full h-7 px-4.5 flex items-center justify-between text-[11px] font-sans tracking-wide border-b select-none ${
        theme === "dark" 
          ? "bg-slate-950 border-slate-900/60 text-slate-400" 
          : "bg-slate-100 border-slate-200 text-slate-600"
      }`} dir="ltr">
        {/* Left Side: Time, Traffic Speed, Key/VPN indicator */}
        <div className="flex items-center gap-2 font-medium">
          {/* Time display */}
          <span className="font-semibold">{currentTime || "16:23"}</span>
          
          <span className="text-slate-500/30">|</span>
          
          {/* Traffic speed indicator */}
          <div className="flex items-center font-mono text-[10px]">
            {isConnected ? (
              <span>{trafficHistory.length > 0 ? (trafficHistory[trafficHistory.length - 1].download).toFixed(1) : "0.6"}KB/s</span>
            ) : (
              <span>0.0KB/s</span>
            )}
          </div>

          {/* Key / VPN Icon - SHOW ONLY IF CONNECTED (AS REQUESTED!) */}
          {isConnected && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-md font-sans text-[8px] font-bold animate-pulse"
            >
              <Key size={8} className="stroke-[3.5]" />
              <span>VPN</span>
            </motion.div>
          )}
        </div>

        {/* Right Side: Network, Wi-Fi, Battery */}
        <div className="flex items-center gap-1.5">
          {/* Signal Bar Icons using standard styled inline SVG */}
          <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor" className="opacity-80">
            <rect x="0" y="8" width="2" height="2" rx="0.5" />
            <rect x="3" y="6" width="2" height="4" rx="0.5" />
            <rect x="6" y="4" width="2" height="6" rx="0.5" />
            <rect x="9" y="2" width="2" height="8" rx="0.5" />
            <rect x="12" y="0" width="2" height="10" rx="0.5" />
          </svg>

          {/* Wifi Icon */}
          <Wifi size={11} className="opacity-80" />

          {/* Battery pill exactly as Screenshot 1 (shows 55 inside a rounded block with lightning bolt next to it) */}
          <div className="flex items-center gap-0.5">
            <div className={`px-1 rounded-md text-[9px] font-bold border flex items-center justify-center h-4.5 ${
              theme === "dark" 
                ? "bg-slate-900 border-slate-850 text-slate-300" 
                : "bg-white border-slate-250 text-slate-700"
            }`}>
              55
            </div>
            <span className="text-emerald-500 text-[10px] animate-pulse">⚡</span>
          </div>
        </div>
      </div>
      
      {/* Top Application Bar */}
      <header className={`sticky top-0 z-50 px-4 py-4 border-b backdrop-blur-md flex items-center justify-between ${
        theme === "dark" ? "bg-slate-950/80 border-slate-900" : "bg-white/80 border-slate-200"
      }`}>
        <div className="flex items-center gap-2.5">
          {/* Official brand icon using VpnGLogo cropped to squircle as requested! */}
          <VpnGLogo size={36} showText={false} />
          <div>
            <h1 className={`text-sm font-black tracking-wider ${theme === "dark" ? "text-slate-100" : "text-slate-900"} font-sans flex items-center gap-1.5`}>
              VpnG <span className="text-[9px] text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md uppercase tracking-tight">{t.proBadge}</span>
            </h1>
            <p className="text-[8px] text-slate-500">{t.vpngPro}</p>
          </div>
        </div>

        {/* Global theme selection quick switch */}
        <button
          onClick={handleToggleTheme}
          className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-200 cursor-pointer ${
            theme === "dark" 
              ? "bg-slate-900 hover:bg-slate-800 border-slate-800 text-cyan-400" 
              : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-amber-500"
          }`}
        >
          {theme === "dark" ? <Moon size={15} /> : <Sun size={15} />}
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 pt-6 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "dashboard" && (
              <Dashboard
                activeServer={activeServer}
                activeProfile={activeProfile}
                isConnected={isConnected}
                isConnecting={isConnecting}
                onConnectToggle={handleConnectToggle}
                connectionLogs={connectionLogs}
                trafficHistory={trafficHistory}
                lastRefreshDate={lastUpdated}
                onAutoSelectConnect={handleAutoSelectConnect}
                killSwitchEnabled={killSwitchEnabled}
                theme={theme}
                language={language}
              />
            )}

            {activeTab === "servers" && (
              selectedServerForDetails ? (
                <ServerDetails
                  server={selectedServerForDetails}
                  onBack={() => setSelectedServerForDetails(null)}
                  onConnect={handleConnectFromDetails}
                  excludedAppsCount={appFilters.filter(a => a.bypassVpn).length}
                  theme={theme}
                  onNavigateToSettings={() => {
                    setActiveTab("settings");
                  }}
                />
              ) : (
                <ServerList
                  servers={servers}
                  activeServer={activeServer}
                  onSelectServer={handleSelectServer}
                  onRefresh={() => fetchServers(true)}
                  isRefreshing={isRefreshing}
                  lastUpdated={lastUpdated}
                  theme={theme}
                  onTestServerSpeed={handleTestServerSpeed}
                  testingServers={testingServers}
                  testedStats={testedStats}
                  language={language}
                />
              )
            )}

            {activeTab === "profiles" && (
              <Profiles
                profiles={profiles}
                onSelectProfile={handleSelectProfile}
                onAddProfile={handleAddProfile}
                onDeleteProfile={handleDeleteProfile}
                theme={theme}
              />
            )}

            {activeTab === "speedtest" && (
              <SpeedTestPanel
                activeServer={activeServer}
                theme={theme}
              />
            )}

            {activeTab === "settings" && (
              <Settings
                killSwitchEnabled={killSwitchEnabled}
                onToggleKillSwitch={handleToggleKillSwitch}
                appFilters={appFilters}
                onToggleAppFilter={handleToggleAppFilter}
                theme={theme}
                onToggleTheme={handleToggleTheme}
                dnsLeakProtection={dnsLeakProtection}
                onToggleDnsLeak={handleToggleDnsLeak}
                onResetPermission={handleResetPermission}
                language={language}
                onChangeLanguage={(lang) => setLanguage(lang)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Minimal Navigation Bar */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 px-4 py-3 border-t backdrop-blur-lg flex justify-around ${
        theme === "dark" 
          ? "bg-slate-950/80 border-slate-900 shadow-2xl shadow-black" 
          : "bg-white/80 border-slate-200 shadow-lg shadow-slate-200"
      }`}>
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors duration-150 ${
            activeTab === "dashboard" 
              ? "text-emerald-400 font-bold" 
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-[10px]">{t.dashboard}</span>
        </button>

        <button
          onClick={() => setActiveTab("servers")}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors duration-150 ${
            activeTab === "servers" 
              ? "text-emerald-400 font-bold" 
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Database size={18} />
          <span className="text-[10px]">{t.serverList}</span>
        </button>

        <button
          onClick={() => setActiveTab("profiles")}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors duration-150 ${
            activeTab === "profiles" 
              ? "text-emerald-400 font-bold" 
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Server size={18} />
          <span className="text-[10px]">{t.profiles}</span>
        </button>

        <button
          onClick={() => setActiveTab("speedtest")}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors duration-150 ${
            activeTab === "speedtest" 
              ? "text-emerald-400 font-bold" 
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Zap size={18} />
          <span className="text-[10px]">{t.speedTest}</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors duration-150 ${
            activeTab === "settings" 
              ? "text-emerald-400 font-bold" 
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <SettingsIcon size={18} />
          <span className="text-[10px]">{t.settings}</span>
        </button>
      </nav>

      {/* Simulated Android VPN Permission Dialog Overlay */}
      <AnimatePresence>
        {showVpnPermission && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className={`w-full max-w-md rounded-[28px] p-6 space-y-4 shadow-2xl border ${
                theme === "dark" 
                  ? "bg-slate-900 border-slate-800 text-slate-100" 
                  : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              {/* Material You Android Dialog Header */}
              <div className="flex items-center gap-3.5 pb-2 border-b border-slate-500/10">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Shield size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-black">{t.permissionRequest}</h3>
                  <p className="text-[10px] text-slate-500">{t.sourceRequest}</p>
                </div>
              </div>

              {/* Warnings and Info */}
              <div className="space-y-3 text-xs leading-relaxed">
                <p>
                  {language === "fa" ? (
                    <>برنامه <strong className="text-emerald-400">VpnG</strong> قصد دارد برای برقراری یک تونل ارتباطی امن و پایدار با پروتکل <strong className="font-mono text-cyan-400 uppercase">{activeProfile.protocol}</strong>، یک اتصال اختصاصی VPN ایجاد کند.</>
                  ) : (
                    <>The application <strong className="text-emerald-400">VpnG</strong> requests permission to establish a secure, stable VPN tunnel using the <strong className="font-mono text-cyan-400 uppercase">{activeProfile.protocol}</strong> protocol.</>
                  )}
                </p>

                <p className="text-slate-400 text-[11px]">
                  {language === "fa" ? (
                    "این عمل به برنامه اجازه می‌دهد ترافیک شبکه را جهت عبور ایمن کدگذاری کند. تأیید این درخواست به معنای اعتماد کامل شما به این کلاینت می‌باشد."
                  ) : (
                    "This action allows the application to encrypt and route your network traffic. Granting this request means you trust this VPN client completely."
                  )}
                </p>

                {/* Specific Config values requested */}
                <div className={`p-3.5 rounded-2xl border font-mono text-[10px] space-y-1 ${
                  theme === "dark" ? "bg-slate-950/60 border-slate-800/80" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Host (IP):</span>
                    <span className="font-bold">{activeProfile.host}:{activeProfile.port}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Auth Method:</span>
                    <span className="font-bold text-amber-400">AuthMethod.{activeProfile.authMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Virtual Hub:</span>
                    <span className="font-bold">{activeProfile.hubName}</span>
                  </div>
                  {activeProfile.username && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Username:</span>
                      <span className="font-bold">{activeProfile.username}</span>
                    </div>
                  )}
                </div>

                <div className={`p-3 rounded-2xl flex items-start gap-2.5 ${
                  theme === "dark" ? "bg-amber-500/5 text-amber-400/90 border border-amber-500/10" : "bg-amber-500/5 text-amber-600 border border-amber-200"
                }`}>
                  <Info size={14} className="flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] leading-normal">
                    {language === "fa" ? (
                      <><strong>تذکر امنیتی:</strong> در حین فعال بودن اتصال VPN، یک نماد کلید کوچک در بخش اعلانات (Status Bar) بالای صفحه گوشی شما نمایش داده خواهد شد.</>
                    ) : (
                      <><strong>Security Notice:</strong> A small key icon will appear in your device's Status Bar while the VPN connection is active.</>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-500/10">
                <button
                  type="button"
                  onClick={handleDeclinePermission}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
                    theme === "dark" 
                      ? "text-slate-400 hover:bg-slate-800" 
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {language === "fa" ? "انصراف" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleAcceptPermission}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-500/10 transition-transform active:scale-[0.98] cursor-pointer"
                >
                  {language === "fa" ? "موافق و برقراری تونل" : "Accept & Connect"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Protocol Selection Bottom Sheet Overlay */}
      <AnimatePresence>
        {showProtocolSelector && serverForProtocolSelector && (
          <ProtocolSelector
            server={serverForProtocolSelector}
            onSelectProtocol={handleSelectProtocol}
            onClose={() => {
              setShowProtocolSelector(false);
              setServerForProtocolSelector(null);
            }}
            theme={theme}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
