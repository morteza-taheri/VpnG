package com.vpng.client.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface VpnServerDao {
    @Query("SELECT * FROM vpn_servers ORDER BY score DESC")
    fun getAllServers(): Flow<List<VpnServer>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(servers: List<VpnServer>)
    
    @Query("DELETE FROM vpn_servers")
    suspend fun clearAll()
}
