package com.vpng.app.vpn.adapter

import com.vpng.app.domain.model.VpnServer

/**
 * Common contract implemented by each protocol-specific adapter
 * (SoftEther, OpenVPN, SSTP). The unified VpnGService (see AndroidManifest
 * and specification section 3.7) delegates to exactly one adapter per
 * active connection, since Android permits only one active VpnService.
 */
interface ProtocolAdapter {
    suspend fun connect(server: VpnServer): AdapterResult
    suspend fun disconnect()
    fun isConnected(): Boolean
}

sealed class AdapterResult {
    data object Connected : AdapterResult()
    data class Failed(val reason: String) : AdapterResult()
}
