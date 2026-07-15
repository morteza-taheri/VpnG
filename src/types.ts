export type AuthMethod = "AUTO" | "PLAIN_PASSWORD" | "ANONYMOUS";

export interface VpnServer {
  HostName: string;
  IP: string;
  Score: number;
  Ping: number;
  Speed: number; // in bytes per second
  CountryLong: string;
  CountryShort: string;
  NumVpnConnections: number;
  Operator: string;
  Message: string;
  OpenVPN_ConfigData_Base64: string;
  L2TP_IPsec: "1" | "0" | boolean;
  "MS-SSTP": "1" | "0" | boolean;
  OpenVPN: "1" | "0" | boolean;
  CreatedAt: string;
  isCustom?: boolean; // True if manually added
}

export interface VpnProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  authMethod: AuthMethod;
  hubName: string;
  protocol: "SoftEther" | "L2TP" | "OpenVPN" | "SSTP";
  isActive: boolean;
  isCustom?: boolean;
}

export interface AppFilterItem {
  id: string;
  appName: string;
  packageName: string;
  bypassVpn: boolean;
  category: "Social" | "Browser" | "System" | "Entertainment" | "Tools";
  iconName: string;
}

export interface SpeedTestResult {
  ip: string;
  hostName: string;
  ping: number;
  speedMbps: number;
  stability: number;
  timestamp: string;
}

export interface TrafficDataPoint {
  time: string;
  download: number; // KB/s
  upload: number;   // KB/s
}
