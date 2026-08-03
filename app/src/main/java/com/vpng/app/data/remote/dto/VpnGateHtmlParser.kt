package com.vpng.app.data.remote.dto

import org.jsoup.Jsoup
import org.jsoup.nodes.Element
import org.jsoup.nodes.TextNode

/**
 * Parses the vpngate.net/en/ server table (spec section 4.1.2).
 *
 * Verified against a real saved copy of the page (2026-08-02) using a
 * Python/BeautifulSoup port of this exact algorithm — two real bugs were
 * caught and fixed this way before ever touching an emulator:
 *
 * 1. The id "vg_hosts_table_id" is reused on THREE different tables (Recent
 *    Activity, Ranking, and the actual full server list) — getElementById()
 *    silently grabs the wrong (tiny) one. Fixed by collecting every
 *    candidate table (by id OR by the text heuristic) and picking whichever
 *    has the most rows — the real list has ~100+, the others just a few.
 * 2. Jsoup's Element.text() (like most HTML text extraction) does NOT insert
 *    any whitespace for `<br>` tags — and the real page uses `<b>SSL-VPN<br>
 *    Connect guide</b>`, so naive .text() produces "SSL-VPNConnect guide"
 *    (no space), silently breaking every anchor-phrase match below. Fixed by
 *    replacing every `<br>` with a space TextNode before extracting text.
 *
 * Field extraction uses stable literal anchor phrases from the link text
 * ("SSL-VPN Connect guide", "OpenVPN Config file", etc.) applied to each
 * row's full text, rather than fragile CSS selectors.
 *
 * Confirmed edge cases from the real data this must handle:
 * - Some servers have NO SoftEther at all (empty SSL-VPN cell).
 * - Some servers have NO OpenVPN link at all either (e.g. a server offering
 *   only "SoftEther UDP: Supported" with nothing else) — every marker below
 *   is therefore optional, not just SSL-VPN/L2TP/SSTP.
 * - Hostnames can contain underscores (e.g. "_unregistered_vpn...opengw.net").
 */
object VpnGateHtmlParser {

    private const val MARKER_SSL_VPN = "SSL-VPN Connect guide"
    private const val MARKER_L2TP = "L2TP/IPsec Connect guide"
    private const val MARKER_OPENVPN = "OpenVPN Config file"
    private const val MARKER_SSTP = "MS-SSTP Connect guide"

    private val HOSTNAME_REGEX = Regex("""\b([A-Za-z0-9._-]+\.opengw\.net)\b""")
    private val IPV4_REGEX = Regex("""\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b""")
    private val TCP_PORT_REGEX = Regex("""TCP:\s*(\d+)""")
    private val UDP_PORT_REGEX = Regex("""UDP:\s*(\d+)""")
    private val UDP_SUPPORTED_REGEX = Regex("""UDP:\s*Supported""")
    private val SSTP_HOSTNAME_REGEX = Regex("""SSTP Hostname\s*:\s*([A-Za-z0-9._-]+\.opengw\.net)(?::(\d+))?""")

    fun parse(html: String): List<VpnGateHtmlRow> {
        val doc = Jsoup.parse(html)

        // id="vg_hosts_table_id" is duplicated across 3 tables (see class
        // doc, bug #1) — collect every candidate (by id OR text heuristic)
        // and take whichever actually has the most rows.
        val candidates = (
            doc.select("#vg_hosts_table_id") +
                doc.select("table").filter { t ->
                    val text = t.text()
                    text.contains("DDNS hostname") && text.contains("SSL-VPN")
                }
            ).distinct()

        val table = candidates.maxByOrNull { it.select("tr").size } ?: return emptyList()

        return table.select("tr").mapNotNull { row -> parseRow(row) }
    }

    private fun parseRow(row: Element): VpnGateHtmlRow? {
        // Bug #2 fix (see class doc): <br> contributes no whitespace to
        // Element.text(), which silently breaks every anchor-phrase match
        // below ("SSL-VPNConnect guide" instead of "SSL-VPN Connect guide").
        // Work on a clone so we don't mutate the live DOM while iterating.
        val clone = row.clone()
        clone.select("br").forEach { it.replaceWith(TextNode(" ")) }
        val text = clone.text()

        // Header rows repeat periodically; only rows for an actual server
        // contain a real .opengw.net hostname.
        val hostName = HOSTNAME_REGEX.find(text)?.groupValues?.get(1) ?: return null
        val ip = IPV4_REGEX.find(text)?.groupValues?.get(1) ?: return null

        // Every one of these four markers is independently optional — a real
        // server can have any subset present (see class doc for confirmed
        // examples). Segment boundaries are computed generically: each
        // marker's content runs until whichever other present marker comes
        // next in the text, or end-of-row if it's the last one present.
        val sslVpnIdx = text.indexOf(MARKER_SSL_VPN)
        val l2tpIdx = text.indexOf(MARKER_L2TP)
        val openVpnIdx = text.indexOf(MARKER_OPENVPN)
        val sstpIdx = text.indexOf(MARKER_SSTP)

        val markerPositions = listOf(
            MARKER_SSL_VPN to sslVpnIdx,
            MARKER_L2TP to l2tpIdx,
            MARKER_OPENVPN to openVpnIdx,
            MARKER_SSTP to sstpIdx
        ).filter { it.second != -1 }.sortedBy { it.second }

        fun segmentFor(marker: String, index: Int): String {
            if (index == -1) return ""
            val contentStart = index + marker.length
            val nextStart = markerPositions.firstOrNull { it.second > index }?.second ?: text.length
            return text.substring(contentStart, nextStart)
        }

        val sslVpnSegment = segmentFor(MARKER_SSL_VPN, sslVpnIdx)
        val openVpnSegment = segmentFor(MARKER_OPENVPN, openVpnIdx)
        val sstpSegment = segmentFor(MARKER_SSTP, sstpIdx)

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
