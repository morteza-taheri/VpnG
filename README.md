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
bash scripts/patch-softether-gradle.sh
```

The patch script fixes a bug in SoftEtherClient's own `build.gradle` (missing
Kotlin plugin) that we can't commit a permanent fix for since it's a
submodule we don't have push access to — **re-run it after every
`git submodule update`**. Details in the script's own comments and the
commit that introduced it.

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

## Server data sources (spec section 4)

**Architecture note (revised):** the original design fetched the CSV API and
the HTML page concurrently and merged them by matching IP address. In
practice this failed for most servers — the CSV endpoint and the HTML page
are independent HTTP requests against VPN Gate's live, constantly-rotating
top-N server list, so the two responses frequently contain almost entirely
different servers. Matching by IP silently failed for most rows, leaving
most servers with unknown OpenVPN ports (confirmed via real device testing).

Current strategy:
1. **HTML page** (section 4.1.2) — primary. Self-sufficient: builds complete
   `VpnServer` objects directly from the page (country, sessions, ping,
   speed, score, and all per-protocol ports), no CSV merge involved.
2. **Primary CSV API** (section 4.1.1) — fallback only if the HTML fetch
   fails entirely. Gives just the CSV-only approximate SoftEther endpoint
   (see `CsvServerMapper`) since there's no HTML data to correct it with.
3. **Mirror CSV** (section 4.1.3) — disabled by default (see
   `ServerSourceSettings.mirrorCsvEnabled`), only tried if both above fail
   and the user has explicitly enabled it.
4. Existing in-memory cache, if any, as a last resort.

Not implemented: Mirror Sites HTML (section 4.1.4), Room persistence (cache
is in-memory only, lost on process death).

**HTML parser verification:** `VpnGateHtmlParser.kt` was tested against a
real saved copy of the page (BeautifulSoup port of the same algorithm) and
against the live page — 99-100/100 real server rows extract every field
correctly across three independent runs. See the parser's class doc for the
two real bugs this testing caught and fixed (duplicate table id, `<br>`
producing no whitespace in `.text()`).

## Status

This is an early scaffold: Gradle setup, manifest, and Clean Architecture
package skeleton only. See `CHANGELOG.md` for progress.
