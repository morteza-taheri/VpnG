package com.vpng.app.ui.settings

import androidx.lifecycle.ViewModel
import com.vpng.app.data.repository.ServerSourceSettings
import com.vpng.app.vpn.adapter.SoftEtherCredentialsSettings
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import vn.unlimit.softether.model.AuthMethod
import javax.inject.Inject

/** Three presets matching the SoftEtherClient module's documented usage patterns. */
enum class CredentialsPreset {
    FREE_VPN_GATE,   // username="vpn", password="vpn", AUTO
    PAID_RADIUS,     // user-entered username/password, PLAIN_PASSWORD
    ANONYMOUS_HUB    // empty username/password, ANONYMOUS
}

data class SettingsUiState(
    val preset: CredentialsPreset = CredentialsPreset.FREE_VPN_GATE,
    val username: String = "vpn",
    val password: String = "vpn",
    val authMethod: AuthMethod = AuthMethod.AUTO,
    val mirrorCsvEnabled: Boolean = false
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val credentialsSettings: SoftEtherCredentialsSettings,
    private val serverSourceSettings: ServerSourceSettings
) : ViewModel() {

    private val _uiState = MutableStateFlow(
        SettingsUiState(
            preset = CredentialsPreset.FREE_VPN_GATE,
            username = credentialsSettings.username,
            password = credentialsSettings.password,
            authMethod = credentialsSettings.authMethod,
            mirrorCsvEnabled = serverSourceSettings.mirrorCsvEnabled
        )
    )
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    fun onPresetSelected(preset: CredentialsPreset) {
        when (preset) {
            CredentialsPreset.FREE_VPN_GATE -> applyAndPersist(preset, "vpn", "vpn", AuthMethod.AUTO)
            CredentialsPreset.ANONYMOUS_HUB -> applyAndPersist(preset, "", "", AuthMethod.ANONYMOUS)
            CredentialsPreset.PAID_RADIUS -> {
                // Keep whatever username/password the user already typed (or
                // blank to prompt them), just switch the auth method/preset.
                val current = _uiState.value
                applyAndPersist(preset, current.username, current.password, AuthMethod.PLAIN_PASSWORD)
            }
        }
    }

    fun onUsernameChanged(value: String) {
        credentialsSettings.username = value
        _uiState.value = _uiState.value.copy(username = value)
    }

    fun onPasswordChanged(value: String) {
        credentialsSettings.password = value
        _uiState.value = _uiState.value.copy(password = value)
    }

    fun onMirrorCsvToggled(enabled: Boolean) {
        serverSourceSettings.mirrorCsvEnabled = enabled
        _uiState.value = _uiState.value.copy(mirrorCsvEnabled = enabled)
    }

    private fun applyAndPersist(preset: CredentialsPreset, username: String, password: String, authMethod: AuthMethod) {
        credentialsSettings.username = username
        credentialsSettings.password = password
        credentialsSettings.authMethod = authMethod
        _uiState.value = _uiState.value.copy(
            preset = preset,
            username = username,
            password = password,
            authMethod = authMethod
        )
    }
}
