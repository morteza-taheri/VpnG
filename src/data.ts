import { AppFilterItem, VpnProfile } from "./types";

export const INITIAL_PROFILES: VpnProfile[] = [
  {
    id: "vpngate_auto",
    name: "Free VPNGate (Auto-Detect)",
    host: "vpn21910037.vpngate.net",
    port: 443,
    username: "vpn",
    password: "vpn",
    authMethod: "AUTO",
    hubName: "VPN",
    protocol: "SoftEther",
    isActive: true,
    isCustom: false
  },
  {
    id: "paid_radius",
    name: "Paid Server (RADIUS Auth)",
    host: "radius-us.vpnsecure.net",
    port: 1194,
    username: "morteza_premium",
    password: "secretpassword123",
    authMethod: "PLAIN_PASSWORD",
    hubName: "SecureHub",
    protocol: "OpenVPN",
    isActive: false,
    isCustom: true
  },
  {
    id: "anonymous_hub",
    name: "Anonymous Academic Hub",
    host: "gate-kr.academic.ad.jp",
    port: 992,
    username: "",
    password: "",
    authMethod: "ANONYMOUS",
    hubName: "DEFAULT",
    protocol: "SoftEther",
    isActive: false,
    isCustom: false
  },
  {
    id: "sstp_office",
    name: "Corporate SSTP Gateway",
    host: "sstp.mycompany.org",
    port: 443,
    username: "employee_392",
    password: "sstp_pass_token",
    authMethod: "PLAIN_PASSWORD",
    hubName: "SSTP_BRIDGE",
    protocol: "SSTP",
    isActive: false,
    isCustom: true
  }
];

export const INITIAL_APP_FILTERS: AppFilterItem[] = [
  {
    id: "app_1",
    appName: "Telegram",
    packageName: "org.telegram.messenger",
    bypassVpn: false,
    category: "Social",
    iconName: "MessageCircle"
  },
  {
    id: "app_2",
    appName: "WhatsApp",
    packageName: "com.whatsapp",
    bypassVpn: false,
    category: "Social",
    iconName: "Phone"
  },
  {
    id: "app_3",
    appName: "Chrome Browser",
    packageName: "com.android.chrome",
    bypassVpn: false,
    category: "Browser",
    iconName: "Globe"
  },
  {
    id: "app_4",
    appName: "YouTube",
    packageName: "com.google.android.youtube",
    bypassVpn: false,
    category: "Entertainment",
    iconName: "Youtube"
  },
  {
    id: "app_5",
    appName: "Instagram",
    packageName: "com.instagram.android",
    bypassVpn: true,
    category: "Social",
    iconName: "Instagram"
  },
  {
    id: "app_6",
    appName: "Gmail",
    packageName: "com.google.android.gm",
    bypassVpn: true,
    category: "Tools",
    iconName: "Mail"
  },
  {
    id: "app_7",
    appName: "Spotify",
    packageName: "com.spotify.music",
    bypassVpn: false,
    category: "Entertainment",
    iconName: "Music"
  },
  {
    id: "app_8",
    appName: "Google Maps",
    packageName: "com.google.android.apps.maps",
    bypassVpn: true,
    category: "Tools",
    iconName: "MapPin"
  },
  {
    id: "app_9",
    appName: "Pinterest",
    packageName: "com.pinterest",
    bypassVpn: true,
    category: "Entertainment",
    iconName: "Image"
  },
  {
    id: "app_10",
    appName: "Twitter / X",
    packageName: "com.twitter.android",
    bypassVpn: false,
    category: "Social",
    iconName: "Twitter"
  }
];
