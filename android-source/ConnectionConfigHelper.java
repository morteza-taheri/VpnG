package com.vpng.client.vpn;

import android.content.Context;
import android.content.Intent;
import android.net.VpnService;
import android.util.Base64;
import android.util.Log;

public class ConnectionConfigHelper {
    private static final String TAG = "VpnG_ConfigHelper";

    public enum AuthMethod {
        AUTO,
        PLAIN_PASSWORD,
        ANONYMOUS
    }

    public static class ConnectionConfig {
        public final String username;
        public final String password;
        public final AuthMethod authMethod;
        public final String serverIp;
        public final int port;
        public final String hubName;
        public final boolean useTls;

        public ConnectionConfig(String username, String password, AuthMethod authMethod, String serverIp, int port) {
            this(username, password, authMethod, serverIp, port, "VPN", true);
        }

        public ConnectionConfig(String username, String password, AuthMethod authMethod, String serverIp, int port, String hubName, boolean useTls) {
            this.username = username;
            this.password = password;
            this.authMethod = authMethod;
            this.serverIp = serverIp;
            this.port = port;
            this.hubName = hubName;
            this.useTls = useTls;
        }
    }

    /**
     * Checks if system VPN permissions are granted.
     * Returns the Intent if permissions are required, or null if already granted.
     */
    public static Intent prepareVpn(Context context) {
        return VpnService.prepare(context);
    }

    /**
     * Establishes a TCP connection using SoftEther over HTTPS/TLS.
     * Integrates with the SoftEther-Android-Module syntax.
     */
    public static void startSoftEther(Context context, ConnectionConfig config) {
        try {
            Log.d(TAG, "Initializing SoftEther TCP (HTTPS/TLS) Tunnel to " + config.serverIp + ":" + config.port);
            Log.d(TAG, "Auth Method: " + config.authMethod + ", User: " + config.username);

            Intent intent = new Intent(context, MyVpnService.class);
            intent.setAction(MyVpnService.ACTION_CONNECT);
            intent.putExtra(MyVpnService.EXTRA_SERVER_IP, config.serverIp);
            intent.putExtra(MyVpnService.EXTRA_SERVER_PORT, config.port);
            intent.putExtra("EXTRA_AUTH_METHOD", config.authMethod.name());
            intent.putExtra("EXTRA_USERNAME", config.username);
            intent.putExtra("EXTRA_PASSWORD", config.password);
            intent.putExtra("EXTRA_HUB", config.hubName);
            
            context.startService(intent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize SoftEther connection", e);
        }
    }

    /**
     * Helper to launch the real native VPN service with OpenVPN configuration.
     */
    public static void startOpenVpn(Context context, String serverIp, int port, String ovpnConfigBase64) {
        try {
            String ovpnConfig = "";
            if (ovpnConfigBase64 != null && !ovpnConfigBase64.isEmpty()) {
                byte[] decodedBytes = Base64.decode(ovpnConfigBase64, Base64.DEFAULT);
                ovpnConfig = new String(decodedBytes, "UTF-8");
            }

            Intent intent = new Intent(context, MyVpnService.class);
            intent.setAction(MyVpnService.ACTION_CONNECT);
            intent.putExtra(MyVpnService.EXTRA_SERVER_IP, serverIp);
            intent.putExtra(MyVpnService.EXTRA_SERVER_PORT, port);
            intent.putExtra(MyVpnService.EXTRA_OVPN_CONFIG, ovpnConfig);
            
            context.startService(intent);
            Log.d(TAG, "Starting VpnService for server " + serverIp + ":" + port);
        } catch (Exception e) {
            Log.e(TAG, "Failed to decode OpenVPN config or start service", e);
        }
    }

    /**
     * Stops the running native VPN service.
     */
    public static void stopVpn(Context context) {
        Intent intent = new Intent(context, MyVpnService.class);
        intent.setAction(MyVpnService.ACTION_DISCONNECT);
        context.startService(intent);
    }
}
