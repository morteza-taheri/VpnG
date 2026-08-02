package com.vpng.app.ui.home

import com.vpng.app.domain.model.VpnServer

/**
 * UI state for the Home screen's connection button — see specification
 * section 7.1.3 (four states: Disconnected, Connecting, Connected, Error).
 */
sealed class ConnectionUiState {
    data object Disconnected : ConnectionUiState()
    data object Connecting : ConnectionUiState()
    data class Connected(val server: VpnServer) : ConnectionUiState()
    data class Error(val message: String) : ConnectionUiState()
}
