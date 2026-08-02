package com.vpng.app.domain.repository

import com.vpng.app.domain.model.VpnServer
import kotlinx.coroutines.flow.Flow

/**
 * Abstraction over the tiered server-fetching strategy described in
 * specification section 4 (API -> HTML -> Mirror CSV -> Mirror Sites -> Cache).
 */
interface ServerRepository {
    fun observeServers(): Flow<List<VpnServer>>
    suspend fun refreshServers(): Result<List<VpnServer>>
}
