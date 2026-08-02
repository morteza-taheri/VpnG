package com.vpng.app.data.remote.dto

import org.jsoup.Jsoup
import org.jsoup.nodes.Element

/**
 * Parses the vpngate.net/en/ server table (spec section 4.1.2).
 *
 * IMPORTANT — this was written from a *rendered/markdown extraction* of the
 * live page (fetched during development), not the raw HTML source, since
 * this environment has no way to inspect vpngate.net's actual tag/class
 * structure. So instead of relying on fragile CSS selectors (specific
 * classes/ids that might be wrong), this parses each `<tr>`'s full
 * concatenated *text* and locates fields using stable literal anchor
 * phrases that are extremely unlikely to change ("SSL-VPN Connect guide",
 * "OpenVPN Config file", etc. — these are link labels, not styling).
 *
 * If this returns an empty list against the real page, the anchor phrases
 * or row/table detection below need adjusting against an actual HTML
 * sample — the regex-per-segment design should make that a small, local fix
 * rather than a rewrite.
 */
object VpnGateHtmlParser {

    private const val MARKER_SSL_VPN = "SSL-VPN Connect guide"
    private const val MARKER_L2TP = "L2TP/IPsec Connect guide"
    private const val MARKER_OPENVPN = "OpenVPN Config file"
    private const val MARKER_SSTP = "MS-SSTP Connect guide"

    private val HOSTNAME_REGEX = Regex("""\b([A-Za-z0-9.-]+\.opengw\.net)\b""")
    private val IPV4_REGEX = Regex("""\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b""")
    private val TCP_PORT_REGEX = Regex("""TCP:\s*(\d+)""")
    private val UDP_PORT_REGEX = Regex("""UDP:\s*(\d+)""")
    private val UDP_SUPPORTED_REGEX = Regex("""UDP:\s*Supported""")
    private val SSTP_HOSTNAME_REGEX = Regex("""SSTP Hostname\s*:\s*([A-Za-z0-9.-]+)(?::(\d+))?""")

    fun parse(html: String): List<VpnGateHtmlRow> {
        val doc = Jsoup.parse(html)

        // Find the table containing the server list — anchored on stable
        // header/link text rather than a specific id/class.
        val table = doc.select("table").firstOrNull { table ->
            val text = table.text()
            text.contains("DDNS hostname") && text.contains(MARKER_OPENVPN)
        } ?: return emptyList()

        return table.select("tr")
            .mapNotNull { row -> parseRow(row) }
    }

    private fun parseRow(row: Element): VpnGateHtmlRow? {
        val text = row.text()

        // Header rows repeat periodically in the real page; only rows for
        // an actual server contain a .opengw.net hostname.
        val hostName = HOSTNAME_REGEX.find(text)?.groupValues?.get(1) ?: return null
        val ip = IPV4_REGEX.find(text)?.groupValues?.get(1) ?: return null

        val sslVpnIdx = text.indexOf(MARKER_SSL_VPN)
        val l2tpIdx = text.indexOf(MARKER_L2TP)
        val openVpnIdx = text.indexOf(MARKER_OPENVPN)
        val sstpIdx = text.indexOf(MARKER_SSTP)

        if (openVpnIdx == -1) return null // every real row has an OpenVPN link; bail if our anchors don't match this row at all

        val sslVpnSegment = if (sslVpnIdx == -1) "" else {
            val end = listOf(l2tpIdx, openVpnIdx).filter { it > sslVpnIdx }.minOrNull() ?: openVpnIdx
            text.substring(sslVpnIdx + MARKER_SSL_VPN.length, end)
        }

        val openVpnSegment = run {
            val end = if (sstpIdx > openVpnIdx) sstpIdx else text.length
            text.substring(openVpnIdx + MARKER_OPENVPN.length, end)
        }

        val sstpSegment = if (sstpIdx == -1) "" else text.substring(sstpIdx + MARKER_SSTP.length)

        val softEtherTcpPort = TCP_PORT_REGEX.find(sslVpnSegment)?.groupValues?.get(1)?.toIntOrNull()
        val softEtherUdpSupported = UDP_SUPPORTED_REGEX.containsMatchIn(sslVpnSegment)
        val l2tpSupported = l2tpIdx != -1

        val openVpnTcpPort = TCP_PORT_REGEX.find(openVpnSegment)?.groupValues?.get(1)?.toIntOrNull()
        val openVpnUdpPort = UDP_PORT_REGEX.find(openVpnSegment)?.groupValues?.get(1)?.toIntOrNull()

        val sstpMatch = SSTP_HOSTNAME_REGEX.find(sstpSegment)
        val sstpHostname = sstpMatch?.groupValues?.get(1)
        val sstpPort = sstpMatch?.groupValues?.get(2)?.toIntOrNull()

        return VpnGateHtmlRow(
            hostName = hostName,
            ip = ip,
            softEtherTcpPort = softEtherTcpPort,
            softEtherUdpSupported = softEtherUdpSupported,
            l2tpSupported = l2tpSupported,
            openVpnTcpPort = openVpnTcpPort,
            openVpnUdpPort = openVpnUdpPort,
            sstpHostname = sstpHostname,
            sstpPort = sstpPort
        )
    }
}
