package com.vpng.app.vpn.adapter

import com.vpng.app.domain.model.VpnServer

/**
 * Common contract implemented by each protocol-specific adapter
 * (SoftEther, OpenVPN, SSTP).
 *
 * Revised from the original single-VpnGService plan (spec section 3.7):
 * Android's real restriction is one *active* VPN interface at a time, not
 * one VpnService subclass per app — multiple VpnService subclasses may be
 * declared, and calling Builder.establish() on a new one simply tears down
 * whichever was previously active. SoftEtherClient ships its own complete
 * VpnService (SoftEtherVpnService); [SoftEtherProtocolAdapter] wraps that
 * directly rather than re-implementing tunnel management ourselves. Phase 2
 * (OpenVPN/SSTP) should follow the same per-protocol-service pattern unless
 * a concrete need for a single dispatcher service turns up.
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
