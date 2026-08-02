package com.vpng.app.ui.servers

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.vpng.app.domain.model.VpnProtocol
import com.vpng.app.domain.model.VpnServer
import com.vpng.app.ui.home.HomeViewModel
import com.vpng.app.ui.home.ServersUiState

private val PingGreen = Color(0xFF4CAF50)
private val PingYellow = Color(0xFFFFC107)
private val PingRed = Color(0xFFF44336)

@Composable
fun ServersScreen(
    viewModel: HomeViewModel,
    onServerConnectRequested: (VpnServer) -> Unit,
    onNeedsVpnConsent: () -> Unit
) {
    val state by viewModel.serversUiState.collectAsState()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text(text = "Servers", style = MaterialTheme.typography.headlineSmall)

        OutlinedTextField(
            value = state.searchQuery,
            onValueChange = viewModel::onSearchQueryChanged,
            label = { Text("Search by hostname, country, or IP") },
            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)
        )

        ProtocolFilterRow(
            selected = state.protocolFilter,
            onToggle = viewModel::onProtocolFilterToggled,
            onClear = viewModel::onClearFilters
        )

        when {
            state.isLoading && state.allServers.isEmpty() ->
                Text("Loading servers…", modifier = Modifier.padding(top = 32.dp))

            state.loadError != null && state.allServers.isEmpty() -> {
                Text("Couldn't load servers: ${state.loadError}")
                Button(onClick = viewModel::refreshServers) { Text("Retry") }
            }

            state.filteredServers.isEmpty() -> EmptyState(onClearFilters = viewModel::onClearFilters)

            else -> LazyColumn {
                items(state.filteredServers, key = { it.ip + it.hostName }) { server ->
                    ServerListItem(
                        server = server,
                        onConnectClick = {
                            if (viewModel.needsVpnConsent()) {
                                onNeedsVpnConsent()
                            } else {
                                onServerConnectRequested(server)
                            }
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun ProtocolFilterRow(
    selected: Set<VpnProtocol>,
    onToggle: (VpnProtocol) -> Unit,
    onClear: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // MS-SSTP omitted from the filter for now — spec section 4.3 derives it
        // from the OpenVPN/SoftEther TCP endpoint, not implemented yet.
        listOf(VpnProtocol.SOFTETHER, VpnProtocol.OPENVPN).forEach { protocol ->
            FilterChip(
                selected = protocol in selected,
                onClick = { onToggle(protocol) },
                label = { Text(protocol.name) }
            )
        }
        if (selected.isNotEmpty()) {
            FilterChip(selected = false, onClick = onClear, label = { Text("Clear") })
        }
    }
}

@Composable
private fun EmptyState(onClearFilters: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(top = 48.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("🔍 No servers found", style = MaterialTheme.typography.titleMedium)
        Text("Try adjusting your filters or search")
        Button(onClick = onClearFilters, modifier = Modifier.padding(top = 8.dp)) {
            Text("Clear Filters")
        }
    }
}

@Composable
private fun ServerListItem(server: VpnServer, onConnectClick: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "${flagEmoji(server.countryCode)} ${server.countryName}",
                    style = MaterialTheme.typography.titleSmall
                )
                Text(text = "Score: ${server.score}")
            }

            Text(text = server.hostName, style = MaterialTheme.typography.bodySmall)
            Text(text = server.ip, style = MaterialTheme.typography.bodySmall)

            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(text = "Ping: ${server.ping}ms", color = pingColor(server.ping))
                Text(text = "Sessions: ${server.numVpnSessions}")
            }

            ProtocolBadges(server)

            Button(
                onClick = onConnectClick,
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
            ) {
                Text("Connect")
            }
        }
    }
}

@Composable
private fun ProtocolBadges(server: VpnServer) {
    Column(modifier = Modifier.padding(top = 4.dp)) {
        server.softEtherEndpoint?.let { endpoint ->
            val udpPart = if (server.softEtherUdpSupported) " / UDP:Supported" else ""
            Text(text = "🟢 SoftEther (${endpoint.transport}:${endpoint.port}$udpPart)")
        }
        if (VpnProtocol.OPENVPN in server.supportedProtocols) {
            val tcpPart = server.openVpnTcpPort?.let { "TCP:$it" }
            val udpPart = server.openVpnUdpPort?.let { "UDP:$it" }
            val parts = listOfNotNull(tcpPart, udpPart).joinToString(" / ").ifBlank { "unknown port" }
            Text(text = "🔵 OpenVPN ($parts)")
        }
        server.sstpEndpoint?.let { endpoint ->
            Text(text = "🟠 MS-SSTP (${endpoint.transport}:${endpoint.port})")
        }
    }
}

private fun pingColor(ping: Int): Color = when {
    ping < 0 -> Color.Gray
    ping < 100 -> PingGreen
    ping < 300 -> PingYellow
    else -> PingRed
}

private fun flagEmoji(countryCode: String): String {
    if (countryCode.length != 2) return "🏳️"
    val base = 0x1F1E6
    val chars = countryCode.uppercase().map { base + (it - 'A') }
    return if (chars.all { it in 0x1F1E6..0x1F1FF }) String(Character.toChars(chars[0]) + Character.toChars(chars[1])) else "🏳️"
}
