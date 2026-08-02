package com.vpng.app.ui

import android.net.VpnService
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.vpng.app.ui.home.HomeScreen
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    // Launches the system consent dialog from VpnService.prepare(). Result is
    // ignored here — HomeScreen re-checks needsVpnConsent() on the next tap;
    // if the user granted consent, onConnectToggle() will proceed normally.
    private val vpnConsentLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { /* no-op: re-check happens on next connect tap */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier) {
                    // TODO: NavHost with Home / Servers / Settings destinations
                    // per specification sections 6-10. Home only for now.
                    HomeScreen(
                        onRequestVpnConsent = {
                            val intent = VpnService.prepare(this)
                            if (intent != null) {
                                vpnConsentLauncher.launch(intent)
                            }
                            // If null, consent was already granted (race with
                            // needsVpnConsent() check) — nothing to launch.
                        }
                    )
                }
            }
        }
    }
}
