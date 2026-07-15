package com.vpng.client.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.vpng.client.data.AppDatabase
import com.vpng.client.data.VpnServer
import com.vpng.client.network.VpnGateParser
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class VpnViewModel(application: Application) : AndroidViewModel(application) {
    private val dao = AppDatabase.getInstance(application).vpnServerDao()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    val servers: StateFlow<List<VpnServer>> = dao.getAllServers()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun refreshServers() {
        viewModelScope.launch(Dispatchers.IO) {
            _isLoading.value = true
            _error.value = null
            try {
                // 1. Fetch, parse, and filter SoftEther servers from VPNGate
                val fetchedServers = VpnGateParser.fetchAndFilterServers()
                
                if (fetchedServers.isNotEmpty()) {
                    // 2. Clear old list and save updated servers into Room database
                    dao.clearAll()
                    dao.insertAll(fetchedServers)
                } else {
                    _error.value = "No active SoftEther servers found."
                }
            } catch (e: Exception) {
                _error.value = "Error: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
}
