package com.vpng.app.data.remote.dto

/**
 * Parses the raw text response of the VPN Gate CSV API (or its mirror —
 * same format, spec section 4.1.3) into [VpnGateCsvRow] entries.
 *
 * Real-world response shape:
 * ```
 * *vpn_servers
 * #HostName,IP,Score,Ping,Speed,CountryLong,CountryShort,NumVpnSessions,Uptime,TotalUsers,TotalTraffic,LogType,Operator,Message,OpenVPN_ConfigData_Base64
 * public-vpn-1.example.com,1.2.3.4,1000000,50,10000000,Japan,JP,3,21 days,12345,999 GB,2 Weeks,someone,hi,<base64>
 * ...
 * *
 * ```
 * i.e. a `*`-prefixed banner line, a `#`-prefixed header line, then one CSV
 * data row per server, ending with a lone `*`.
 */
object VpnGateCsvParser {

    private const val EXPECTED_COLUMNS = 15

    fun parse(rawCsv: String): List<VpnGateCsvRow> {
        return rawCsv.lineSequence()
            .map { it.trim() }
            .filter { it.isNotEmpty() && !it.startsWith("#") && it != "*" && !it.startsWith("*vpn_servers") }
            .mapNotNull { parseLine(it) }
            .toList()
    }

    private fun parseLine(line: String): VpnGateCsvRow? {
        // The OpenVPN_ConfigData_Base64 column is always last and never
        // contains a comma (base64 alphabet has none). Splitting with a
        // limit keeps that entire trailing base64 blob intact even though
        // it's technically "one field" after the 15th comma.
        // Known limitation: this is a plain (non-quoted) CSV split, so a
        // stray comma inside an earlier field (e.g. CountryLong) would still
        // misalign columns 6-14. VPN Gate's real country names don't contain
        // commas in practice, so this hasn't been an issue for other public
        // VPN Gate clients that parse the same way — but it's worth knowing
        // if data ever looks off for a specific server.
        val parts = line.split(",", limit = EXPECTED_COLUMNS)
        if (parts.size < EXPECTED_COLUMNS) return null

        return try {
            VpnGateCsvRow(
                hostName = parts[0].removePrefix("#"),
                ip = parts[1],
                score = parts[2].toLongOrNull() ?: 0L,
                ping = parts[3].toIntOrNull() ?: -1,
                speedBps = parts[4].toLongOrNull() ?: 0L,
                countryLong = parts[5],
                countryShort = parts[6],
                numVpnSessions = parts[7].toIntOrNull() ?: 0,
                uptime = parts[8],
                totalUsers = parts[9].toLongOrNull() ?: 0L,
                totalTraffic = parts[10],
                logType = parts[11],
                operator = parts[12],
                message = parts[13],
                openVpnConfigBase64 = parts[14]
            )
        } catch (e: Exception) {
            null
        }
    }
}
