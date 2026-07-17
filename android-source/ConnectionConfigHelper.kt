package com.vpng.client.vpn

import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.util.Base64
import android.util.Log

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
