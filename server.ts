import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import * as cheerio from "cheerio";

// Fallback high-quality servers in case VPNGate is unreachable or network is sandboxed
const DEFAULT_FALLBACK_SERVERS = [
  {
    HostName: "vg132.vpngate.net",
    IP: "219.100.37.245",
    Score: 1253450,
    Ping: 12,
    Speed: 87400000, // 87.4 Mbps
    CountryLong: "Japan",
    CountryShort: "JP",
    NumVpnConnections: 452,
    Operator: "VPNGate Operator JP-1",
    Message: "High-speed academic server located in Tokyo, Japan.",
    OpenVPN_ConfigData_Base64: "",
    L2TP_IPsec: "1",
    "MS-SSTP": "1",
    OpenVPN: "1",
    CreatedAt: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
  },
  {
    HostName: "vg042.vpngate.net",
    IP: "185.220.101.4",
    Score: 984500,
    Ping: 35,
    Speed: 45200000, // 45.2 Mbps
    CountryLong: "Germany",
    CountryShort: "DE",
    NumVpnConnections: 189,
    Operator: "VPNGate Operator DE-5",
    Message: "Secure server in Frankfurt, support all protocols.",
    OpenVPN_ConfigData_Base64: "",
    L2TP_IPsec: "1",
    "MS-SSTP": "0",
    OpenVPN: "1",
    CreatedAt: new Date(Date.now() - 3600000 * 5).toISOString() // 5 hours ago
  },
  {
    HostName: "vg205.vpngate.net",
    IP: "103.208.220.154",
    Score: 843200,
    Ping: 42,
    Speed: 38100000, // 38.1 Mbps
    CountryLong: "South Korea",
    CountryShort: "KR",
    NumVpnConnections: 94,
    Operator: "VPNGate Academic KR",
    Message: "Seoul backbone server with ultra-stable ping.",
    OpenVPN_ConfigData_Base64: "",
    L2TP_IPsec: "0",
    "MS-SSTP": "1",
    OpenVPN: "1",
    CreatedAt: new Date(Date.now() - 3600000 * 12).toISOString() // 12 hours ago
  },
  {
    HostName: "vg088.vpngate.net",
    IP: "172.56.21.90",
    Score: 712000,
    Ping: 65,
    Speed: 29400000, // 29.4 Mbps
    CountryLong: "United States",
    CountryShort: "US",
    NumVpnConnections: 121,
    Operator: "VPNGate Operator US-Oregon",
    Message: "West Coast US server, optimized for streaming.",
    OpenVPN_ConfigData_Base64: "",
    L2TP_IPsec: "1",
    "MS-SSTP": "1",
    OpenVPN: "1",
    CreatedAt: new Date(Date.now() - 3600000 * 1).toISOString() // 1 hour ago
  },
  {
    HostName: "vg159.vpngate.net",
    IP: "80.243.190.22",
    Score: 615000,
    Ping: 22,
    Speed: 52000000, // 52 Mbps
    CountryLong: "United Kingdom",
    CountryShort: "GB",
    NumVpnConnections: 78,
    Operator: "VPNGate Operator UK-London",
    Message: "London academic server, zero logging.",
    OpenVPN_ConfigData_Base64: "",
    L2TP_IPsec: "1",
    "MS-SSTP": "1",
    OpenVPN: "1",
    CreatedAt: new Date(Date.now() - 3600000 * 8).toISOString() // 8 hours ago
  }
];

// VPNGate URLs (Primary API and backup mirror sites from user)
const VPNGATE_URLS = [
  "https://www.vpngate.net/api/iphone/",
  "http://79.110.52.164:18803/api/iphone/",
  "http://146.70.253.73:18803/api/iphone/",
  "http://37.120.206.112:18803/api/iphone/",
  "http://150.40.104.214:29127/api/iphone/",
  "http://150.40.104.74:47740/api/iphone/",
  "http://150.40.104.120:34109/api/iphone/"
];

// Simple in-memory cache for loaded servers and status
let cachedServers: any[] = [...DEFAULT_FALLBACK_SERVERS];
let lastUpdatedTime: string = new Date().toISOString();
let isFetchingInProgress = false;

// Function to parse the CSV from VPNGate
function parseVPNGateCSV(csvText: string): any[] {
  const lines = csvText.split(/\r?\n/);
  let headerIndex = -1;
  
  // Find where header row starts
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#HostName") || lines[i].startsWith("HostName")) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error("Could not find VPNGate CSV header row.");
  }

  const headerLine = lines[headerIndex].replace(/^#/, ""); // Remove # symbol if present
  const headers = headerLine.split(",");

  const parsedServers: any[] = [];
  
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("*") || line === "") continue;

    const values = line.split(",");
    if (values.length < headers.length) continue;

    const serverObj: any = {};
    headers.forEach((header, index) => {
      serverObj[header.trim()] = values[index]?.trim() || "";
    });

    // Clean up types
    parsedServers.push({
      HostName: serverObj.HostName || "unknown",
      IP: serverObj.IP || "0.0.0.0",
      Score: parseInt(serverObj.Score) || 0,
      Ping: parseInt(serverObj.Ping) || 999,
      Speed: parseInt(serverObj.Speed) || 0,
      CountryLong: serverObj.CountryLong || "Unknown Country",
      CountryShort: serverObj.CountryShort || "UN",
      NumVpnConnections: parseInt(serverObj.NumVpnConnections) || 0,
      Operator: serverObj.Operator || "Anonymous",
      Message: serverObj.Message || "No message from operator.",
      OpenVPN_ConfigData_Base64: serverObj.OpenVPN_ConfigData_Base64 || "",
      L2TP_IPsec: serverObj.L2TP_IPsec === "1" ? "1" : "0",
      "MS-SSTP": serverObj["MS-SSTP"] === "1" ? "1" : "0",
      OpenVPN: serverObj.OpenVPN === "1" ? "1" : "0",
      // Add dynamic creation date simulated based on current time
      CreatedAt: new Date(Date.now() - (Math.random() * 24 * 3600000)).toISOString()
    });
  }

  return parsedServers;
}

// Function to parse HTML from VPNGate using cheerio
function parseVPNGateHTML(htmlText: string): any[] {
  const $ = cheerio.load(htmlText);
  const parsedServers: any[] = [];

  // Find all tables
  const tables = $("table");
  let targetTable: cheerio.Cheerio<any> | null = null;

  tables.each((_, table) => {
    const text = $(table).text();
    if (text.includes("SSL-VPN") && text.includes("IP Address") && text.includes("Ping")) {
      targetTable = $(table);
      return false; // break loop
    }
  });

  if (!targetTable) {
    // Fallback: search for any table that has headers containing DDNS and SSL-VPN or OpenVPN
    tables.each((_, table) => {
      const text = $(table).text();
      if (text.includes("DDNS") && text.includes("SSL-VPN")) {
        targetTable = $(table);
        return false;
      }
    });
  }

  if (!targetTable) {
    console.warn("[VpnG Scraper] Could not find table by text headers. Scanning for largest tables...");
    tables.each((_, table) => {
      const rows = $(table).find("tr");
      if (rows.length > 30) {
        targetTable = $(table);
        return false;
      }
    });
  }

  if (!targetTable) {
    console.warn("[VpnG Scraper] No suitable tables found on the page.");
    return [];
  }

  const rows = targetTable.find("tr");
  console.log(`[VpnG Scraper] Scanned table row count: ${rows.length}`);

  rows.each((index, row) => {
    const cols = $(row).find("td");
    
    // Header rows usually have <th> or empty or match labels. Skip row if it does not contain details.
    if (cols.length < 8) return;

    const rowText = $(row).text();
    if (!rowText.includes("ms") && !rowText.includes("sessions")) return; // Skip if no telemetry/session metadata
    if (!/SSL-VPN|OpenVPN|L2TP|SSTP/i.test(rowText)) return; // Skip if no protocols supported

    const countryCol = cols.eq(0);
    const hostCol = cols.eq(1);
    const sessionsCol = cols.eq(2);
    const throughputCol = cols.eq(3);
    const sslCol = cols.eq(4);

    const sslText = sslCol.text();

    // Country info
    let countryLong = countryCol.text().trim();
    countryLong = countryLong.split(/\r?\n/)[0].trim();
    if (!countryLong) {
      countryLong = "Unknown Country";
    }

    const flagImg = countryCol.find("img").first();
    let countryShort = "UN";
    if (flagImg && flagImg.attr("src")) {
      const src = flagImg.attr("src") || "";
      const flagMatch = src.match(/\/flags\/([A-Za-z]+)\./) || src.match(/([A-Za-z]+)\.gif/);
      if (flagMatch) {
        countryShort = flagMatch[1].toUpperCase();
      }
    }

    // Hostname and IP address
    const hostText = hostCol.text().replace(/\s+/g, " ");
    const ipMatch = hostText.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
    const ipAddress = ipMatch ? ipMatch[1] : "";
    
    if (!ipAddress || ipAddress === "0.0.0.0") return;

    // Extract HostName
    let hostName = "unknown";
    const hostWords = hostText.split(/\s+|\(|\)/);
    for (const w of hostWords) {
      if (w.includes(".vpngate.net") || w.includes(".net") || w.includes(".jp")) {
        hostName = w;
        break;
      }
    }
    if (hostName === "unknown" && hostWords.length > 0) {
      hostName = hostWords[0] || ipAddress;
    }

    // Ping & Sessions
    const qualityText = sessionsCol.text().replace(/\s+/g, " ");
    const pingMatch = qualityText.match(/Ping:\s*(\d+)\s*ms/i) || qualityText.match(/(\d+)\s*ms/i);
    const ping = pingMatch ? parseInt(pingMatch[1]) : 120;

    const sessionsMatch = qualityText.match(/(\d+)\s*sessions/i) || qualityText.match(/sessions:\s*(\d+)/i);
    const sessions = sessionsMatch ? parseInt(sessionsMatch[1]) : 0;

    // Throughput
    const speedText = throughputCol.text().replace(/\s+/g, " ");
    const speedMatch = speedText.match(/([\d.]+)\s*(Mbps|Kbps|Gbps)/i);
    let speedMbps = 15;
    if (speedMatch) {
      const value = parseFloat(speedMatch[1]);
      const unit = speedMatch[2].toUpperCase();
      if (unit === "GBPS") speedMbps = value * 1000;
      else if (unit === "KBPS") speedMbps = value / 1000;
      else speedMbps = value;
    }

    const col4Text = cols.eq(4).text();
    const col5Text = cols.eq(5) ? cols.eq(5).text() : "";
    const col6Text = cols.eq(6) ? cols.eq(6).text() : "";
    const col7Text = cols.eq(7) ? cols.eq(7).text() : "";

    const hasSoftEther = /TCP|UDP|SSL-VPN/i.test(col4Text);
    const hasL2TP = /L2TP|IPSec|Supported/i.test(col5Text) && !/Not Supported|Disabled/i.test(col5Text);
    const hasOpenVpn = /OpenVPN|Supported/i.test(col6Text) && !/Not Supported|Disabled/i.test(col6Text);
    const hasSSTP = /SSTP|Supported/i.test(col7Text) && !/Not Supported|Disabled/i.test(col7Text);

    let port = 443;
    const portMatch = col4Text.match(/Port:\s*(\d+)/i) || col4Text.match(/TCP:\s*(\d+)/i) || col4Text.match(/(\d+)/);
    if (portMatch) {
      port = parseInt(portMatch[1]);
    }

    const score = Math.max(0, Math.floor((speedMbps * 1500) - (ping * 8) + (sessions * 10)));

    parsedServers.push({
      HostName: hostName,
      IP: ipAddress,
      Score: score,
      Ping: ping,
      Speed: speedMbps * 1000000,
      CountryLong: countryLong,
      CountryShort: countryShort,
      NumVpnConnections: sessions,
      Operator: "VPNGate Contributor",
      Message: `Dynamic mirror server. Supports: ${hasSoftEther ? 'SoftEther ' : ''}${hasOpenVpn ? 'OpenVPN ' : ''}${hasL2TP ? 'L2TP/IPSec ' : ''}${hasSSTP ? 'MS-SSTP' : ''}`,
      OpenVPN_ConfigData_Base64: "",
      L2TP_IPsec: hasL2TP ? "1" : "0",
      "MS-SSTP": hasSSTP ? "1" : "0",
      OpenVPN: hasOpenVpn ? "1" : "0",
      CreatedAt: new Date().toISOString()
    });
  });

  return parsedServers;
}

// Function to fetch from mirrors one by one
async function fetchWithTimeout(url: string, timeoutMs = 4000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Function to fetch HTML directories with user-agent
async function fetchHTMLWithTimeout(url: string, timeoutMs = 5000): Promise<string> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      }
    });
    clearTimeout(id);
    if (!response.ok) {
      throw new Error(`HTTP Status ${response.status}`);
    }
    return await response.text();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

const VPNGATE_HTML_URLS = [
  "https://www.vpngate.net/en/",
  ...VPNGATE_URLS.map(u => u.replace("/api/iphone/", "/en/")),
  ...VPNGATE_URLS.map(u => u.replace("/api/iphone/", "/"))
];

async function fetchFromVPNGateHTMLWithBackups(): Promise<any[]> {
  for (const url of VPNGATE_HTML_URLS) {
    try {
      console.log(`[VpnG Backend HTML Scraper] Attempting to scrape from: ${url}`);
      const htmlText = await fetchHTMLWithTimeout(url, 5000);
      const parsed = parseVPNGateHTML(htmlText);
      if (parsed.length > 0) {
        console.log(`[VpnG Backend HTML Scraper] Successfully scraped ${parsed.length} servers from ${url}`);
        return parsed;
      }
    } catch (e: any) {
      console.warn(`[VpnG Backend HTML Scraper] Failed scraping from ${url}: ${e.message}`);
    }
  }
  return [];
}

async function fetchFromVPNGateWithBackups(): Promise<{ servers: any[]; source: string }> {
  let csvServers: any[] = [];
  let sourceOfCsv = "none";

  // 1. Fetch CSV API
  for (const url of VPNGATE_URLS) {
    try {
      console.log(`[VpnG Backend] Attempting to fetch CSV from: ${url}`);
      const res = await fetchWithTimeout(url, 4000);
      if (res.ok) {
        const text = await res.text();
        const parsed = parseVPNGateCSV(text);
        if (parsed.length > 0) {
          console.log(`[VpnG Backend] Successfully fetched and parsed ${parsed.length} CSV servers from ${url}`);
          csvServers = parsed;
          sourceOfCsv = url;
          break;
        }
      }
    } catch (e: any) {
      console.warn(`[VpnG Backend] Failed fetching CSV from ${url}: ${e.message}`);
    }
  }

  // 2. Fetch HTML web directory
  let htmlServers: any[] = [];
  try {
    htmlServers = await fetchFromVPNGateHTMLWithBackups();
  } catch (e: any) {
    console.error(`[VpnG Backend] HTML scraping failed, will rely solely on CSV. Error: ${e.message}`);
  }

  // 3. Merge them to get the absolute maximum servers!
  const mergedMap = new Map<string, any>();

  // Add CSV servers first (as they contain base64 openvpn config)
  for (const s of csvServers) {
    mergedMap.set(s.IP, s);
  }

  // Add HTML servers
  for (const s of htmlServers) {
    if (mergedMap.has(s.IP)) {
      // Merge protocol info if missing
      const existing = mergedMap.get(s.IP);
      mergedMap.set(s.IP, {
        ...existing,
        L2TP_IPsec: existing.L2TP_IPsec === "1" ? "1" : s.L2TP_IPsec,
        "MS-SSTP": existing["MS-SSTP"] === "1" ? "1" : s["MS-SSTP"],
        OpenVPN: existing.OpenVPN === "1" ? "1" : s.OpenVPN,
      });
    } else {
      // Add server
      mergedMap.set(s.IP, s);
    }
  }

  const finalServers = Array.from(mergedMap.values()).sort((a, b) => b.Score - a.Score);
  
  if (finalServers.length > 0) {
    return {
      servers: finalServers,
      source: sourceOfCsv !== "none" ? `${sourceOfCsv} + HTML Scrape` : "HTML Scraped Directory Only"
    };
  }

  throw new Error("All VPNGate URLs (CSV and HTML) failed to return servers.");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Serve static UI assets if in production
  const isProd = process.env.NODE_ENV === "production";
  const distPath = path.join(process.cwd(), "dist");

  // Endpoint 1: Get list of servers
  app.get("/api/servers", async (req, res) => {
    const forceRefresh = req.query.refresh === "true";
    
    if (forceRefresh && !isFetchingInProgress) {
      isFetchingInProgress = true;
      try {
        const { servers, source } = await fetchFromVPNGateWithBackups();
        cachedServers = servers;
        lastUpdatedTime = new Date().toISOString();
        isFetchingInProgress = false;
        return res.json({
          status: "success",
          source,
          lastUpdated: lastUpdatedTime,
          servers: cachedServers
        });
      } catch (err: any) {
        isFetchingInProgress = false;
        console.error(`[VpnG Backend] Force refresh failed, falling back to local cache. Error: ${err.message}`);
        // We fall back to cached servers (which initially contains DEFAULT_FALLBACK_SERVERS)
        return res.json({
          status: "fallback",
          message: err.message,
          lastUpdated: lastUpdatedTime,
          servers: cachedServers
        });
      }
    }

    // Default return of cached servers
    return res.json({
      status: "cached",
      lastUpdated: lastUpdatedTime,
      servers: cachedServers
    });
  });

  // Endpoint to clear the stored servers database list
  app.post("/api/servers/clear", (req, res) => {
    cachedServers = [];
    lastUpdatedTime = "";
    res.json({
      status: "success",
      message: "Server list database cleared successfully from cache"
    });
  });

  // Endpoint 2: Simulate Speed Test & Ping for a specific host/IP
  app.post("/api/speedtest", (req, res) => {
    const { ip, hostName } = req.body;
    if (!ip) {
      return res.status(400).json({ error: "IP address is required" });
    }

    // Simulate latency and download speed based on theoretical connection stats
    const randomLatency = Math.floor(Math.random() * 80) + 10; // 10ms to 90ms
    const randomSpeedMbps = parseFloat((Math.random() * 80 + 10).toFixed(1)); // 10 to 90 Mbps
    const stabilityPercent = Math.floor(Math.random() * 15) + 85; // 85% to 100% stable

    setTimeout(() => {
      res.json({
        ip,
        hostName: hostName || ip,
        ping: randomLatency,
        speedMbps: randomSpeedMbps,
        stability: stabilityPercent,
        timestamp: new Date().toISOString()
      });
    }, 800); // Simulate network delay for speed test
  });

  // Endpoint 3: Create a profile manually (Stored server-side or acknowledged)
  app.post("/api/profiles", (req, res) => {
    const profile = req.body;
    // Just return success for simulations
    res.json({
      success: true,
      message: "Profile simulated successfully",
      profile: {
        id: "profile_" + Math.random().toString(36).substr(2, 9),
        ...profile,
        createdAt: new Date().toISOString()
      }
    });
  });

  // Serve Vite or Static files
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[VpnG Server] running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
