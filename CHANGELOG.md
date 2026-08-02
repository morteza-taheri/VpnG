# Changelog

All notable changes to this project are documented here.

## [0.1.0] - 2026-08-02
### Added
- Initial project scaffold: root Gradle config, `:app` module setup
- Clean Architecture package skeleton (`data`, `domain`, `ui`, `vpn`, `di`)
- Unified `VpnGService` and `ProtocolAdapter` contract (spec §3.7)
- `VpnServer` / `OperationResult` domain models (spec §4.4, §10.5)
- AndroidManifest with permissions per spec §2.2 (POST_NOTIFICATIONS, FOREGROUND_SERVICE_SPECIAL_USE)
- README, .gitignore, ProGuard placeholder
