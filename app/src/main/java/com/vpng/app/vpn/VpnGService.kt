package com.vpng.app.vpn

import android.content.Intent
import android.net.VpnService
import com.vpng.app.vpn.adapter.ProtocolAdapter

/**
 * Single unified VpnService for the whole app (see specification section 3.7).
 * Delegates actual tunnel setup/teardown to the ProtocolAdapter matching the
 * server's chosen protocol. Do not instantiate additional VpnService
 * subclasses — Android allows only one active per app.
 */
class VpnGService : VpnService() {

    private var activeAdapter: ProtocolAdapter? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // TODO: resolve the ProtocolAdapter for the requested server/protocol
        // and call adapter.connect(server). Kill-switch / always-on VPN
        // guidance lives in specification section 14.
        return START_STICKY
    }

    override fun onDestroy() {
        activeAdapter?.let {
            // Fire-and-forget disconnect on service teardown.
        }
        super.onDestroy()
    }
}
