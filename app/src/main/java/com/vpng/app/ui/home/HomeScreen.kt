package com.vpng.app.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

// Colors per specification section 7.1.3
private val ColorDisconnected = Color(0xFF2196F3)
private val ColorConnecting = Color(0xFFFFC107)
private val ColorConnected = Color(0xFF4CAF50)
private val ColorError = Color(0xFFF44336)

@Composable
fun HomeScreen(
    onRequestVpnConsent: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(text = statusText(uiState), style = MaterialTheme.typography.titleMedium)

        ConnectionButton(
            uiState = uiState,
            onClick = {
                if (viewModel.needsVpnConsent()) {
                    onRequestVpnConsent()
                } else {
                    viewModel.onConnectToggle()
                }
            },
            modifier = Modifier.padding(vertical = 32.dp)
        )

        if (uiState is ConnectionUiState.Connected) {
            val server = (uiState as ConnectionUiState.Connected).server
            Text(text = "${server.hostName} · ${server.countryName}")
        }
    }
}

@Composable
private fun ConnectionButton(
    uiState: ConnectionUiState,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val color = when (uiState) {
        is ConnectionUiState.Disconnected -> ColorDisconnected
        is ConnectionUiState.Connecting -> ColorConnecting
        is ConnectionUiState.Connected -> ColorConnected
        is ConnectionUiState.Error -> ColorError
    }

    Column(
        modifier = modifier
            .size(160.dp)
            .background(color = color, shape = CircleShape)
            .clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        when (uiState) {
            is ConnectionUiState.Connecting ->
                CircularProgressIndicator(color = Color.White)
            is ConnectionUiState.Connected ->
                Icon(Icons.Filled.Check, contentDescription = "Connected", tint = Color.White)
            is ConnectionUiState.Error ->
                Icon(Icons.Filled.Warning, contentDescription = "Error", tint = Color.White)
            is ConnectionUiState.Disconnected ->
                Icon(Icons.Filled.PlayArrow, contentDescription = "Connect", tint = Color.White)
        }
    }
}

private fun statusText(state: ConnectionUiState): String = when (state) {
    is ConnectionUiState.Disconnected -> "Disconnected"
    is ConnectionUiState.Connecting -> "Connecting..."
    is ConnectionUiState.Connected -> "Connected"
    is ConnectionUiState.Error -> "Error: ${state.message}"
}
