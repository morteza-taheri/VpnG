package com.vpng.client.network

import android.util.Base64
import com.vpng.client.data.VpnServer
import okhttp3.OkHttpClient
import okhttp3.Request
import org.jsoup.Jsoup
import java.io.BufferedReader
import java.io.InputStreamReader

object VpnGateParser {
    private val client = OkHttpClient()
    private const val VPNGATE_API_URL = "http://www.vpngate.net/api/iphone/"
    private const val VPNGATE_HTML_URL = "https://www.vpngate.net/en/"

    /**
     * Hybrid fetching and parsing method.
     * Combines VPNGate CSV API and Web Scraping (HTML parsing with Jsoup)
     * to bypass DoS API limits and fetch the maximum number of servers.
     */
    fun fetchAndFilterServers(): List<VpnServer> {
        val serversMap = mutableMapOf<String, VpnServer>()

        // 1. Fetch and Parse from CSV API
        try {
            val apiServers = fetchFromApi()
            for (server in apiServers) {
                serversMap[server.ipAddress] = server
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        // 2. Fetch and Parse from HTML Web Page (Using Jsoup for hybrid list enrichment)
        try {
            val htmlServers = fetchFromHtml()
            for (server in htmlServers) {
                // If the server is already added via API, we keep the API version (contains config data)
                // but we can update its ping or score if the scraped HTML represents a fresher stat.
                if (!serversMap.containsKey(server.ipAddress)) {
                    serversMap[server.ipAddress] = server
                } else {
                    val existing = serversMap[server.ipAddress]!!
                    serversMap[server.ipAddress] = existing.copy(
                        ping = minOf(existing.ping, server.ping),
                        score = maxOf(existing.score, server.score)
                    )
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return serversMap.values.toList().sortedByDescending { it.score }
    }

    private fun fetchFromApi(): List<VpnServer> {
        val request = Request.Builder().url(VPNGATE_API_URL).build()
        val servers = mutableListOf<VpnServer>()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) return emptyList()
            val body = response.body ?: return emptyList()
            
            val reader = BufferedReader(InputStreamReader(body.byteStream()))
            var headerLine: String? = null
            var headers = emptyList<String>()

            reader.forEachLine { line ->
                val trimmed = line.trim()
                if (trimmed.isEmpty() || trimmed.startsWith("*")) return@forEachLine
                
                if (trimmed.startsWith("#HostName") || trimmed.startsWith("HostName")) {
                    headerLine = trimmed.replace("^#".toRegex(), "")
                    headers = headerLine!!.split(",")
                    return@forEachLine
                }

                if (headerLine != null) {
                    val values = trimmed.split(",")
                    if (values.size < headers.size) return@forEachLine
                    
                    val serverMap = headers.zip(values).toMap()
                    val configBase64 = serverMap["OpenVPN_ConfigData_Base64"] ?: ""
                    
                    if (isSoftEtherTlsServer(configBase64)) {
                        val decodedConfig = decodeBase64(configBase64)
                        val port = extractPortFromConfig(decodedConfig)
                        
                        servers.add(
                            VpnServer(
                                hostName = serverMap["HostName"] ?: "unknown",
                                ipAddress = serverMap["IP"] ?: "0.0.0.0",
                                port = port,
                                country = serverMap["CountryLong"] ?: "Unknown",
                                countryShort = serverMap["CountryShort"] ?: "UN",
                                ping = serverMap["Ping"]?.toIntOrNull() ?: 999,
                                score = serverMap["Score"]?.toIntOrNull() ?: 0,
                                lastUpdate = System.currentTimeMillis()
                            )
                        )
                    }
                }
            }
        }
        return servers
    }

    private fun fetchFromHtml(): List<VpnServer> {
        val request = Request.Builder()
            .url(VPNGATE_HTML_URL)
            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            .build()
        
        val servers = mutableListOf<VpnServer>()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) return emptyList()
            val html = response.body?.string() ?: return emptyList()
            
            val doc = Jsoup.parse(html)
            // Target the main servers table which contains 'SSL-VPN' column text
            val table = doc.select("table:has(td:contains(SSL-VPN))").first() ?: return emptyList()
            val rows = table.select("tr")

            for (row in rows) {
                val cols = row.select("td")
                // VPNGate tables usually have 10 columns for VPN servers list
                if (cols.size >= 8) {
                    val countryCol = cols[0]
                    val hostCol = cols[1]
                    val sessionsCol = cols[2]
                    val throughputCol = cols[3]
                    val sslCol = cols[4]

                    val sslText = sslCol.text()
                    val isTcpSupported = sslText.contains("TCP", ignoreCase = true) || sslText.contains("SSL-VPN", ignoreCase = true)
                    
                    if (isTcpSupported) {
                        // Country parsing (Image contains country short code, e.g. flags/JP.png)
                        val flagImg = countryCol.select("img").first()
                        val countryShort = flagImg?.attr("src")
                            ?.substringAfter("/flags/")
                            ?.substringBefore(".")
                            ?.uppercase() ?: "UN"
                        val countryLong = countryCol.text().trim()

                        // Hostname and IP address parsing
                        val hostText = hostCol.text()
                        val hostName = hostText.substringBefore("(").trim()
                        val ipMatch = Regex("(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})").find(hostText)
                        val ipAddress = ipMatch?.value ?: hostName

                        // Port extraction from the SSL-VPN column text
                        val portMatch = Regex("TCP:\\s*(\\d+)").find(sslText) 
                            ?: Regex("Port:\\s*(\\d+)").find(sslText) 
                            ?: Regex("(\\d+)").find(sslText)
                        val port = portMatch?.groupValues?.get(1)?.toIntOrNull() ?: 443

                        // Quality / Performance parsing
                        val qualityText = sessionsCol.text()
                        val pingMatch = Regex("(?i)Ping:\\s*(\\d+)\\s*ms").find(qualityText) 
                            ?: Regex("(\\d+)\\s*ms").find(qualityText)
                        val ping = pingMatch?.groupValues?.get(1)?.toIntOrNull() ?: 120 // realistic default

                        val sessionsMatch = Regex("(?i)(\\d+)\\s*sessions").find(qualityText) 
                            ?: Regex("(?i)sessions:\\s*(\\d+)").find(qualityText)
                        val sessions = sessionsMatch?.groupValues?.get(1)?.toIntOrNull() ?: 0

                        val speedText = throughputCol.text()
                        val speedMatch = Regex("([\\d.]+)\\s*(Mbps|Kbps|Gbps)", RegexOption.IGNORE_CASE).find(speedText)
                        val speedMbps = if (speedMatch != null) {
                            val valStr = speedMatch.groupValues[1]
                            val unit = speedMatch.groupValues[2].uppercase()
                            val value = valStr.toDoubleOrNull() ?: 0.0
                            when (unit) {
                                "GBPS" -> (value * 1000).toInt()
                                "KBPS" -> (value / 1000).toInt()
                                else -> value.toInt()
                            }
                        } else {
                            15
                        }

                        // Calculate dynamic performance score for sorting priority
                        val calculatedScore = (speedMbps * 1500) - (ping * 8) + (sessions * 10)

                        servers.add(
                            VpnServer(
                                hostName = hostName,
                                ipAddress = ipAddress,
                                port = port,
                                country = countryLong,
                                countryShort = countryShort,
                                ping = ping,
                                score = maxOf(0, calculatedScore),
                                lastUpdate = System.currentTimeMillis()
                            )
                        )
                    }
                }
            }
        }
        return servers
    }

    private fun isSoftEtherTlsServer(base64Config: String): Boolean {
        if (base64Config.isEmpty()) return false
        return try {
            val decodedConfig = decodeBase64(base64Config)
            decodedConfig.contains("proto tcp") && decodedConfig.contains("remote")
        } catch (e: Exception) {
            false
        }
    }

    private fun decodeBase64(base64Str: String): String {
        val decodedBytes = Base64.decode(base64Str, Base64.DEFAULT)
        return String(decodedBytes, Charsets.UTF_8)
    }

    private fun extractPortFromConfig(configString: String): Int {
        val remotePattern = Regex("remote\\s+\\S+\\s+(\\d+)")
        val match = remotePattern.find(configString)
        return match?.groupValues?.get(1)?.toIntOrNull() ?: 443
    }
}
