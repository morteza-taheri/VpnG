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
     * Host/port/transport to actually dial for the SoftEther protocol, or
     * null if this server doesn't offer SoftEther at all.
     * When [source] is [ServerSource.HTML] this is the real, confirmed
     * value (see HtmlServerMapper). When [source] is [ServerSource.API] or
     * [ServerSource.MIRROR_CSV] (the HTML-fetch-failed fallback path) it's
     * only a best-effort guess (see CsvServerMapper) — the official CSV
     * columns (spec section 4.2) don't expose a dedicated SoftEther port or
     * even whether SoftEther is offered at all.
     */
    val softEtherEndpoint: ProtocolEndpoint?,
    /** True if the HTML page marked SoftEther UDP (RUDP) as supported — no dedicated port is ever published for it. */
    val softEtherUdpSupported: Boolean = false,
    /** Explicit OpenVPN ports from the HTML page (spec section 4.1.2) — null until HTML data is available for this server. */
    val openVpnTcpPort: Int? = null,
    val openVpnUdpPort: Int? = null,
    /**
     * Explicit SSTP hostname[:port] from the HTML page (spec section 4.3).
     * Null until HTML data is available — CSV alone has no SSTP signal at
     * all. Not yet dialable (no SSTP adapter implemented, see README), but
     * captured now since the HTML page gives it to us for free.
     */
    val sstpEndpoint: ProtocolEndpoint? = null,
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
