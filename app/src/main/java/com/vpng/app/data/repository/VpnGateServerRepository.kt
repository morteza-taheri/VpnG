package com.vpng.app.data.repository

import com.vpng.app.data.remote.api.VpnGateApiService
import com.vpng.app.data.remote.dto.VpnGateCsvParser
import com.vpng.app.data.remote.dto.VpnGateHtmlParser
import com.vpng.app.data.remote.dto.VpnGateHtmlRow
import com.vpng.app.domain.model.ServerSource
import com.vpng.app.domain.model.VpnServer
import com.vpng.app.domain.repository.ServerRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Implements the server-fetch strategy from spec section 4.5 — REVISED from
 * the original "fetch CSV + HTML concurrently and merge by IP" design (see
 * [VpnGateHtmlRow] doc for why): CSV and the HTML page are independent
 * requests against VPN Gate's live, constantly-rotating top-N server list,
 * so trying to cross-reference them by IP silently failed for most servers
 * in practice — most ended up with unknown OpenVPN ports and, since the
 * SoftEther port those partial matches DID get was often still wrong/stale,
 * connections failed across the board.
 *
 * Current strategy:
 * 1. HTML page (spec section 4.1.2) — PRIMARY. Self-sufficient: builds
 *    complete VpnServer objects directly, no CSV merge needed.
 * 2. Primary CSV API (spec section 4.1.1) — fallback if HTML fails. Only
 *    gives the CSV-only approximate SoftEther endpoint (see
 *    CsvServerMapper) since there's no HTML data to correct it with.
 * 3. Mirror CSV (spec section 4.1.3) — DISABLED BY DEFAULT (see
 *    ServerSourceSettings.mirrorCsvEnabled), tried only if both above fail
 *    and the user has explicitly enabled it.
 * 4. Existing in-memory cache, if any, as a last resort.
 *
 * Persistence (Room) for the cache across process death is not implemented
 * yet — this only survives within the current process lifetime.
 */
@Singleton
class VpnGateServerRepository @Inject constructor(
    private val api: VpnGateApiService,
    private val sourceSettings: ServerSourceSettings
) : ServerRepository {

    private val _servers = MutableStateFlow<List<VpnServer>>(emptyList())

    override fun observeServers(): Flow<List<VpnServer>> = _servers.asStateFlow()

    override suspend fun refreshServers(): Result<List<VpnServer>> = withContext(Dispatchers.IO) {
        val htmlResult = fetchAndParseHtml()
        if (htmlResult.isSuccess) {
            val servers = htmlResult.getOrThrow().map { HtmlServerMapper.map(it) }
            _servers.value = servers
            return@withContext Result.success(servers)
        }

        val csvResult = fetchAndParseCsv(VpnGateApiService.PRIMARY_API_URL, ServerSource.API)
        if (csvResult.isSuccess) {
            val servers = csvResult.getOrThrow()
            _servers.value = servers
            return@withContext Result.success(servers)
        }

        if (!sourceSettings.mirrorCsvEnabled) {
            val cached = _servers.value
            if (cached.isNotEmpty()) {
                return@withContext Result.success(cached)
            }
            return@withContext csvResult
        }

        val mirrorResult = fetchAndParseCsv(VpnGateApiService.MIRROR_CSV_URL, ServerSource.MIRROR_CSV)
        if (mirrorResult.isSuccess) {
            val servers = mirrorResult.getOrThrow()
            _servers.value = servers
            return@withContext Result.success(servers)
        }

        // All network sources failed — fall back to whatever's cached (may be empty).
        val cached = _servers.value
        if (cached.isNotEmpty()) {
            return@withContext Result.success(cached)
        }
        Result.failure(mirrorResult.exceptionOrNull() ?: csvResult.exceptionOrNull()!!)
    }

    private suspend fun fetchAndParseCsv(url: String, source: ServerSource): Result<List<VpnServer>> {
        return try {
            val response = api.fetchRaw(url)
            val body = response.body()?.string()
            if (!response.isSuccessful || body.isNullOrBlank()) {
                Result.failure(IllegalStateException("HTTP ${response.code()} fetching $url"))
            } else {
                val rows = VpnGateCsvParser.parse(body)
                val servers = rows.map { CsvServerMapper.map(it, source) }
                Result.success(servers)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private suspend fun fetchAndParseHtml(): Result<List<VpnGateHtmlRow>> {
        return try {
            val response = api.fetchRaw(VpnGateApiService.HTML_URL)
            val body = response.body()?.string()
            if (!response.isSuccessful || body.isNullOrBlank()) {
                Result.failure(IllegalStateException("HTTP ${response.code()} fetching HTML"))
            } else {
                val rows = VpnGateHtmlParser.parse(body)
                if (rows.isEmpty()) {
                    Result.failure(IllegalStateException("HTML parsed but found 0 server rows"))
                } else {
                    Result.success(rows)
                }
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
