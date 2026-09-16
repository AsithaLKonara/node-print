# API Reference

This document covers the complete API surface of the `@asithakonara/node-print-client` SDK and the configuration options for the Node-Print Bridge service.

---

## `NodePrintClient`

The primary class for interacting with the local print bridge.

### `new NodePrintClient(config?)`
Initializes a new connection to the bridge.

- `config.url` (string): The URL of the bridge service (Default: `http://127.0.0.1:18181`).
- `config.token` (string): Security token matching the bridge configuration.

### `client.printers.list(): Promise<Printer[]>`
Fetches all available hardware printers registered with the OS Spooler on the host machine.

**Returns:**
```typescript
Array<{
  id: string; // The exact name required for print jobs
  name: string; // Human-readable name
  isDefault: boolean;
}>
```

### `client.print(payload: PrintPayload): Promise<string>`
Dispatches a silent print job to the queue. Returns the `jobId`.

**Payload Options:**
- `type` (`"raw" | "escpos" | "html"`): The payload parsing engine.
- `printer` (string): The exact hardware printer name, OR a route name if dynamic routing is configured.
- `data` (string | Buffer): Base64 string or buffer containing the payload data.

### `client.routes.list(): Promise<Record<string, string>>`
Lists all dynamic routing rules currently active on the bridge.

### `client.routes.set(name: string, printerId: string): Promise<void>`
Dynamically updates a routing rule at runtime (e.g. mapping `receipt` to a specific OS printer based on the user's terminal selection).

### `client.cashDrawer.open(printerId: string): Promise<void>`
Instantly sends an ESC/POS pulse command to kick open a connected cash drawer.

---

## `EscPosBuilder`

A fluent, chainable API for generating exact byte-perfect ESC/POS payloads for thermal printers without dealing with raw hex codes.

```typescript
const payload = new EscPosBuilder()
  .align('center') // 'left' | 'center' | 'right'
  .bold(true)
  .text('Hello')
  .feed(2) // Feed 2 blank lines
  .columns(['Item', 'Price'], [30, 10]) // Formats perfectly padded columns
  .barcode('123456', 'CODE39')
  .qr('https://example.com')
  .cashDrawer() // Add kick-drawer signal to the receipt
  .cut() // Add paper cut signal
  .build(); // Returns Base64 string ready for client.print()
```

---

## Bridge Configuration (`node-print.config.ts`)

The bridge service behavior can be entirely overridden by placing a `node-print.config.ts` (or `.json`) file in the root directory.

```typescript
export default {
  port: 18181, // Port to bind the server to
  security: {
    token: "optional_secret_token", // Requires Bearer Auth on API calls
    allowedOrigins: ["https://mypos.example.com", "http://localhost:3000"] // Strict CORS
  },
  queue: {
    retries: 3 // How many times a failed job (e.g. offline printer) should retry
  },
  routes: {
    receipt: "EPSON_TM_T20II",
    kitchen: "STAR_TSP100"
  }
}
```
