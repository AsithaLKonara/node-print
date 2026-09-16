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
- [ ] **ESC/POS Engine (`packages/escpos`)**
  - [ ] Text styling (align center/left/right, bold, size)
  - [ ] Lines & columns layouts
  - [ ] Raster image printing support
  - [ ] QR code generation
  - [ ] Barcode generation
  - [ ] Cut command (`.cut()`)
- [ ] **Bridge Integration**
  - [ ] Update bridge to parse and process `type: "escpos"` payloads
- [ ] **Validation Test**
  - [ ] Test ESC/POS payload formats on both 58mm and 80mm hardware

## Phase 4: Print Queue & Job Management
- [ ] **Queue Engine (`apps/bridge`)**
  - [ ] Implement robust `JobManager` queue system
  - [ ] State transitions: queued -> processing -> completed / failed -> retrying
  - [ ] Configuration support: Retries limit (`queue.retries`)
- [ ] **Job Status API**
  - [ ] Implement endpoints to query job statuses (`GET /jobs/:id`)

## Phase 5: Browser SDK & Security
- [ ] **Security Mechanisms (`apps/bridge`)**
  - [ ] Enforce localhost binding (`127.0.0.1`)
  - [ ] Implement access token validation
  - [ ] Implement strict CORS / Origin validation based on config
- [ ] **Client SDK (`packages/client`)**
  - [ ] Create `NodePrintClient` class handling initialization
  - [ ] Add `.connect()`, `.printers.list()`, `.print()`
- [ ] **Real-time Events (WebSocket)**
  - [ ] Implement WebSocket server in the bridge
  - [ ] Implement WebSocket client in SDK for real-time events (`job.completed`, `job.failed`, `printer.offline`, `printer.online`)

## Phase 6: Next.js POS Demo
- [ ] **App Development (`apps/demo`)**
  - [ ] Create simple POS UI (Products, Cart, Checkout, KOT generation)
  - [ ] Integrate `@asitha/node-print/client`
- [ ] **Routing Implementation**
  - [ ] Implement printer routing map logic in bridge (e.g., `receipt` -> Printer A, `kitchen` -> Printer B)
  - [ ] SDK API `routes.set()` support
- [ ] **End-to-End Validation**
  - [ ] Trigger silent printing from the browser without Chrome dialog

## Phase 7: HTML Printing
- [ ] **HTML Engine (`packages/html`)**
  - [ ] Headless browser rendering implementation (convert HTML -> Image)
  - [ ] Handle 80mm scaling/CSS constraints
- [ ] **Bridge Integration**
  - [ ] Add `type: "html"` to bridge endpoints
  - [ ] Send generated image buffer to printer

## Phase 8: CLI + Configuration Management
- [ ] **Configuration File (`node-print.config.ts`)**
  - [ ] Support loading port, security settings, origins, routes, and queue config
- [ ] **CLI Commands**
  - [ ] `node-print start`: Start background service
  - [ ] `node-print doctor`: Validation check (Bridge, Node, Printer subsystem)
  - [ ] `node-print status`: Status of active bridge
  - [ ] `node-print routes`: List configured routing rules

## Phase 9: Cash Drawer Support (Bonus)
- [ ] **API Endpoint**
  - [ ] Implement `printer.cashDrawer.open()` API command
  - [ ] Send ESC/POS kick-drawer command to configured printer

## Phase 10: OS Installers
- [ ] **Windows**
  - [ ] Package bridge as `node-print.exe`
  - [ ] Windows background service installer (Win 10/11)
- [ ] **macOS**
  - [ ] Launchd background daemon configuration
- [ ] **Linux**
  - [ ] Systemd background service configuration

## Phase 11: Testing & QA Strategy
- [ ] **Unit Tests (`tests/unit`)**
  - [ ] Test ESC/POS commands generation
  - [ ] Test routing logic and config validation
  - [ ] Test queue states
- [ ] **Integration Tests (`tests/integration`)**
  - [ ] Test SDK to Bridge HTTP/WebSocket communication
  - [ ] Test Bridge to Printer OS abstraction
- [ ] **End-to-End Tests (`tests/e2e`)**
  - [ ] Run Next.js POS scenario
  - [ ] Validate specific use cases: duplicate requests, printer offline, printer reconnect, queue retries, 58/80mm formats, QR/barcode scanning, cash drawer.

## Phase 12: Public Release
- [ ] **Documentation (`docs/` & `README.md`)**
  - [ ] Quick Start & Installation
  - [ ] API Reference
  - [ ] Framework guides (Next.js, Express, Vanilla)
- [ ] **CI Matrix (`.github/workflows`)**
  - [ ] Test on Node 20, 22, 24+
  - [ ] Test on Windows, macOS, Linux
- [ ] **NPM Publish**
  - [ ] Publish `@asitha/node-print` main package
  - [ ] Publish CLI `node-print`
