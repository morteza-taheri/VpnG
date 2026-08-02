package com.vpng.app.data.repository

import com.vpng.app.data.remote.api.VpnGateApiService
import com.vpng.app.data.remote.dto.VpnGateCsvParser
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
 * Implements the tiered fetch strategy from spec section 4.5:
 * 1. Primary CSV API
 * 2. Mirror CSV (only tried here if primary fails — HTML source and Mirror
 *    Sites HTML, sections 4.1.2/4.1.4, are not implemented yet, see README)
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
        val primaryResult = fetchAndParse(VpnGateApiService.PRIMARY_API_URL, ServerSource.API)
        if (primaryResult.isSuccess) {
            val servers = primaryResult.getOrThrow()
            _servers.value = servers
            return@withContext Result.success(servers)
        }

        val mirrorResult = fetchAndParse(VpnGateApiService.MIRROR_CSV_URL, ServerSource.MIRROR_CSV)
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
        Result.failure(mirrorResult.exceptionOrNull() ?: primaryResult.exceptionOrNull()!!)
    }

    private suspend fun fetchAndParse(url: String, source: ServerSource): Result<List<VpnServer>> {
        return try {
            val response = api.fetchCsv(url)
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
}
