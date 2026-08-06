package com.vpng.app.data.repository

import android.util.Base64
import com.vpng.app.data.remote.dto.VpnGateCsvRow
import com.vpng.app.domain.model.ProtocolEndpoint
import com.vpng.app.domain.model.ServerSource
import com.vpng.app.domain.model.Transport
import com.vpng.app.domain.model.VpnProtocol
import com.vpng.app.domain.model.VpnServer

/**
 * Maps raw CSV rows (spec section 4.2) onto the unified [VpnServer] model
 * (spec section 4.4).
 */
object CsvServerMapper {

    // Matches an OpenVPN client config line like: "remote 1.2.3.4 443"
    private val REMOTE_LINE_REGEX = Regex("""^remote\s+(\S+)\s+(\d+)""", RegexOption.MULTILINE)

    // VPN Gate's public relays commonly expose the raw SoftEther protocol on
    // this port when no more specific value can be extracted from the CSV.
    private const val DEFAULT_SOFTETHER_PORT = 443

    fun map(row: VpnGateCsvRow, source: ServerSource): VpnServer {
        val decodedConfig = decodeOpenVpnConfig(row.openVpnConfigBase64)
        val softEtherEndpoint = extractSoftEtherEndpoint(row, decodedConfig)

        return VpnServer(
            hostName = row.hostName,
            ip = row.ip,
            countryCode = row.countryShort,
            countryName = row.countryLong,
            speedMbps = row.speedBps / 1_000_000.0,
            ping = row.ping,
            score = row.score,
            numVpnSessions = row.numVpnSessions,
            uptime = row.uptime,
            totalUsers = row.totalUsers,
            totalTraffic = row.totalTraffic,
            logPolicy = row.logType,
            operator = row.operator,
            message = row.message,
            // CSV alone can't tell us whether a server actually offers
            // SoftEther — some servers only offer OpenVPN, which only the
            // HTML page (spec section 4.1.2) reveals. This CSV-only path is
            // now used purely as a fallback when the HTML page can't be
            // fetched at all (see VpnGateServerRepository) — there's no HTML
            // data available in that case to correct this assumption with,
            // so it may simply be wrong for servers that don't really
            // support SoftEther.
            supportedProtocols = buildSet {
                add(VpnProtocol.SOFTETHER)
                if (decodedConfig != null) add(VpnProtocol.OPENVPN)
            },
            openVpnConfigBase64 = row.openVpnConfigBase64.ifBlank { null },
            softEtherEndpoint = softEtherEndpoint,
            source = source
        )
    }

    private fun decodeOpenVpnConfig(base64: String): String? {
        if (base64.isBlank()) return null
        return try {
            String(Base64.decode(base64, Base64.DEFAULT), Charsets.UTF_8)
        } catch (e: IllegalArgumentException) {
            null
        }
    }

    /**
     * Best-effort SoftEther endpoint: prefer the "remote host port" line
     * embedded in the OpenVPN config (VPN Gate relays serve SoftEther on the
     * same TCP port), falling back to the row's own host/IP on the
     * well-known default port. See [VpnServer.softEtherEndpoint] doc for why
     * this is a CSV-only approximation.
     */
    private fun extractSoftEtherEndpoint(row: VpnGateCsvRow, decodedConfig: String?): ProtocolEndpoint {
        val match = decodedConfig?.let { REMOTE_LINE_REGEX.find(it) }
        val host = match?.groupValues?.get(1)?.takeIf { it.isNotBlank() } ?: row.ip
        val port = match?.groupValues?.get(2)?.toIntOrNull() ?: DEFAULT_SOFTETHER_PORT
        return ProtocolEndpoint(host = host, port = port, transport = Transport.TCP)
    }
}
