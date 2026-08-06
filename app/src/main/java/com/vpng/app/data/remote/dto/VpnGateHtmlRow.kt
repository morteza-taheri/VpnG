package com.vpng.app.data.remote.dto

/**
 * A server's data as extracted from the vpngate.net/en/ HTML table
 * (spec section 4.1.2) — now a COMPLETE per-server record, not just
 * protocol/port data.
 *
 * History: this used to be deliberately narrow (protocol data only), with
 * a separate mapper joining it onto CSV-derived servers by matching IP.
 * That broke in practice: the CSV endpoint and the HTML page are two
 * independent HTTP requests against VPN Gate's live, constantly-rotating
 * top-N server list, so the two responses frequently contain almost
 * entirely DIFFERENT servers — matching by IP silently failed for most
 * rows, leaving most servers with unknown OpenVPN ports (only the
 * CSV-only fallback SoftEther TCP port, guessed from the embedded OpenVPN
 * config, was populated). Fixed by making HTML a self-sufficient primary
 * source: when it's available, build VpnServer objects directly from it
 * instead of trying to cross-reference two different snapshots.
 *
 * HTML is still uniquely authoritative for:
 * - Whether SoftEther (SSL-VPN) is offered at all — some servers have no
 *   SSL-VPN column filled in and only offer OpenVPN. CSV alone can't tell.
 * - Real TCP/UDP ports for OpenVPN, and whether SoftEther UDP (RUDP) is
 *   supported (no explicit port is ever published for that, just a
 *   Boolean "Supported"/absent marker).
 * - The explicit SSTP hostname[:port] (spec section 4.3).
 */
data class VpnGateHtmlRow(
    val countryName: String,
    val hostName: String,
    val ip: String,
    val sessions: Int,
    val uptime: String,
    val totalUsers: Long,
    val speedMbps: Double,
    val ping: Int,
    val totalTrafficGb: Double,
    val logPolicy: String,
    val score: Long,
    val softEtherTcpPort: Int?,       // null = SoftEther not offered by this server
    val softEtherUdpSupported: Boolean,
    val l2tpSupported: Boolean,        // recorded but unused — spec section 3 drops L2TP
    val openVpnTcpPort: Int?,
    val openVpnUdpPort: Int?,
    val sstpHostname: String?,
    val sstpPort: Int?
)
