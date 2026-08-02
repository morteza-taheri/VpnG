package com.vpng.app.data.remote.dto

/**
 * Per-server protocol capability/endpoint data extracted from the
 * vpngate.net/en/ HTML table (spec section 4.1.2) — deliberately narrower
 * than [VpnGateCsvRow]. The CSV already gives clean score/ping/sessions/etc.,
 * but only HTML tells us the *actual* per-protocol truth:
 *
 * - Whether SoftEther (SSL-VPN) is offered at all — some servers have no
 *   SSL-VPN column filled in and only offer OpenVPN. The CSV can't
 *   distinguish this; it was previously (wrongly) assumed every CSV row
 *   supports SoftEther.
 * - Real TCP/UDP ports for OpenVPN, and whether SoftEther UDP (RUDP) is
 *   supported (no explicit port is published for that, only a
 *   Boolean "Supported"/absent marker).
 * - The explicit SSTP hostname[:port] (spec section 4.3), rather than an
 *   inference from the OpenVPN config blob.
 *
 * HtmlServerMapper joins this onto the CSV-derived VpnServer by hostname/IP.
 */
data class VpnGateHtmlRow(
    val hostName: String,
    val ip: String,
    val softEtherTcpPort: Int?,       // null = SoftEther not offered by this server
    val softEtherUdpSupported: Boolean,
    val l2tpSupported: Boolean,        // recorded but unused — spec section 3 drops L2TP
    val openVpnTcpPort: Int?,
    val openVpnUdpPort: Int?,
    val sstpHostname: String?,
    val sstpPort: Int?
)
