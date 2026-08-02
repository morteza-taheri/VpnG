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
    val supportedProtocols: Set<VpnProtocol>,
    val openVpnConfigBase64: String?,
    val source: ServerSource
)

enum class VpnProtocol {
    SOFTETHER,
    OPENVPN,
    SSTP
    // Note: L2TP/IPsec intentionally not supported — see specification section 3.
}

enum class ServerSource {
    API,
    HTML,
    MIRROR_CSV,
    MIRROR_SITE,
    CACHE
}
