package com.vpng.app.vpn.adapter

import android.content.Context
import android.content.Intent
import com.vpng.app.domain.model.VpnServer
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import vn.unlimit.softether.SoftEtherVpnService
import vn.unlimit.softether.model.AuthMethod
import vn.unlimit.softether.model.ConnectionConfig

/**
 * Adapts VpnG's [ProtocolAdapter] contract onto SoftEtherClient's own,
 * already-complete [SoftEtherVpnService] (own foreground notification,
 * reconnect logic, DHCP, etc. — see :SoftEtherClient module).
 *
 * We do NOT re-run this connection through our own VpnGService: the module
 * already declares SoftEtherVpnService in its own manifest (merged into
 * ours), so we just start/stop it via Intent and listen for state via its
 * static listener API.
 *
 * VPN consent (VpnService.prepare()) must be requested from an Activity
 * *before* calling [connect] — see [hasVpnPermission] / callers should launch
 * the Intent returned by `android.net.VpnService.prepare(context)` if this
 * returns false.
 */
class SoftEtherProtocolAdapter(
    private val context: Context,
    private val credentials: SoftEtherCredentials
) : ProtocolAdapter {

    fun hasVpnPermission(): Boolean =
        android.net.VpnService.prepare(context) == null

    override suspend fun connect(server: VpnServer): AdapterResult {
        if (!hasVpnPermission()) {
            return AdapterResult.Failed("VPN permission not granted — call android.net.VpnService.prepare() from an Activity first")
        }

        val endpoint = server.softEtherEndpoint
            ?: return AdapterResult.Failed("Server has no SoftEther endpoint info")

        val config = ConnectionConfig(
            serverHost = endpoint.host,
            serverPort = endpoint.port,
            username = credentials.username,
            password = credentials.password,
            // VPN Gate's public relay servers all expose their VPN Gate
            // extension on a Virtual Hub literally named "VPNGATE" (fixed,
            // documented by the SoftEther project — every public relay uses
            // this same hub name regardless of server). Do not confuse this
            // with a generic "VPN" hub name, which does not exist on these
            // servers and will fail to connect.
            virtualHub = "VPNGATE",
            sessionName = server.hostName,
            country = server.countryName,
            authMethod = AuthMethod.AUTO
        )

        val result = CompletableDeferred<AdapterResult>()
        val listener = object : SoftEtherVpnService.StateListener {
            override fun onSoftEtherStateChanged(state: String, assignedIp: String) {
                when (state) {
                    SoftEtherVpnService.STATE_CONNECTED -> result.complete(AdapterResult.Connected)
                    SoftEtherVpnService.STATE_ERROR,
                    SoftEtherVpnService.STATE_DISCONNECTED -> result.complete(
                        AdapterResult.Failed("SoftEther connection failed (state=$state)")
                    )
                    // Intermediate states (CONNECTING, TLS_HANDSHAKE, etc.) — keep waiting.
                }
            }
        }
        SoftEtherVpnService.addStateListener(listener)

        try {
            val intent = Intent(context, SoftEtherVpnService::class.java).apply {
                action = SoftEtherVpnService.ACTION_CONNECT
                putExtra(SoftEtherVpnService.EXTRA_CONFIG, config)
            }
            context.startForegroundService(intent)
            return result.await()
        } finally {
            SoftEtherVpnService.removeStateListener(listener)
        }
    }

    override suspend fun disconnect() {
        val intent = Intent(context, SoftEtherVpnService::class.java).apply {
            action = SoftEtherVpnService.ACTION_DISCONNECT
        }
        context.startForegroundService(intent)
    }

    override fun isConnected(): Boolean =
        SoftEtherVpnService.currentState == SoftEtherVpnService.STATE_CONNECTED

    /** Cold flow of connection state changes, for UI observation. */
    fun observeState(): Flow<String> = callbackFlow {
        val listener = object : SoftEtherVpnService.StateListener {
            override fun onSoftEtherStateChanged(state: String, assignedIp: String) {
                trySend(state)
            }
        }
        SoftEtherVpnService.addStateListener(listener)
        awaitClose { SoftEtherVpnService.removeStateListener(listener) }
    }
}

/**
 * VPN Gate's public servers use fixed anonymous-style credentials
 * (see specification section on SoftEther authentication methods).
 */
data class SoftEtherCredentials(
    val username: String = "vpn",
    val password: String = "vpn"
)
