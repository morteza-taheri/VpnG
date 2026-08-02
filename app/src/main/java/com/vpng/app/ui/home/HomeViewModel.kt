package com.vpng.app.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vpng.app.domain.model.VpnServer
import com.vpng.app.domain.repository.ServerRepository
import com.vpng.app.vpn.adapter.AdapterResult
import com.vpng.app.vpn.adapter.SoftEtherProtocolAdapter
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val softEtherAdapter: SoftEtherProtocolAdapter,
    private val serverRepository: ServerRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<ConnectionUiState>(ConnectionUiState.Disconnected)
    val uiState: StateFlow<ConnectionUiState> = _uiState.asStateFlow()

    private val _servers = MutableStateFlow<List<VpnServer>>(emptyList())
    val servers: StateFlow<List<VpnServer>> = _servers.asStateFlow()

    private var selectedServer: VpnServer? = null

    init {
        refreshServers()
    }

    fun refreshServers() {
        viewModelScope.launch {
            serverRepository.refreshServers()
                .onSuccess { list ->
                    _servers.value = list
                    // Auto-pick the best-scoring server with a usable SoftEther
                    // endpoint until a real Servers screen (spec section 8)
                    // lets the user choose one explicitly.
                    if (selectedServer == null) {
                        selectedServer = list
                            .filter { it.softEtherEndpoint != null }
                            .maxByOrNull { it.score }
                    }
                }
                .onFailure { error ->
                    _uiState.value = ConnectionUiState.Error(error.message ?: "Failed to load server list")
                }
        }
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
