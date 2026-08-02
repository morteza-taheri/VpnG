package com.vpng.app.domain.model

/**
 * Unified server model — see specification section 4.4.
 * Populated from whichever data source is currently available
 * (API, HTML scrape, or CSV mirror — see section 4.1–4.3).
 */
data class VpnServer(
    val hostName: String,
    val ip: String,
    val countryCode: String,
    val countryName: String,
    val speedMbps: Double,
    val ping: Int,
    val score: Long,
    val numVpnSessions: Int,
    val uptime: String = "",
    val totalUsers: Long = 0,
    val totalTraffic: String = "",
    val logPolicy: String = "",
    val operator: String = "",
    val message: String = "",
    val supportedProtocols: Set<VpnProtocol>,
    val openVpnConfigBase64: String?,
    /**
     * Host/port/transport to actually dial for the SoftEther protocol.
     * From CSV-only sources this is derived (see CsvServerMapper) from the
     * embedded OpenVPN config's "remote" line, since the official CSV columns
     * (spec section 4.2) don't expose a dedicated SoftEther port. When the
     * HTML source (section 4.1.2) is wired up, prefer its explicit SSL-VPN
     * column instead — it's the more reliable value.
     */
    val softEtherEndpoint: ProtocolEndpoint?,
    val source: ServerSource
)

enum class VpnProtocol {
    SOFTETHER,
    OPENVPN,
    SSTP
    // Note: L2TP/IPsec intentionally not supported — see specification section 3.
}

enum class Transport { TCP, UDP }

data class ProtocolEndpoint(
    val host: String,
    val port: Int,
    val transport: Transport
)

enum class ServerSource {
    API,
    HTML,
    MIRROR_CSV,
    MIRROR_SITE,
    CACHE
}
