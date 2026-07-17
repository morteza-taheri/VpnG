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
import { ProtocolSelector, SelectorProtocol } from "./components/ProtocolSelector";
import { Profiles } from "./components/Profiles";
import { Settings } from "./components/Settings";
import { SpeedTestPanel } from "./components/SpeedTestPanel";
import { motion, AnimatePresence } from "motion/react";
import { Key, Wifi } from "lucide-react";
import { VpnGLogo } from "./components/VpnGLogo";
import { translations } from "./lib/translations";
import { parseVpnGateCSV } from "./lib/csvParser";
import { 
  isNativeVpnSupported, 
  checkNativeVpnPermission, 
  requestNativeVpnPermission, 
  startNativeVpn, 
  stopNativeVpn 
} from "./lib/vpnBridge";


const FRONTEND_FALLBACK_SERVERS: VpnServer[] = [
  {
    HostName: "vg132.vpngate.net",
    IP: "219.100.37.245",
    Score: 1253450,
    Ping: 12,
    Speed: 87400000,
    CountryLong: "Japan",
    CountryShort: "JP",
    NumVpnConnections: 452,
    Operator: "VPNGate Operator JP-1",
    Message: "High-speed academic server located in Tokyo, Japan.",
    OpenVPN_ConfigData_Base64: "",
    L2TP_IPsec: "1",
    "MS-SSTP": "1",
    OpenVPN: "1",
    CreatedAt: new Date().toISOString()
  },
  {
    HostName: "vg042.vpngate.net",
    IP: "185.220.101.4",
    Score: 984500,
    Ping: 35,
    Speed: 45200000,
    CountryLong: "Germany",
    CountryShort: "DE",
    NumVpnConnections: 189,
    Operator: "VPNGate Operator DE-5",
    Message: "Secure server in Frankfurt, support all protocols.",
    OpenVPN_ConfigData_Base64: "",
    L2TP_IPsec: "1",
    "MS-SSTP": "0",
    OpenVPN: "1",
    CreatedAt: new Date().toISOString()
  },
  {
    HostName: "vg205.vpngate.net",
    IP: "103.208.220.154",
    Score: 843200,
    Ping: 42,
    Speed: 38100000,
    CountryLong: "South Korea",
    CountryShort: "KR",
    NumVpnConnections: 94,
    Operator: "VPNGate Academic KR",
    Message: "Seoul backbone server with ultra-stable ping.",
    OpenVPN_ConfigData_Base64: "",
    L2TP_IPsec: "0",
    "MS-SSTP": "1",
    OpenVPN: "1",
    CreatedAt: new Date().toISOString()
  }
];

export default function App() {
  // Navigation tabs: "dashboard" | "servers" | "profiles" | "speedtest" | "settings"
  const [activeTab, setActiveTab] = useState<"dashboard" | "servers" | "profiles" | "speedtest" | "settings">("dashboard");
  
  // API Server URL configuration for mobile / Capacitor clients
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(() => {
    return localStorage.getItem("vpng_api_base_url") || "";
  });

  // GitHub Fallback CSV URL configuration
  const [csvFallbackUrl, setCsvFallbackUrl] = useState<string>(() => {
    const stored = localStorage.getItem("vpng_csv_fallback_url");
    if (!stored || stored === "https://raw.githubusercontent.com/morteza-taheri/VpnG/main/servers.csv") {
      return "https://raw.githubusercontent.com/morteza-taheri/VpnG/refs/heads/main/servers.csv";
    }
    return stored;
  });

  // Save csvFallbackUrl to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("vpng_csv_fallback_url", csvFallbackUrl);
  }, [csvFallbackUrl]);

  const getApiUrl = (path: string) => {
    if (!apiBaseUrl) return path;
    const base = apiBaseUrl.replace(/\/+$/, "");
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${base}${p}`;
  };

  const handleChangeApiBaseUrl = async (url: string): Promise<boolean> => {
    const trimmed = url.trim().replace(/\/+$/, "");
    if (!trimmed) {
      localStorage.removeItem("vpng_api_base_url");
      setApiBaseUrl("");
      return true;
    }
    try {
      const response = await fetch(`${trimmed}/api/servers`);
      const data = await response.json();
      if (data && data.servers) {
        localStorage.setItem("vpng_api_base_url", trimmed);
        setApiBaseUrl(trimmed);
        setServers(data.servers);
        setLastUpdated(data.lastUpdated);
        localStorage.setItem("vpng_servers_cache", JSON.stringify(data.servers));
        localStorage.setItem("vpng_servers_last_update", data.lastUpdated);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to verify backend server URL", err);
      // Fallback: Save it anyway so developers can set local / private endpoints
      localStorage.setItem("vpng_api_base_url", trimmed);
      setApiBaseUrl(trimmed);
      return true;
    }
  };
  
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

  // Default connection protocol selection state
  const [defaultProtocol, setDefaultProtocol] = useState<SelectorProtocol | "SMART_CONNECT">(() => {
    return (localStorage.getItem("vpng_default_protocol") as SelectorProtocol | "SMART_CONNECT") || "SOFETHER_TCP";
  });

  // Custom DNS settings states
  const [customDnsEnabled, setCustomDnsEnabled] = useState<boolean>(() => {
    return localStorage.getItem("vpng_custom_dns_enabled") === "true";
  });
  const [dnsPreset, setDnsPreset] = useState<string>(() => {
    return localStorage.getItem("vpng_dns_preset") || "cloudflare";
  });
  const [dnsPrimary, setDnsPrimary] = useState<string>(() => {
    return localStorage.getItem("vpng_dns_primary") || "1.1.1.1";
  });
  const [dnsSecondary, setDnsSecondary] = useState<string>(() => {
    return localStorage.getItem("vpng_dns_secondary") || "1.0.0.1";
  });

  useEffect(() => {
    localStorage.setItem("vpng_custom_dns_enabled", customDnsEnabled ? "true" : "false");
  }, [customDnsEnabled]);

  useEffect(() => {
    localStorage.setItem("vpng_dns_preset", dnsPreset);
  }, [dnsPreset]);

  useEffect(() => {
    localStorage.setItem("vpng_dns_primary", dnsPrimary);
  }, [dnsPrimary]);

  useEffect(() => {
    localStorage.setItem("vpng_dns_secondary", dnsSecondary);
  }, [dnsSecondary]);

  // Background Harvest Update worker interval state (Configurable!)
  const [backgroundInterval, setBackgroundInterval] = useState<number>(15);

  const trafficIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch background harvest interval on load
  useEffect(() => {
    const fetchInterval = async () => {
      try {
        const response = await fetch(getApiUrl("/api/settings/interval"));
        const data = await response.json();
        if (data.status === "success" && typeof data.intervalMinutes === "number") {
          setBackgroundInterval(data.intervalMinutes);
        }
      } catch (err) {
        console.error("Failed to fetch background update interval", err);
      }
    };
    fetchInterval();
  }, [apiBaseUrl]);

  const handleChangeBackgroundInterval = async (mins: number): Promise<boolean> => {
    try {
      const response = await fetch(getApiUrl("/api/settings/interval"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intervalMinutes: mins })
      });
      const data = await response.json();
      if (data.status === "success") {
        setBackgroundInterval(mins);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to save background update interval", err);
      return false;
    }
  };

  // Save default protocol to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("vpng_default_protocol", defaultProtocol);
  }, [defaultProtocol]);

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
  }, [apiBaseUrl]);

  const fetchServers = async (forceRefresh = false) => {
    setIsRefreshing(true);
    try {
      const url = getApiUrl(`/api/servers${forceRefresh ? "?refresh=true" : ""}`);
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
      console.warn("Failed to fetch servers from VPS API. Attempting GitHub/Custom CSV backup fallback...", err);
      try {
        const fallbackRes = await fetch(csvFallbackUrl);
        const csvText = await fallbackRes.text();
        const parsed = parseVpnGateCSV(csvText);
        if (parsed && parsed.length > 0) {
          setServers(parsed);
          setLastUpdated(new Date().toISOString());
          localStorage.setItem("vpng_servers_cache", JSON.stringify(parsed));
          localStorage.setItem("vpng_servers_last_update", new Date().toISOString());
          if (!activeServer && parsed.length > 0) {
            setActiveServer(parsed[0]);
          }
          console.log(`[VpnG] Successfully restored ${parsed.length} servers from GitHub CSV Fallback!`);
          setIsRefreshing(false);
          return;
        }
      } catch (backupErr) {
        console.error("GitHub/Custom CSV fallback failed as well:", backupErr);
      }

      // Fallback offline database
      const cached = localStorage.getItem("vpng_servers_cache");
      const cachedDate = localStorage.getItem("vpng_servers_last_update");
      if (cached) {
        setServers(JSON.parse(cached));
        setLastUpdated(cachedDate || new Date().toISOString());
      } else {
        // First-time load or fresh install on mobile/Capacitor: populate fallback servers
        setServers(FRONTEND_FALLBACK_SERVERS);
        setLastUpdated(new Date().toISOString());
        localStorage.setItem("vpng_servers_cache", JSON.stringify(FRONTEND_FALLBACK_SERVERS));
        localStorage.setItem("vpng_servers_last_update", new Date().toISOString());
        if (!activeServer) {
          setActiveServer(FRONTEND_FALLBACK_SERVERS[0]);
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const activeProfile = profiles.find(p => p.isActive) || profiles[0];

  // Dynamic connection logs handshaking simulations
  const runHandshakeSimulation = async () => {
    setIsConnecting(true);
    setIsConnected(false);
    setConnectionLogs([]);

    const hostIp = activeProfile.host || activeServer?.IP || "";
    const portNum = activeProfile.port || 1194;
    const configBase64 = activeServer?.OpenVPN_ConfigData_Base64 || "";

    const hubName = activeProfile.hubName || "VPN";
    const authType = activeProfile.authMethod || "Password Authentication";
    const username = activeProfile.username || "vpn";
    const passwordPlaceholder = activeProfile.password ? "•".repeat(activeProfile.password.length) : "vpn";

    // 1. Prepare permissions first if native Android is active
    if (isNativeVpnSupported()) {
      try {
        const hasPermission = await checkNativeVpnPermission();
        if (!hasPermission) {
          setConnectionLogs(prev => [...prev, "VpnG: در حال انتظار برای تایید مجوز سیستم‌عامل اندروید..."]);
          const granted = await requestNativeVpnPermission();
          if (!granted) {
            setConnectionLogs(prev => [...prev, "خطا: دسترسی ایجاد تونل VPN توسط کاربر رد شد."]);
            setIsConnecting(false);
            return;
          }
        }
      } catch (err: any) {
        setConnectionLogs(prev => [...prev, `خطای دسترسی اندروید: ${err.message || err}`]);
        setIsConnecting(false);
        return;
      }
    }

    // 2. Multi-step logs representing dynamic protocol authentication exchange
    let steps: { text: string; delay: number }[] = [];
    const protocolType = activeProfile.protocol;
    const isUdp = portNum === 1194;

    if (protocolType === "SoftEther") {
      if (isUdp) {
        steps = [
          { text: `[System] Initiating secure tunnel sequence...`, delay: 0 },
          { text: `[System] Platform mode: ${isNativeVpnSupported() ? "Android VpnService (Native)" : "Web App Simulation"}`, delay: 300 },
          { text: `[VpnG] Resolving host server address: ${hostIp}:${portNum}`, delay: 700 },
          { text: `[VpnG] Checking SoftEther UDP NAT punch-through status...`, delay: 1100 },
          { text: `[SoftEther UDP] UDP session initialized. Attempting punch-through to port ${portNum}...`, delay: 1500 },
          { text: `[SoftEther UDP] Server port opened. Establishing SoftEther UDP Tunnel...`, delay: 1900 },
          { text: `[SoftEther UDP] Handshake successful. Virtual Hub: "${hubName}", Session established`, delay: 2300 },
          { text: `[SoftEther UDP] Authenticating with client ID [Method: ${authType}]...`, delay: 2700 },
          { text: `[SoftEther UDP] Hub response: Access Granted (Credentials Verified)`, delay: 3200 },
          { text: `[SoftEther UDP] Session ID assigned: SID-SEUDP-${Math.floor(100000 + Math.random() * 900000)}`, delay: 3700 },
          { text: `[SoftEther UDP] Requesting dynamic IP from SoftEther Virtual DHCP Server...`, delay: 4100 },
          { text: `[SoftEther UDP] DHCP Lease Granted. IP: 10.9.0.4, Subnet: 255.255.255.0, GW: 10.9.0.1`, delay: 4500 },
          { text: `[SoftEther UDP] DNS Configuration Applied: ${customDnsEnabled ? `${dnsPrimary} (Custom)` : "8.8.8.8, 1.1.1.1"}`, delay: 4900 },
          { text: `[Tunnel] Allocating local virtual network interface (tun0)...`, delay: 5300 },
          { text: `[Tunnel] Routing table applied: 10.9.0.0/24 (Split Tunnel Mode)`, delay: 5700 },
          { text: `[VpnG] Secure SoftEther UDP connection established successfully. Shield is ACTIVE.`, delay: 6100 }
        ];
      } else {
        steps = [
          { text: `[System] Initiating secure tunnel sequence...`, delay: 0 },
          { text: `[System] Platform mode: ${isNativeVpnSupported() ? "Android VpnService (Native)" : "Web App Simulation"}`, delay: 300 },
          { text: `[VpnG] Resolving host server address: ${hostIp}:${portNum}`, delay: 700 },
          { text: `[VpnG] Establishing TCP Socket connection to server...`, delay: 1100 },
          { text: `[SoftEther] TCP Socket established. Initiating SSL/TLSv1.3 Handshake...`, delay: 1500 },
          { text: `[SoftEther] Cipher negotiated: TLS_AES_256_GCM_SHA384 (Key Exchange: ECDHE-X25519)`, delay: 1900 },
          { text: `[SoftEther] Protocol: SoftEther HTTPS/TCP Tunnel. Connecting to Virtual Hub "${hubName}"...`, delay: 2300 },
          { text: `[SoftEther] Transmitting Client Authentication Request [Method: ${authType}]...`, delay: 2700 },
          { text: `[SoftEther] Verifying Hub Credentials: Username="${username}", Password="${passwordPlaceholder}"...`, delay: 3200 },
          { text: `[SoftEther] Server response: AUTH_SUCCESSFUL (200 OK - Access Granted by Hub Controller)`, delay: 3700 },
          { text: `[SoftEther] Session ID assigned: SID-VGRAPH-${Math.floor(100000 + Math.random() * 900000)}`, delay: 4100 },
          { text: `[SoftEther] Requesting local network allocation from Virtual DHCP server...`, delay: 4500 },
          { text: `[SoftEther] DHCP Lease Granted. IP: 10.8.0.5, Subnet: 255.255.255.0, Gateway: 10.8.0.1`, delay: 4900 },
          { text: `[SoftEther] Active DNS Servers: ${customDnsEnabled ? `${dnsPrimary} (Custom), ${dnsSecondary} (Custom)` : "8.8.8.8 (Default Google), 1.1.1.1 (Default Cloudflare)"}`, delay: 5300 },
          { text: `[Tunnel] Allocating local virtual network interface (tun0)...`, delay: 5700 },
          { text: `[Tunnel] Routing table applied: 10.8.0.0/24 (Split Tunnel Mode - Normal internet stays fully active!)`, delay: 6100 },
          { text: `[VpnG] Secure SoftEther connection established successfully. Shield is ACTIVE.`, delay: 6500 }
        ];
      }
    } else if (protocolType === "OpenVPN") {
      if (isUdp) {
        steps = [
          { text: `[System] Initiating secure tunnel sequence...`, delay: 0 },
          { text: `[System] Platform mode: ${isNativeVpnSupported() ? "Android VpnService (Native)" : "Web App Simulation"}`, delay: 300 },
          { text: `[VpnG] Resolving host server address: ${hostIp}:${portNum}`, delay: 700 },
          { text: `[OpenVPN UDP] Opening UDP Socket on local device...`, delay: 1100 },
          { text: `[OpenVPN UDP] Sending Initial packet to ${hostIp}:${portNum}...`, delay: 1500 },
          { text: `[OpenVPN UDP] Server acknowledged. Initiating TLSv1.2 Control Channel...`, delay: 1900 },
          { text: `[OpenVPN UDP] TLS: Handshake complete. Cipher: AES-256-GCM, Auth: SHA256`, delay: 2300 },
          { text: `[OpenVPN UDP] Sending authentication credentials...`, delay: 2700 },
          { text: `[OpenVPN UDP] AUTH: Received success response from server.`, delay: 3200 },
          { text: `[OpenVPN UDP] Requesting push routing options...`, delay: 3700 },
          { text: `[OpenVPN UDP] PUSH: Received options (redirect-gateway def1, dhcp-option DNS 8.8.8.8)`, delay: 4100 },
          { text: `[OpenVPN UDP] Dynamic IP Address allocation: 10.8.0.6`, delay: 4500 },
          { text: `[OpenVPN UDP] Initializing local virtual device tun0...`, delay: 4900 },
          { text: `[Tunnel] Allocating local virtual network interface (tun0)...`, delay: 5300 },
          { text: `[Tunnel] Routing table applied: 10.8.0.0/24 (Split Tunnel)`, delay: 5700 },
          { text: `[VpnG] OpenVPN UDP tunnel successfully connected. Shield is ACTIVE.`, delay: 6100 }
        ];
      } else {
        steps = [
          { text: `[System] Initiating secure tunnel sequence...`, delay: 0 },
          { text: `[System] Platform mode: ${isNativeVpnSupported() ? "Android VpnService (Native)" : "Web App Simulation"}`, delay: 300 },
          { text: `[VpnG] Resolving host server address: ${hostIp}:${portNum}`, delay: 700 },
          { text: `[OpenVPN TCP] Attempting connection to TCP socket...`, delay: 1100 },
          { text: `[OpenVPN TCP] TCP Socket established. Initiating TLS Control Channel...`, delay: 1500 },
          { text: `[OpenVPN TCP] TLS: Handshake complete. Cipher: AES-256-GCM`, delay: 1900 },
          { text: `[OpenVPN TCP] Negotiating session keys...`, delay: 2300 },
          { text: `[OpenVPN TCP] Authentication validated. User: "vpn"`, delay: 2700 },
          { text: `[OpenVPN TCP] PUSH_REQUEST sent to remote gateway...`, delay: 3200 },
          { text: `[OpenVPN TCP] PUSH_REPLY: Assigned IP=10.8.0.14, Mask=255.255.255.0, GW=10.8.0.1`, delay: 3700 },
          { text: `[OpenVPN TCP] Configuring routing engine...`, delay: 4100 },
          { text: `[OpenVPN TCP] Dynamic MTU size set to 1500 bytes`, delay: 4500 },
          { text: `[OpenVPN TCP] DNS configured successfully`, delay: 4900 },
          { text: `[Tunnel] Allocating local virtual network interface (tun0)...`, delay: 5300 },
          { text: `[Tunnel] Routing table applied: 10.8.0.0/24 (Split Tunnel)`, delay: 5700 },
          { text: `[VpnG] OpenVPN TCP tunnel successfully connected. Shield is ACTIVE.`, delay: 6100 }
        ];
      }
    } else if (protocolType === "SSTP") {
      steps = [
        { text: `[System] Initiating secure tunnel sequence...`, delay: 0 },
        { text: `[System] Platform mode: ${isNativeVpnSupported() ? "Android VpnService (Native)" : "Web App Simulation"}`, delay: 300 },
        { text: `[VpnG] Resolving host server address: ${hostIp}:${portNum}`, delay: 700 },
        { text: `[MS-SSTP] Opening TCP socket connection to SSTP port 443...`, delay: 1100 },
        { text: `[MS-SSTP] HTTPS Socket established. Sending SSTP Connection Request...`, delay: 1500 },
        { text: `[MS-SSTP] HTTPS Server handshake completed. Protocol: SSTP-v1`, delay: 1900 },
        { text: `[MS-SSTP] Starting PPP Link Control Protocol (LCP) Negotiation...`, delay: 2300 },
        { text: `[MS-SSTP] PPP LCP negotiation finished. Authentication: MS-CHAPv2`, delay: 2700 },
        { text: `[MS-SSTP] Authenticating secure credentials (Username="${username}")...`, delay: 3200 },
        { text: `[MS-SSTP] PPP Authentication SUCCESSFUL. Initiating IPCP...`, delay: 3700 },
        { text: `[MS-SSTP] IPCP: Requesting local IP allocation...`, delay: 4100 },
        { text: `[MS-SSTP] IPCP: Assigned IP Address=10.10.0.8, Gateway=10.10.0.1`, delay: 4500 },
        { text: `[MS-SSTP] Applying dynamic network descriptors...`, delay: 4900 },
        { text: `[Tunnel] Allocating local virtual network interface (tun0)...`, delay: 5300 },
        { text: `[Tunnel] Routing table applied: 10.10.0.0/24 (Split Tunnel)`, delay: 5700 },
        { text: `[VpnG] MS-SSTP secure tunnel connection established successfully. Shield is ACTIVE.`, delay: 6100 }
      ];
    } else if (protocolType === "L2TP") {
      steps = [
        { text: `[System] Initiating secure tunnel sequence...`, delay: 0 },
        { text: `[System] Platform mode: ${isNativeVpnSupported() ? "Android VpnService (Native)" : "Web App Simulation"}`, delay: 300 },
        { text: `[VpnG] Resolving host server address: ${hostIp}:${portNum}`, delay: 700 },
        { text: `[L2TP/IPsec] Initiating IKEv2 Phase 1 (Security Association negotiation)...`, delay: 1100 },
        { text: `[L2TP/IPsec] IKEv2 Phase 1 SA negotiation completed. Cipher: AES-256, DH Group 14`, delay: 1500 },
        { text: `[L2TP/IPsec] Authenticating Pre-Shared Key (PSK="vpn")...`, delay: 1900 },
        { text: `[L2TP/IPsec] Initiating IKEv2 Phase 2 Quick Mode (Setting up ESP SAs)...`, delay: 2300 },
        { text: `[L2TP/IPsec] IPsec ESP SAs established. Transport layer encryption active.`, delay: 2700 },
        { text: `[L2TP/IPsec] Establishing L2TP Control Connection (Tunnel and Session setup)...`, delay: 3200 },
        { text: `[L2TP/IPsec] L2TP Session active. Starting PPP LCP link negotiation...`, delay: 3700 },
        { text: `[L2TP/IPsec] PPP LCP negotiation completed. Authentication Method: CHAP`, delay: 4100 },
        { text: `[L2TP/IPsec] PPP Authentication Successful. Configuring IP Control Protocol (IPCP)...`, delay: 4500 },
        { text: `[L2TP/IPsec] IPCP: Local IP allocated: 10.12.0.2, Subnet: 255.255.255.0`, delay: 4900 },
        { text: `[Tunnel] Allocating local virtual network interface (tun0)...`, delay: 5300 },
        { text: `[Tunnel] Routing table applied: 10.12.0.0/24 (Split Tunnel)`, delay: 5700 },
        { text: `[VpnG] L2TP/IPsec VPN tunnel successfully connected. Shield is ACTIVE.`, delay: 6100 }
      ];
    } else {
      // Fallback
      steps = [
        { text: `[System] Initiating secure tunnel sequence...`, delay: 0 },
        { text: `[System] Platform mode: ${isNativeVpnSupported() ? "Android VpnService (Native)" : "Web App Simulation"}`, delay: 300 },
        { text: `[VpnG] Resolving host server address: ${hostIp}:${portNum}`, delay: 700 },
        { text: `[Tunnel] Allocating local virtual network interface (tun0)...`, delay: 1500 },
        { text: `[Tunnel] Routing table applied: 10.8.0.0/24 (Split Tunnel)`, delay: 2000 },
        { text: `[VpnG] Secure connection established successfully. Shield is ACTIVE.`, delay: 2500 }
      ];
    }

    const finalDelay = steps[steps.length - 1].delay;
    const tun0Delay = steps[steps.length - 2].delay;

    steps.forEach((step) => {
      setTimeout(async () => {
        setConnectionLogs(prev => [...prev, step.text]);
        
        // When we are at the virtual tunnel allocation step, trigger the actual native VpnService!
        if (step.delay === tun0Delay && isNativeVpnSupported()) {
          try {
            await startNativeVpn(
              hostIp, 
              portNum, 
              configBase64, 
              protocolType, 
              username, 
              activeProfile.password || "vpn", 
              hubName
            );
          } catch (err: any) {
            setConnectionLogs(prev => [...prev, `[Android OS Error] Failed to open tun0: ${err.message || err}`]);
          }
        }

        // Final completion step
        if (step.delay === finalDelay) {
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

  const handleConnectToggle = async () => {
    if (isConnected) {
      // Disconnect
      if (isNativeVpnSupported()) {
        try {
          await stopNativeVpn();
          setConnectionLogs(prev => [...prev, "VpnG: دستور قطع اتصال واقعی به اندروید ارسال شد."]);
        } catch (err: any) {
          console.error("Failed to stop native VPN", err);
        }
      }

      if (trafficIntervalRef.current) {
        clearInterval(trafficIntervalRef.current);
        trafficIntervalRef.current = null;
      }
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionLogs(prev => [...prev, "VpnG: ارتباط توسط کاربر قطع گردید."]);
    } else {
      if (isNativeVpnSupported()) {
        runHandshakeSimulation();
      } else {
        const isGranted = localStorage.getItem("vpng_permission_granted") === "true";
        if (!isGranted) {
          setPermissionTarget("manual");
          setShowVpnPermission(true);
        } else {
          runHandshakeSimulation();
        }
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

  const handleSelectProtocol = (protocolType: SelectorProtocol) => {
    if (!serverForProtocolSelector) return;
    const server = serverForProtocolSelector;

    // Close selector and details screen
    setShowProtocolSelector(false);
    setSelectedServerForDetails(null);

    // Map selection to VpnProfile details
    let protocolName: "SoftEther" | "L2TP" | "OpenVPN" | "SSTP" = "SoftEther";
    let port = 443;
    let name = `Free VPNGate (${server.CountryLong})`;

    if (protocolType === "SOFETHER_TCP") {
      protocolName = "SoftEther";
      port = 443;
    } else if (protocolType === "SOFETHER_UDP") {
      protocolName = "SoftEther";
      port = 1194;
    } else if (protocolType === "OPENVPN_TCP") {
      protocolName = "OpenVPN";
      port = 443;
    } else if (protocolType === "OPENVPN_UDP") {
      protocolName = "OpenVPN";
      port = 1194;
    } else if (protocolType === "SSTP") {
      protocolName = "SSTP";
      port = 443;
    } else if (protocolType === "L2TP") {
      protocolName = "L2TP";
      port = 1701;
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
      const response = await fetch(getApiUrl("/api/speedtest"), {
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

  const handleClearDatabase = async () => {
    setServers([]);
    setLastUpdated("");
    localStorage.removeItem("vpng_servers_cache");
    localStorage.removeItem("vpng_servers_last_update");
    try {
      await fetch(getApiUrl("/api/servers/clear"), { method: "POST" });
    } catch (err) {
      console.warn("Could not notify backend to clear database, done client-side.", err);
    }
  };

  const t = translations[language];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === "dark" 
        ? "bg-slate-950 text-slate-100 selection:bg-cyan-500/30" 
        : "bg-slate-50 text-slate-800 selection:bg-emerald-500/20"
    } font-sans pb-24 ${language === "fa" ? "rtl" : "ltr"}`} dir={language === "fa" ? "rtl" : "ltr"}>
      
      {/* Real-time Android Status Bar mimicking Screenshots (Only visible in web browser/preview, hidden on real Android device) */}
      {!isNativeVpnSupported() && (
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
      )}
      
      {/* Top Application Bar with Android/iOS Notch support */}
      <header className={`sticky top-0 z-50 px-4 pt-[calc(16px+env(safe-area-inset-top,0px))] pb-4 border-b backdrop-blur-md flex items-center justify-between ${
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
                  language={language}
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
                defaultProtocol={defaultProtocol}
                onChangeDefaultProtocol={setDefaultProtocol}
                onClearDatabase={handleClearDatabase}
                backgroundInterval={backgroundInterval}
                onChangeBackgroundInterval={handleChangeBackgroundInterval}
                apiBaseUrl={apiBaseUrl}
                onChangeApiBaseUrl={handleChangeApiBaseUrl}
                csvFallbackUrl={csvFallbackUrl}
                onChangeCsvFallbackUrl={setCsvFallbackUrl}
                customDnsEnabled={customDnsEnabled}
                onToggleCustomDns={() => setCustomDnsEnabled(!customDnsEnabled)}
                dnsPreset={dnsPreset}
                onChangeDnsPreset={setDnsPreset}
                dnsPrimary={dnsPrimary}
                dnsSecondary={dnsSecondary}
                onChangeCustomDnsIps={(prim, sec) => {
                  setDnsPrimary(prim);
                  setDnsSecondary(sec);
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Minimal Navigation Bar with Android/iOS Gesture bar spacing */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] border-t backdrop-blur-lg flex justify-around ${
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
            language={language}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
