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

## Status

This is an early scaffold: Gradle setup, manifest, and Clean Architecture
package skeleton only. See `CHANGELOG.md` for progress.
