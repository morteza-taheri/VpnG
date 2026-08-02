package com.vpng.app.di

import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient =
        OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .build()

    // Base URL is unused since VpnGateApiService uses @Url on every call
    // (primary and mirror CSV live on different hosts), but Retrofit
    // requires one to be set.
    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit =
        Retrofit.Builder()
            .baseUrl("https://www.vpngate.net/")
            .client(okHttpClient)
            .build()

    @Provides
    @Singleton
    fun provideVpnGateApiService(
        retrofit: Retrofit
    ): com.vpng.app.data.remote.api.VpnGateApiService =
        retrofit.create(com.vpng.app.data.remote.api.VpnGateApiService::class.java)
}
