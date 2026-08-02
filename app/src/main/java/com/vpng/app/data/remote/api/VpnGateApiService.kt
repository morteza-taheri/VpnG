package com.vpng.app.data.remote.api

import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Url

/**
 * Generic raw-text fetch used for both the CSV endpoints (spec sections
 * 4.1.1/4.1.3) and the HTML server list page (section 4.1.2) — all three
 * are plain GET requests returning a text body, just different formats.
 */
interface VpnGateApiService {
    @GET
    suspend fun fetchRaw(@Url url: String): Response<ResponseBody>

    companion object {
        // Note: this is genuinely http:// (not https) upstream — see
        // network_security_config.xml for the cleartext exception this requires.
        const val PRIMARY_API_URL = "http://www.vpngate.net/api/iphone/"
        const val MIRROR_CSV_URL =
            "https://raw.githubusercontent.com/morteza-taheri/VpnM/refs/heads/master/Servers.csv"
        // Spec section 4.1.2 — served over https, no cleartext exception needed.
        const val HTML_URL = "https://www.vpngate.net/en/"
    }
}
