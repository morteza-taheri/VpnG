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
| `:SoftEtherClient` | wired up | SoftEther protocol (see spec §3.2) — phase 1 |
| `:vpnLib` | deferred | OpenVPN protocol (see spec §3.3) — phase 2, see "Protocol roadmap" |
| `:sstpClient` | deferred | MS-SSTP protocol (see spec §3.4) — phase 2, see "Protocol roadmap" |

## Setup

Phase 1 only needs the SoftEther submodule (already added):

```bash
git submodule update --init --recursive
```

vpnLib and sstpClient are intentionally not added yet — see "Protocol roadmap".

## License compatibility

See specification section 17 — ics-openvpn (GPLv2-or-later) is compatible with
the GPLv3-licensed SoftEther module in a combined binary.

## Protocol roadmap

Phase 1 (current): only `SoftEtherClient` is wired up — a genuine
`com.android.library` module, works as a plain project dependency.

`vpnLib` and `sstpClient` are deferred. Upstream `schwabe/ics-openvpn` and
`kittoku/Open-SSTP-Client` are both `com.android.application` projects and
can't be used as project dependencies as-is (see prior commit history for
details on why).

Confirmed via the reference project (`hoang-rio/vpngate-connector`): it
solves this by using **already-patched forks** instead of upstream directly:
- `github.com/hoang-rio/vpnLib` — forked from ics-openvpn, `apply plugin: 'com.android.library'` at repo root, includes directly as `:vpnLib`
- `github.com/hoang-rio/Open-SSTP-Client`, branch `vpngate-connector` — same idea for SSTP

When we're ready for phase 2, prefer wiring up those forks (or doing the
equivalent patch ourselves) over patching upstream from scratch.

## Status

This is an early scaffold: Gradle setup, manifest, and Clean Architecture
package skeleton only. See `CHANGELOG.md` for progress.
