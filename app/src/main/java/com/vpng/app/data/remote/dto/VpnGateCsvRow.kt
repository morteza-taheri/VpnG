package com.vpng.app.data.remote.dto

/**
 * Raw row from the VPN Gate CSV (official API or mirror) — column layout
 * per specification section 4.2. Field order matters; it matches the
 * `#HostName,IP,Score,Ping,Speed,CountryLong,CountryShort,NumVpnSessions,
 * Uptime,TotalUsers,TotalTraffic,LogType,Operator,Message,
 * OpenVPN_ConfigData_Base64` header exactly.
 */
data class VpnGateCsvRow(
    val hostName: String,
    val ip: String,
    val score: Long,
    val ping: Int,
    val speedBps: Long,
    val countryLong: String,
    val countryShort: String,
    val numVpnSessions: Int,
    val uptime: String,
    val totalUsers: Long,
    val totalTraffic: String,
    val logType: String,
    val operator: String,
    val message: String,
    val openVpnConfigBase64: String
)
