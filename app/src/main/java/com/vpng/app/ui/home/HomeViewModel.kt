package com.vpng.app.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vpng.app.domain.model.VpnProtocol
import com.vpng.app.domain.model.VpnServer
import com.vpng.app.domain.repository.ServerRepository
import com.vpng.app.vpn.adapter.AdapterResult
import com.vpng.app.vpn.adapter.SoftEtherProtocolAdapter
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ServersUiState(
    val allServers: List<VpnServer> = emptyList(),
    val searchQuery: String = "",
    val protocolFilter: Set<VpnProtocol> = emptySet(), // empty = no filter, show all
    val isLoading: Boolean = false,
    val loadError: String? = null
) {
    // Default sort: Score descending — spec section 8.1.4.
    val filteredServers: List<VpnServer> by lazy {
        allServers
            .filter { server ->
                val matchesQuery = searchQuery.isBlank() ||
                    server.hostName.contains(searchQuery, ignoreCase = true) ||
                    server.countryName.contains(searchQuery, ignoreCase = true) ||
                    server.ip.contains(searchQuery, ignoreCase = true)
                val matchesProtocol = protocolFilter.isEmpty() ||
                    server.supportedProtocols.any { it in protocolFilter }
                matchesQuery && matchesProtocol
            }
            .sortedByDescending { it.score }
    }
}

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val softEtherAdapter: SoftEtherProtocolAdapter,
    private val serverRepository: ServerRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<ConnectionUiState>(ConnectionUiState.Disconnected)
    val uiState: StateFlow<ConnectionUiState> = _uiState.asStateFlow()

    private val _servers = MutableStateFlow<List<VpnServer>>(emptyList())
    private val _searchQuery = MutableStateFlow("")
    private val _protocolFilter = MutableStateFlow<Set<VpnProtocol>>(emptySet())
    private val _isLoading = MutableStateFlow(false)
    private val _loadError = MutableStateFlow<String?>(null)

    val serversUiState: StateFlow<ServersUiState> = combine(
        _servers, _searchQuery, _protocolFilter, _isLoading, _loadError
    ) { servers, query, protocolFilter, isLoading, error ->
        ServersUiState(servers, query, protocolFilter, isLoading, error)
    }.stateIn(
        scope = viewModelScope,
        started = kotlinx.coroutines.flow.SharingStarted.WhileSubscribed(5000),
        initialValue = ServersUiState()
    )

    // Server currently chosen for the next/active connection — either
    // auto-picked (see refreshServers) or manually selected from the
    // Servers screen (see selectServer).
    private var selectedServer: VpnServer? = null

    init {
        refreshServers()
    }

    fun refreshServers() {
        viewModelScope.launch {
            _isLoading.value = true
            serverRepository.refreshServers()
                .onSuccess { list ->
                    _servers.value = list
                    _loadError.value = null
                    // Auto-pick the best-scoring server with a usable SoftEther
                    // endpoint if the user hasn't manually chosen one yet.
                    if (selectedServer == null) {
                        selectedServer = list
                            .filter { it.softEtherEndpoint != null }
                            .maxByOrNull { it.score }
                    }
                }
                .onFailure { error ->
                    _loadError.value = error.message ?: "Failed to load server list"
                }
            _isLoading.value = false
        }
    }

    fun onSearchQueryChanged(query: String) {
        _searchQuery.value = query
    }

    fun onProtocolFilterToggled(protocol: VpnProtocol) {
        _protocolFilter.value = _protocolFilter.value.toMutableSet().apply {
            if (!add(protocol)) remove(protocol)
        }
    }

    fun onClearFilters() {
        _searchQuery.value = ""
        _protocolFilter.value = emptySet()
    }

    /** Called from the Servers screen when the user taps Connect on a specific server. */
    fun selectServerAndConnect(server: VpnServer) {
        selectedServer = server
        connect()
    }

    /** Returns true if the caller should launch VpnService.prepare()'s intent for consent first. */
    fun needsVpnConsent(): Boolean = !softEtherAdapter.hasVpnPermission()

    fun onConnectToggle() {
        when (_uiState.value) {
            is ConnectionUiState.Disconnected, is ConnectionUiState.Error -> connect()
            is ConnectionUiState.Connecting, is ConnectionUiState.Connected -> disconnect()
        }
    }

    private fun connect() {
        val server = selectedServer
        if (server == null) {
            _uiState.value = ConnectionUiState.Error("No server available yet — try again in a moment")
            return
        }

        _uiState.value = ConnectionUiState.Connecting
        viewModelScope.launch {
            when (val result = softEtherAdapter.connect(server)) {
                is AdapterResult.Connected -> _uiState.value = ConnectionUiState.Connected(server)
                is AdapterResult.Failed -> _uiState.value = ConnectionUiState.Error(result.reason)
            }
        }
    }

    private fun disconnect() {
        viewModelScope.launch {
            softEtherAdapter.disconnect()
            _uiState.value = ConnectionUiState.Disconnected
        }
    }
}
