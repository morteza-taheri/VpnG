package com.vpng.app.data.repository

import com.vpng.app.data.remote.dto.VpnGateHtmlRow
import com.vpng.app.domain.model.ProtocolEndpoint
import com.vpng.app.domain.model.Transport
import com.vpng.app.domain.model.VpnProtocol
import com.vpng.app.domain.model.VpnServer

/**
 * Merges HTML-derived protocol truth (spec section 4.1.2/4.3) onto the
 * CSV-derived [VpnServer] list (spec section 4.5, dedup/merge by IP or
 * hostname). HTML is authoritative for *which* protocols a server actually
 * offers — including the important correction that some servers don't offer
 * SoftEther at all, which CSV alone can't reveal (see [VpnGateHtmlRow] doc).
 */
object HtmlServerMapper {

    fun merge(csvServers: List<VpnServer>, htmlRows: List<VpnGateHtmlRow>): List<VpnServer> {
        val htmlByIp = htmlRows.associateBy { it.ip }
        val htmlByHost = htmlRows.associateBy { it.hostName }

        // Only enriches existing CSV entries (which carry score/ping/etc.);
        // HTML-only servers not present in this CSV batch are not added,
        // since we'd have no metrics for them.
        return csvServers.map { server ->
            val htmlRow = htmlByIp[server.ip] ?: htmlByHost[server.hostName]
            if (htmlRow != null) applyHtmlTruth(server, htmlRow) else server
        }
    }

    private fun applyHtmlTruth(server: VpnServer, html: VpnGateHtmlRow): VpnServer {
        val softEtherEndpoint: ProtocolEndpoint? = when {
            html.softEtherTcpPort != null -> ProtocolEndpoint(server.ip, html.softEtherTcpPort, Transport.TCP)
            // html.softEtherUdpSupported == true but no dedicated port is
            // ever published for it (see VpnGateHtmlRow doc) — nothing
            // dialable yet, so no endpoint even though the flag is true.
            else -> null
        }

        val sstpEndpoint: ProtocolEndpoint? = html.sstpHostname?.let {
            ProtocolEndpoint(it, html.sstpPort ?: 443, Transport.TCP)
        }

        val supportedProtocols = buildSet {
            if (softEtherEndpoint != null) add(VpnProtocol.SOFTETHER)
            if (html.openVpnTcpPort != null || html.openVpnUdpPort != null) add(VpnProtocol.OPENVPN)
            if (sstpEndpoint != null) add(VpnProtocol.SSTP)
        }

        return server.copy(
            softEtherEndpoint = softEtherEndpoint,
            softEtherUdpSupported = html.softEtherUdpSupported,
            openVpnTcpPort = html.openVpnTcpPort,
            openVpnUdpPort = html.openVpnUdpPort,
            sstpEndpoint = sstpEndpoint,
            supportedProtocols = supportedProtocols
        )
    }
}
