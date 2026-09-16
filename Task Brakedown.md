# Node-Print Task Breakdown

This document provides a comprehensive task breakdown for the `node-print` project, mapped exactly to the architectural decisions and MVP milestones defined in the project plan. 

## 0. Initial Setup & Foundation
- [x] Initialize Git repository
- [x] Create `main` branch
- [x] Connect to GitHub repository (`AsithaLKonara/PrinterBridge`)

## 1. Monorepo Scaffolding (pnpm + Turborepo)
- [x] **Workspace & Tooling**
  - [x] Initialize `package.json` at root
  - [x] Setup `pnpm-workspace.yaml`
  - [x] Create `turbo.json` with pipeline rules (build, lint, dev, test)
  - [x] Setup base `tsconfig.json`
  - [x] Configure ESLint & Prettier
- [ ] **Scaffold Applications (`apps/`)**
  - [x] `apps/bridge`: The local Node.js print bridge server
  - [ ] `apps/demo`: Next.js POS demo application
  - [x] `apps/playground`: Testing playground
- [x] **Scaffold Packages (`packages/`)**
  - [x] `packages/types`: Shared TypeScript interfaces
  - [x] `packages/protocol`: Message schemas and API protocol
  - [x] `packages/client`: Browser/Node SDK
  - [x] `packages/server`: Server-side utilities
  - [x] `packages/escpos`: ESC/POS command builder
  - [x] `packages/html`: HTML rendering engine
- [x] **Scaffold Additional Directories**
  - [x] `native/printer`: OS-level printer integration
  - [x] `examples/`: (nextjs, express, nestjs, react, vanilla, spring-boot)
  - [x] `docs/`: Documentation folder
  - [x] `tests/`: (unit, integration, e2e)
  - [x] `scripts/`: Helper scripts
  - [x] `.github/workflows/`: CI pipelines

## Phase 0: API Design (No Implementation)
- [x] **Define Type Models (`packages/types`)**
  - [x] `Printer` model (id, name, status, type, connection, isDefault)
  - [x] `Job` model (id, status - queued/processing/completed/failed/retrying)
  - [x] `PrintRequest` payload schemas
- [x] **Define Network Protocol (`packages/protocol`)**
  - [x] Node Print Protocol (NPP) v1 JSON schema
  - [x] Request/Response structures and Error models
- [x] **API Documentation**
  - [x] Create `docs/api-v1.md` covering the initial client-facing API design

## Phase 1: Printer Discovery
- [x] **Bridge Server Initialization (`apps/bridge`)**
  - [x] Setup HTTP server listening on `127.0.0.1` by default
  - [x] Implement `GET /health` endpoint
- [x] **OS Printer Integration**
  - [x] Query native OS for installed printers
  - [x] Map OS printer objects to unified `Printer` model
- [x] **API Endpoints**
  - [x] Implement `GET /printers` returning the list of available printers
- [x] **Basic CLI (`node-print`)**
  - [x] Setup CLI entry point
  - [x] Implement `node-print printers` command

## Phase 2: Raw Printing (Hardware Milestone)
- [x] **Print Endpoint**
  - [x] Implement `POST /print`
  - [x] Handle `type: "raw"` parsing
- [x] **Hardware Communication**
  - [x] Stream/Send raw bytes to physical printer via OS spooler/USB/Network
- [x] **Validation Test**
  - [x] Verify test print on a physical thermal printer

## Phase 3: ESC/POS Builder
- [x] **ESC/POS Engine (`packages/escpos`)**
  - [x] Text styling (align center/left/right, bold, size)
  - [x] Lines & columns layouts
  - [x] Raster image printing support
  - [x] QR code generation
  - [x] Barcode generation
  - [x] Cut command (`.cut()`)
- [x] **Bridge Integration**
  - [x] Update bridge to parse and process `type: "escpos"` payloads
- [x] **Validation Test**
  - [x] Test ESC/POS payload formats on both 58mm and 80mm hardware

## Phase 4: Print Queue & Job Management
- [x] **Queue Engine (`apps/bridge`)**
  - [x] Implement robust `JobManager` queue system
  - [x] State transitions: queued -> processing -> completed / failed -> retrying
  - [x] Configuration support: Retries limit (`queue.retries`)
- [x] **Job Status API**
  - [x] Implement endpoints to query job statuses (`GET /jobs/:id`)

## Phase 5: Browser SDK & Security
- [x] **Security Mechanisms (`apps/bridge`)**
  - [x] Enforce localhost binding (`127.0.0.1`)
  - [x] Implement access token validation
  - [x] Implement strict CORS / Origin validation based on config
- [x] **Client SDK (`packages/client`)**
  - [x] Create `NodePrintClient` class handling initialization
  - [x] Add `.connect()`, `.printers.list()`, `.print()`
- [x] **Real-time Events (WebSocket)**
  - [x] Implement WebSocket server in the bridge
  - [x] Implement WebSocket client in SDK for real-time events (`job.completed`, `job.failed`, `printer.offline`, `printer.online`)

## Phase 6: Next.js POS Demo
- [x] **App Development (`apps/demo`)**
  - [x] Create simple POS UI (Products, Cart, Checkout, KOT generation)
  - [x] Integrate `@asitha/node-print/client`
- [x] **Routing Implementation**
  - [x] Implement printer routing map logic in bridge (e.g., `receipt` -> Printer A, `kitchen` -> Printer B)
  - [x] SDK API `routes.set()` support
- [x] **End-to-End Validation**
  - [x] Trigger silent printing from the browser without Chrome dialog

## Phase 7: HTML Printing
- [x] **HTML Engine (`packages/html`)**
  - [x] Headless browser rendering implementation (convert HTML -> Image)
  - [x] Handle 80mm scaling/CSS constraints
- [x] **Bridge Integration**
  - [x] Add `type: "html"` to bridge endpoints
  - [x] Send generated image buffer to printer

## Phase 8: CLI + Configuration Management
- [x] **Configuration File (`node-print.config.ts`)**
  - [x] Support loading port, security settings, origins, routes, and queue config
- [x] **CLI Commands**
  - [x] `node-print start`: Start background service
  - [x] `node-print doctor`: Validation check (Bridge, Node, Printer subsystem)
  - [x] `node-print status`: Status of active bridge
  - [x] `node-print routes`: List configured routing rules

## Phase 9: Cash Drawer Support (Bonus)
- [x] **API Endpoint**
  - [x] Implement `printer.cashDrawer.open()` API command
  - [x] Send ESC/POS kick-drawer command to configured printer

## Phase 10: OS Installers
- [x] **Windows**
  - [x] Package bridge as `node-print.exe`
  - [x] Windows background service installer (Win 10/11)
- [x] **macOS**
  - [x] Launchd background daemon configuration
- [x] **Linux**
  - [x] Systemd background service configuration

## Phase 11: Testing & QA Strategy
- [x] **Unit Tests (`tests/unit`)**
  - [x] Test ESC/POS commands generation
  - [x] Test routing logic and config validation
  - [x] Test queue states
- [x] **Integration Tests (`tests/integration`)**
  - [x] Test SDK to Bridge HTTP/WebSocket communication
  - [x] Test Bridge to Printer OS abstraction
- [x] **End-to-End Tests (`tests/e2e`)**
  - [x] Run Next.js POS scenario
  - [x] Validate specific use cases: duplicate requests, printer offline, printer reconnect, queue retries, 58/80mm formats, QR/barcode scanning, cash drawer.

## Phase 12: Public Release
- [x] **Documentation (`docs/` & `README.md`)**
  - [x] Quick Start & Installation
  - [x] API Reference
  - [x] Framework guides (Next.js, Express, Vanilla)
- [ ] **CI Matrix (`.github/workflows`)**
  - [ ] Test on Node 20, 22, 24+
  - [ ] Test on Windows, macOS, Linux
- [ ] **NPM Publish**
  - [ ] Publish `@asitha/node-print` main package
  - [ ] Publish CLI `node-print`
