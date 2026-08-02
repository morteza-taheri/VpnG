package com.vpng.app.data.repository

import com.vpng.app.data.remote.api.VpnGateApiService
import com.vpng.app.data.remote.dto.VpnGateCsvParser
import com.vpng.app.data.remote.dto.VpnGateHtmlParser
import com.vpng.app.data.remote.dto.VpnGateHtmlRow
import com.vpng.app.domain.model.ServerSource
import com.vpng.app.domain.model.VpnServer
import com.vpng.app.domain.repository.ServerRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Implements the tiered fetch strategy from spec section 4.5:
 * 1. Primary CSV API + HTML page fetched concurrently; HTML enriches the
 *    CSV-derived list with accurate per-protocol support/ports (section 4.1.2)
 * 2. Mirror CSV if primary CSV fails (HTML is skipped in this fallback path —
 *    Mirror Sites HTML, section 4.1.4, is not implemented yet, see README)
 * 3. Existing in-memory cache, if any, as a last resort
 *
 * Persistence (Room) for the cache across process death is not implemented
 * yet — this only survives within the current process lifetime.
 */
@Singleton
class VpnGateServerRepository @Inject constructor(
    private val api: VpnGateApiService
) : ServerRepository {

    private val _servers = MutableStateFlow<List<VpnServer>>(emptyList())

    override fun observeServers(): Flow<List<VpnServer>> = _servers.asStateFlow()

    override suspend fun refreshServers(): Result<List<VpnServer>> = withContext(Dispatchers.IO) {
        val primaryCsvResult = coroutineScope {
            val csvDeferred = async { fetchAndParseCsv(VpnGateApiService.PRIMARY_API_URL, ServerSource.API) }
            val htmlDeferred = async { fetchAndParseHtml() }

            val csvResult = csvDeferred.await()
            if (csvResult.isFailure) {
                htmlDeferred.cancel()
                return@coroutineScope csvResult
            }

            val htmlRows = htmlDeferred.await().getOrElse {
                // HTML is an enrichment, not a hard requirement — if it fails,
                // just fall back to CSV-only data rather than failing the
                // whole refresh.
                emptyList()
            }
            Result.success(HtmlServerMapper.merge(csvResult.getOrThrow(), htmlRows))
        }

        if (primaryCsvResult.isSuccess) {
            val servers = primaryCsvResult.getOrThrow()
            _servers.value = servers
            return@withContext Result.success(servers)
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
        Result.failure(mirrorResult.exceptionOrNull() ?: primaryCsvResult.exceptionOrNull()!!)
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
                Result.success(VpnGateHtmlParser.parse(body))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
