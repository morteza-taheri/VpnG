# VpnG

Modern Android VPN client. Full requirements in [`specification.md`](./specification.md).

## Stack
- Kotlin, Jetpack Compose (Material 3)
- Clean Architecture + MVVM, Hilt, Room, Retrofit/OkHttp, WorkManager
- minSdk 26 · targetSdk 34

## Modules
| Module | Status | Purpose |
|---|---|---|
| `:app` | scaffolded | UI, domain, data layers, unified `VpnGService` |
| `:SoftEtherClient` | pending submodule | SoftEther protocol (see spec §3.2) |
| `:vpnLib` | pending submodule | OpenVPN protocol, wraps ics-openvpn (see spec §3.3) |
| `:sstpClient` | pending submodule | MS-SSTP protocol (see spec §3.4) |

## Setup

```bash
git submodule add https://github.com/hoang-rio/SoftEther-Android-Module SoftEtherClient
git submodule add https://github.com/schwabe/ics-openvpn vpnLib
git submodule add https://github.com/kittoku/Open-SSTP-Client sstpClient
```

Then uncomment the corresponding `include(...)` lines in `settings.gradle.kts`
and the `implementation(project(...))` lines in `app/build.gradle.kts`.

## License compatibility

See specification section 17 — ics-openvpn (GPLv2-or-later) is compatible with
the GPLv3-licensed SoftEther module in a combined binary.

## Known issue: vpnLib / sstpClient are apps, not libraries

Submodules are now checked out. `SoftEtherClient` is a genuine
`com.android.library` module and is wired up in `app/build.gradle.kts`.

`vpnLib` (ics-openvpn, module at `vpnLib/main`) and `sstpClient`
(Open-SSTP-Client, module at `sstpClient/app`) both use the
`com.android.application` plugin — they are standalone apps upstream, not
libraries. Gradle/AGP does not allow an `application` module to be used as a
project dependency of another `application` module, so their
`implementation(project(...))` lines are currently commented out in
`app/build.gradle.kts`.

To actually integrate them, each needs a local patch:
1. Change the plugin from `com.android.application` to `com.android.library`.
2. Remove `applicationId`, the launcher `Activity`, and any manifest entries
   that only make sense for a standalone app, keeping just the VPN
   service/tunnel logic that `ProtocolAdapter` implementations need to call.

This is real engineering work per protocol, not a one-line config fix — track
it before wiring these two into `VpnGService`.

## Status

This is an early scaffold: Gradle setup, manifest, and Clean Architecture
package skeleton only. See `CHANGELOG.md` for progress.
