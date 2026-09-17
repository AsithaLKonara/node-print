# Changelog

## [2.0.0] - 2026-09-17

### Added
- **WebUSB Client**: Added pure browser-to-hardware printing support in `@asithakonara/node-print-client`.
- **Local Network Print Server**: Added `host` configuration to bind the Bridge service to local network IP addresses (e.g. `0.0.0.0`).
- **Cloud Polling IoT Relay**: Added background polling capabilities to the Bridge to pull jobs from a SaaS endpoint and inject them locally.
- **Integration Tests**: Added an automated end-to-end integration test suite for Cloud Polling and WebUSB mocks.

### Changed
- Bumped minimum Node version and updated all package versions to `v2.0.0`.

### Fixed
- Fixed an ESM module resolution bug (`ERR_MODULE_NOT_FOUND`) in `@asithakonara/node-print` bridge by recompiling it as CommonJS to allow direct native execution in workspaces.
