package com.vpng.client.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "vpn_servers")
data class VpnServer(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val hostName: String,
    val ipAddress: String,
    val port: Int,
    val country: String,
    val countryShort: String,
    val ping: Int,
    val score: Int,
    val lastUpdate: Long = System.currentTimeMillis()
)
