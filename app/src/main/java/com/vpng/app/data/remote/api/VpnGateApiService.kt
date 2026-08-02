package com.vpng.app.data.remote.api

import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Url

/**
 * VPN Gate CSV endpoints — spec sections 4.1.1 (primary) and 4.1.3 (mirror).
 * Both return the same CSV text format, so a single @Url-based call covers
 * either; ServerRepositoryImpl passes the right constant in.
 */
interface VpnGateApiService {
    @GET
    suspend fun fetchCsv(@Url url: String): Response<ResponseBody>

    companion object {
        // Note: this is genuinely http:// (not https) upstream — see
        // network_security_config.xml for the cleartext exception this requires.
        const val PRIMARY_API_URL = "http://www.vpngate.net/api/iphone/"
        const val MIRROR_CSV_URL =
            "https://raw.githubusercontent.com/morteza-taheri/VpnM/refs/heads/master/Servers.csv"
    }
}
