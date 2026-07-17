import { registerPlugin, Capacitor } from '@capacitor/core';

export interface VpnBridgePlugin {
  checkPermission(): Promise<{ hasPermission: boolean }>;
  requestPermission(): Promise<{ granted: boolean }>;
  startVpn(options: { 
    serverIp: string; 
    port: number; 
    configBase64: string;
    protocol?: string;
    username?: string;
    password?: string;
    hubName?: string;
  }): Promise<{ status: string }>;
  stopVpn(): Promise<{ status: string }>;
}

// Register the custom Capacitor bridge plugin
const VpnBridge = registerPlugin<VpnBridgePlugin>('VpnBridge');

export const isNativeVpnSupported = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const checkNativeVpnPermission = async (): Promise<boolean> => {
  if (!isNativeVpnSupported()) return true;
  try {
    const { hasPermission } = await VpnBridge.checkPermission();
    return hasPermission;
  } catch (err) {
    console.error("Failed to check native VPN permission", err);
    return false;
  }
};

export const requestNativeVpnPermission = async (): Promise<boolean> => {
  if (!isNativeVpnSupported()) return true;
  try {
    const { granted } = await VpnBridge.requestPermission();
    return granted;
  } catch (err) {
    console.error("Failed to request native VPN permission", err);
    return false;
  }
};

export const startNativeVpn = async (
  serverIp: string, 
  port: number, 
  configBase64: string,
  protocol?: string,
  username?: string,
  password?: string,
  hubName?: string
): Promise<string> => {
  if (!isNativeVpnSupported()) return "simulation";
  try {
    const { status } = await VpnBridge.startVpn({ 
      serverIp, 
      port, 
      configBase64,
      protocol,
      username,
      password,
      hubName
    });
    return status;
  } catch (err) {
    console.error("Failed to start native VPN", err);
    throw err;
  }
};

export const stopNativeVpn = async (): Promise<string> => {
  if (!isNativeVpnSupported()) return "simulation";
  try {
    const { status } = await VpnBridge.stopVpn();
    return status;
  } catch (err) {
    console.error("Failed to stop native VPN", err);
    throw err;
  }
};
