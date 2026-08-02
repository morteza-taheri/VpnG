package com.vpng.app.domain.model

/**
 * Unified error-handling wrapper — see specification section 10.5.
 * Used across repository and use-case boundaries instead of throwing exceptions directly.
 */
sealed class OperationResult<out T> {
    data class Success<T>(val data: T) : OperationResult<T>()
    data class Failure(val error: AppError, val cause: Throwable? = null) : OperationResult<Nothing>()
}

sealed class AppError {
    data object NetworkUnavailable : AppError()
    data object ServerTimeout : AppError()
    data class VpnConnectionFailed(val protocol: VpnProtocol) : AppError()
    data class Unknown(val message: String) : AppError()
}
