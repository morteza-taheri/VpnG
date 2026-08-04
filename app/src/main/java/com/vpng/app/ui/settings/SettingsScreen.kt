package com.vpng.app.ui.settings

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import vn.unlimit.softether.model.AuthMethod

@Composable
fun SettingsScreen(viewModel: SettingsViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        Text(text = "Connection", style = MaterialTheme.typography.headlineSmall)
        Text(
            text = "How to authenticate with the SoftEther server — see the module's " +
                "documented auth methods.",
            style = MaterialTheme.typography.bodySmall
        )

        PresetOption(
            selected = state.preset == CredentialsPreset.FREE_VPN_GATE,
            title = "Free VPN Gate server (default)",
            subtitle = "username=\"vpn\", password=\"vpn\", auto-detect",
            onClick = { viewModel.onPresetSelected(CredentialsPreset.FREE_VPN_GATE) }
        )
        PresetOption(
            selected = state.preset == CredentialsPreset.PAID_RADIUS,
            title = "Paid server with RADIUS",
            subtitle = "Your own username/password, plain-password auth",
            onClick = { viewModel.onPresetSelected(CredentialsPreset.PAID_RADIUS) }
        )
        PresetOption(
            selected = state.preset == CredentialsPreset.ANONYMOUS_HUB,
            title = "Anonymous hub",
            subtitle = "No credentials — hub must allow anonymous login",
            onClick = { viewModel.onPresetSelected(CredentialsPreset.ANONYMOUS_HUB) }
        )

        OutlinedTextField(
            value = state.username,
            onValueChange = viewModel::onUsernameChanged,
            label = { Text("Username") },
            enabled = state.preset != CredentialsPreset.ANONYMOUS_HUB,
            singleLine = true,
            modifier = Modifier.fillMaxWidth().padding(top = 16.dp)
        )
        OutlinedTextField(
            value = state.password,
            onValueChange = viewModel::onPasswordChanged,
            label = { Text("Password") },
            enabled = state.preset != CredentialsPreset.ANONYMOUS_HUB,
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
        )

        Text(
            text = "Auth method: ${state.authMethod.name}",
            style = MaterialTheme.typography.bodySmall,
            modifier = Modifier.padding(top = 4.dp)
        )

        Text(
            text = "Server sources",
            style = MaterialTheme.typography.headlineSmall,
            modifier = Modifier.padding(top = 24.dp)
        )
        Row(
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text("Use GitHub mirror CSV as fallback")
                Text(
                    "Off by default — only the primary API + HTML page are used unless enabled here.",
                    style = MaterialTheme.typography.bodySmall
                )
            }
            Switch(checked = state.mirrorCsvEnabled, onCheckedChange = viewModel::onMirrorCsvToggled)
        }
    }
}

@Composable
private fun PresetOption(
    selected: Boolean,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth().padding(top = 8.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            RadioButton(selected = selected, onClick = onClick)
            Column {
                Text(title, style = MaterialTheme.typography.titleSmall)
                Text(subtitle, style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}
