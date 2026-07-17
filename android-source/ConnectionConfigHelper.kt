package com.vpng.client.vpn

import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.util.Base64
import android.util.Log

enum class AuthMethod {
    AUTO,
    PLAIN_PASSWORD,
    ANONYMOUS
}

data class ConnectionConfig(
    val username: String,
    val password: String,
    val authMethod: AuthMethod,
    val serverIp: String,
    val port: Int,
    val hubName: String = "VPN",
    val useTls: Boolean = true
)

object ConnectionConfigHelper {
    private const val TAG = "VpnG_ConfigHelper"

    /**
     * Checks if system VPN permissions are granted.
     * Returns the Intent if permissions are required, or null if already granted.
     */
    fun prepareVpn(context: Context): Intent? {
        return VpnService.prepare(context)
    }

    /**
     * Establishes a TCP connection using SoftEther over HTTPS/TLS.
     * Integrates with the SoftEther-Android-Module syntax.
     */
    fun startSoftEther(context: Context, config: ConnectionConfig) {
        try {
            Log.d(TAG, "Initializing SoftEther TCP (HTTPS/TLS) Tunnel to ${config.serverIp}:${config.port}")
            Log.d(TAG, "Auth Method: ${config.authMethod}, User: ${config.username}")

            // In your real Android project containing the SoftEther-Android-Module:
            // 1. Pass the 'config' to the SoftEther VPN client manager.
            // 2. Start the native background VpnService.
            
            val intent = Intent(context, MyVpnService::class.java).apply {
                action = MyVpnService.ACTION_CONNECT
                putExtra(MyVpnService.EXTRA_SERVER_IP, config.serverIp)
                putExtra(MyVpnService.EXTRA_SERVER_PORT, config.port)
                putExtra("EXTRA_AUTH_METHOD", config.authMethod.name)
                putExtra("EXTRA_USERNAME", config.username)
                putExtra("EXTRA_PASSWORD", config.password)
                putExtra("EXTRA_HUB", config.hubName)
            }
            context.startService(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize SoftEther connection", e)
        }
    }

    /**
     * Helper to launch the real native VPN service with OpenVPN configuration.
     */
    fun startOpenVpn(context: Context, serverIp: String, port: Int, ovpnConfigBase64: String) {
        try {
            val ovpnConfig = if (ovpnConfigBase64.isNotEmpty()) {
                String(Base64.decode(ovpnConfigBase64, Base64.DEFAULT))
            } else {
                ""
            }

            val intent = Intent(context, MyVpnService::class.java).apply {
                action = MyVpnService.ACTION_CONNECT
                putExtra(MyVpnService.EXTRA_SERVER_IP, serverIp)
                putExtra(MyVpnService.EXTRA_SERVER_PORT, port)
                putExtra(MyVpnService.EXTRA_OVPN_CONFIG, ovpnConfig)
            }
            context.startService(intent)
            Log.d(TAG, "Starting VpnService for server $serverIp:$port")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to decode OpenVPN config or start service", e)
        }
    }

    /**
     * Stops the running native VPN service.
     */
    fun stopVpn(context: Context) {
        val intent = Intent(context, MyVpnService::class.java).apply {
            action = MyVpnService.ACTION_DISCONNECT
        }
        context.startService(intent)
    }
}
