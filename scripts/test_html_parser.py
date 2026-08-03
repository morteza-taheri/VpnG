"""
Test script for VpnGateHtmlParser's logic (Kotlin: app/src/main/java/com/vpng/app/data/remote/dto/VpnGateHtmlParser.kt).

This is a Python re-implementation of the EXACT SAME algorithm as the Kotlin
parser (same anchor phrases, same segment-boundary logic, same regexes) so we
can quickly verify it against a real saved copy of the vpngate.net/en/ page
without needing to build the Android app.

Usage:
    pip install beautifulsoup4
    python3 test_html_parser.py "VPN_Gate_-_Public_Free_VPN_Cloud_by_Univ_of_Tsukuba, Japan.html"

Just paste the full console output back — that's all I need.
"""

import re
import sys
from bs4 import BeautifulSoup

MARKER_SSL_VPN = "SSL-VPN Connect guide"
MARKER_L2TP = "L2TP/IPsec Connect guide"
MARKER_OPENVPN = "OpenVPN Config file"
MARKER_SSTP = "MS-SSTP Connect guide"

HOSTNAME_RE = re.compile(r"\b([A-Za-z0-9._-]+\.opengw\.net)\b")
IPV4_RE = re.compile(r"\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b")
TCP_PORT_RE = re.compile(r"TCP:\s*(\d+)")
UDP_PORT_RE = re.compile(r"UDP:\s*(\d+)")
UDP_SUPPORTED_RE = re.compile(r"UDP:\s*Supported")
SSTP_HOSTNAME_RE = re.compile(r"SSTP Hostname\s*:\s*([A-Za-z0-9._-]+\.opengw\.net)(?::(\d+))?")


def segment_for(text, markers, marker, index):
    if index == -1:
        return ""
    content_start = index + len(marker)
    later = [pos for _, pos in markers if pos > index]
    next_start = min(later) if later else len(text)
    return text[content_start:next_start]


def parse_row(row_text):
    host_match = HOSTNAME_RE.search(row_text)
    ip_match = IPV4_RE.search(row_text)
    if not host_match or not ip_match:
        return None

    ssl_vpn_idx = row_text.find(MARKER_SSL_VPN)
    l2tp_idx = row_text.find(MARKER_L2TP)
    openvpn_idx = row_text.find(MARKER_OPENVPN)
    sstp_idx = row_text.find(MARKER_SSTP)

    markers = [
        (MARKER_SSL_VPN, ssl_vpn_idx),
        (MARKER_L2TP, l2tp_idx),
        (MARKER_OPENVPN, openvpn_idx),
        (MARKER_SSTP, sstp_idx),
    ]
    markers = [m for m in markers if m[1] != -1]

    ssl_vpn_segment = segment_for(row_text, markers, MARKER_SSL_VPN, ssl_vpn_idx)
    openvpn_segment = segment_for(row_text, markers, MARKER_OPENVPN, openvpn_idx)
    sstp_segment = segment_for(row_text, markers, MARKER_SSTP, sstp_idx)

    softether_tcp = TCP_PORT_RE.search(ssl_vpn_segment)
    softether_udp_supported = bool(UDP_SUPPORTED_RE.search(ssl_vpn_segment))
    l2tp_supported = l2tp_idx != -1

    openvpn_tcp = TCP_PORT_RE.search(openvpn_segment)
    openvpn_udp = UDP_PORT_RE.search(openvpn_segment)

    sstp_match = SSTP_HOSTNAME_RE.search(sstp_segment)

    return {
        "hostName": host_match.group(1),
        "ip": ip_match.group(1),
        "softEtherTcpPort": int(softether_tcp.group(1)) if softether_tcp else None,
        "softEtherUdpSupported": softether_udp_supported,
        "l2tpSupported": l2tp_supported,
        "openVpnTcpPort": int(openvpn_tcp.group(1)) if openvpn_tcp else None,
        "openVpnUdpPort": int(openvpn_udp.group(1)) if openvpn_udp else None,
        "sstpHostname": sstp_match.group(1) if sstp_match else None,
        "sstpPort": int(sstp_match.group(2)) if sstp_match and sstp_match.group(2) else None,
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 test_html_parser.py <path-to-saved-html>")
        sys.exit(1)

    path = sys.argv[1]
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        html = f.read()

    soup = BeautifulSoup(html, "lxml")

    table = soup.find(id="vg_hosts_table_id")
    used_fallback = False

    # Real page bug found via testing: the id 'vg_hosts_table_id' is reused
    # on THREE different tables (Recent Activity, Ranking, and the actual
    # full server list) — find(id=...) grabs whichever comes first, which is
    # NOT the big list. Instead, collect every candidate table (by id or by
    # text heuristic) and take the one with the most rows.
    candidates = soup.find_all(id="vg_hosts_table_id") + [
        t for t in soup.find_all("table")
        if "DDNS hostname" in t.get_text() and MARKER_SSL_VPN in t.get_text()
    ]
    if candidates:
        table = max(candidates, key=lambda t: len(t.find_all("tr")))
        used_fallback = table.get("id") != "vg_hosts_table_id"
    else:
        table = None

    if table is None:
        print("FAILED: could not find the server table at all (neither by id nor by text heuristic).")
        sys.exit(1)

    table_source = f"largest matching table ({len(table.find_all('tr'))} rows, id={table.get('id')!r})"
    print(f"Found table via: {table_source}")

    rows = table.find_all("tr")
    print(f"Total <tr> elements in table: {len(rows)}")

    parsed = []
    for row in rows:
        row_text = row.get_text(separator=" ")
        result = parse_row(row_text)
        if result:
            parsed.append(result)

    print(f"Successfully parsed server rows: {len(parsed)}")
    print()

    # Summary stats — useful to eyeball correctness at a glance.
    no_softether = sum(1 for r in parsed if r["softEtherTcpPort"] is None and not r["softEtherUdpSupported"])
    softether_udp_only = sum(1 for r in parsed if r["softEtherTcpPort"] is None and r["softEtherUdpSupported"])
    no_openvpn = sum(1 for r in parsed if r["openVpnTcpPort"] is None and r["openVpnUdpPort"] is None)
    has_sstp = sum(1 for r in parsed if r["sstpHostname"] is not None)
    underscore_hosts = [r["hostName"] for r in parsed if r["hostName"].startswith("_")]

    print("--- Summary ---")
    print(f"Servers with NO SoftEther at all:                {no_softether}")
    print(f"Servers with SoftEther UDP-only (no TCP port):   {softether_udp_only}")
    print(f"Servers with NO OpenVPN at all:                  {no_openvpn}")
    print(f"Servers with an SSTP hostname:                   {has_sstp}")
    print(f"Hostnames starting with underscore (edge case):  {underscore_hosts}")
    print()

    print("--- First 5 parsed rows (full detail) ---")
    for r in parsed[:5]:
        print(r)

    print()
    print("--- Any row with NO SoftEther AND NO OpenVPN (fully unusable for phase 1) ---")
    fully_unusable = [r for r in parsed if r["softEtherTcpPort"] is None and r["openVpnTcpPort"] is None and r["openVpnUdpPort"] is None]
    for r in fully_unusable[:5]:
        print(r)
    if not fully_unusable:
        print("(none found)")


if __name__ == "__main__":
    main()
