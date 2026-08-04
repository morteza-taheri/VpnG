package com.vpng.app.di

import android.content.Context
import com.vpng.app.vpn.adapter.SoftEtherCredentialsSettings
import com.vpng.app.vpn.adapter.SoftEtherProtocolAdapter
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object VpnModule {

    @Provides
    @Singleton
    fun provideSoftEtherProtocolAdapter(
        @ApplicationContext context: Context,
        credentialsSettings: SoftEtherCredentialsSettings
    ): SoftEtherProtocolAdapter =
        SoftEtherProtocolAdapter(context, credentialsSettings)
}
