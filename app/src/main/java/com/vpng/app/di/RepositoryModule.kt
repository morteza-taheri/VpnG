package com.vpng.app.di

import com.vpng.app.data.repository.VpnGateServerRepository
import com.vpng.app.domain.repository.ServerRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindServerRepository(impl: VpnGateServerRepository): ServerRepository
}
