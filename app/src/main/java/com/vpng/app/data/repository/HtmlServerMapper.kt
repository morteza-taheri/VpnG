package com.vpng.app.data.repository

import com.vpng.app.data.remote.dto.VpnGateHtmlRow
import com.vpng.app.domain.model.ProtocolEndpoint
import com.vpng.app.domain.model.ServerSource
import com.vpng.app.domain.model.Transport
import com.vpng.app.domain.model.VpnProtocol
import com.vpng.app.domain.model.VpnServer

/**
 * Builds complete [VpnServer] objects directly from HTML rows (spec section
 * 4.1.2) — see [VpnGateHtmlRow] doc for why this no longer tries to merge
 * onto a separately-fetched CSV list (matching by IP across two independent,
 * rotating-snapshot requests silently failed for most servers in practice).
 */
object HtmlServerMapper {

    fun map(row: VpnGateHtmlRow): VpnServer {
        val softEtherEndpoint: ProtocolEndpoint? = row.softEtherTcpPort?.let {
            ProtocolEndpoint(row.ip, it, Transport.TCP)
        }

        val sstpEndpoint: ProtocolEndpoint? = row.sstpHostname?.let {
            ProtocolEndpoint(it, row.sstpPort ?: 443, Transport.TCP)
        }

        val supportedProtocols = buildSet {
            if (softEtherEndpoint != null) add(VpnProtocol.SOFTETHER)
            if (row.openVpnTcpPort != null || row.openVpnUdpPort != null) add(VpnProtocol.OPENVPN)
            if (sstpEndpoint != null) add(VpnProtocol.SSTP)
        }

        return VpnServer(
            hostName = row.hostName,
            ip = row.ip,
            countryCode = "", // not exposed on the HTML page — spec section 4.4 leaves this blank when using HTML as the source
            countryName = row.countryName,
            speedMbps = row.speedMbps,
            ping = row.ping,
            score = row.score,
            numVpnSessions = row.sessions,
            uptime = row.uptime,
            totalUsers = row.totalUsers,
            totalTraffic = "${row.totalTrafficGb} GB",
            logPolicy = row.logPolicy,
            operator = "",
            message = "",
            supportedProtocols = supportedProtocols,
            openVpnConfigBase64 = null, // HTML doesn't expose the config blob itself, only ports
            softEtherEndpoint = softEtherEndpoint,
            softEtherUdpSupported = row.softEtherUdpSupported,
            openVpnTcpPort = row.openVpnTcpPort,
            openVpnUdpPort = row.openVpnUdpPort,
            sstpEndpoint = sstpEndpoint,
            source = ServerSource.HTML
        )
    }
}
