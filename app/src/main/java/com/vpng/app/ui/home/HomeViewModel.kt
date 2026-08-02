package com.vpng.app.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vpng.app.domain.model.ServerSource
import com.vpng.app.domain.model.VpnProtocol
import com.vpng.app.domain.model.VpnServer
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
    private val softEtherAdapter: SoftEtherProtocolAdapter
) : ViewModel() {

    private val _uiState = MutableStateFlow<ConnectionUiState>(ConnectionUiState.Disconnected)
    val uiState: StateFlow<ConnectionUiState> = _uiState.asStateFlow()

    // TODO: replace with a real server chosen from ServerRepository (API/HTML/mirror
    // tiered fetch — spec section 4) once that layer is implemented. Hardcoded here
    // purely to exercise the connect/disconnect wiring end-to-end.
    private val placeholderServer = VpnServer(
        hostName = "public-vpn-1.opengw.net",
        ip = "0.0.0.0",
        countryCode = "JP",
        countryName = "Japan",
        speedMbps = 0.0,
        ping = 0,
        score = 0,
        numVpnSessions = 0,
        supportedProtocols = setOf(VpnProtocol.SOFTETHER),
        openVpnConfigBase64 = null,
        source = ServerSource.CACHE
    )

    /** Returns true if the caller should launch VpnService.prepare()'s intent for consent first. */
    fun needsVpnConsent(): Boolean = !softEtherAdapter.hasVpnPermission()

    fun onConnectToggle() {
        when (_uiState.value) {
            is ConnectionUiState.Disconnected, is ConnectionUiState.Error -> connect()
            is ConnectionUiState.Connecting, is ConnectionUiState.Connected -> disconnect()
        }
    }

    private fun connect() {
        _uiState.value = ConnectionUiState.Connecting
        viewModelScope.launch {
            when (val result = softEtherAdapter.connect(placeholderServer)) {
                is AdapterResult.Connected -> _uiState.value = ConnectionUiState.Connected(placeholderServer)
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
