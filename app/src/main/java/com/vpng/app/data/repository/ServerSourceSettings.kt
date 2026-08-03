package com.vpng.app.data.repository

import javax.inject.Inject
import javax.inject.Singleton

/**
 * In-memory server-source settings. Not persisted yet (no DataStore/Room
 * wiring — see README/Settings screen TODO); resets on process death.
 *
 * mirrorCsvEnabled defaults to false per explicit request: the GitHub-hosted
 * mirror CSV (spec section 4.1.3) is a fallback-of-last-resort data source
 * and should require the user to opt in rather than silently being used.
 */
@Singleton
class ServerSourceSettings @Inject constructor() {
    @Volatile
    var mirrorCsvEnabled: Boolean = false
}
