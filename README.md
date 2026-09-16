# Node-Print Bridge

**The Ultimate Web-to-Hardware Printing Solution for POS, Kitchen, and Kiosk Systems.**

Node-Print Bridge solves the fundamental problem of web applications attempting to communicate with local hardware printers without triggering the dreaded browser Print Dialog. It enables silent, real-time, zero-click printing from Next.js, React, Express, or Vanilla JS directly to Thermal Receipt Printers via ESC/POS, HTML rasterization, or Raw payloads.

---

## 🚀 Features

- **Zero-Click Silent Printing:** Bypass browser print dialogs instantly.
- **Universal Hardware Support:** Print to EPSON, Star, Xprinter, and all generic generic ESC/POS 58mm/80mm thermal printers over USB, Network, or OS Spooler.
- **Robust Print Queueing:** Automatic retries, offline detection, and job status tracking.
- **Dynamic Routing:** Route `receipt` jobs to the front desk and `kitchen` jobs to the back of house seamlessly.
- **Universal Payloads:** Send raw ESC/POS buffers, headless HTML to be rasterized, or use the built-in fluent ESC/POS builder.
- **Cross-Platform:** Available as a background service on Windows (EXE), macOS (Launchd), and Linux (Systemd).

---

## 📦 Installation

To start communicating with local printers, you need two things:
1. The **Bridge Service** running on the host machine connected to the printers.
2. The **Client SDK** installed in your web or Node.js application.

### 1. Install & Start the Bridge

Install the bridge globally on the target machine (the machine physically connected to the printers):

```bash
npm install -g @asitha/node-print
```

Start the background bridge service:

```bash
node-print start
```

### 2. Install the Client SDK

Install the SDK in your web application (Next.js, React, Express, etc.):

```bash
npm install @asitha/node-print-client
```

---

## ⚡ Quick Start

Once the bridge is running locally, use the client SDK to send print jobs silently from your web app.

```javascript
import { NodePrintClient, EscPosBuilder } from '@asitha/node-print-client';

// 1. Connect to the local bridge
const client = new NodePrintClient({ url: 'http://127.0.0.1:18181', token: 'optional_security_token' });

// 2. Build your receipt using the ESC/POS fluent API
const receipt = new EscPosBuilder()
  .align('center')
  .bold(true)
  .text('MY AWESOME STORE')
  .bold(false)
  .feed(1)
  .align('left')
  .text('1x Burger       $8.99')
  .text('1x Fries        $3.99')
  .feed(2)
  .barcode('123456789')
  .cut()
  .build();

// 3. Send to printer silently
const jobId = await client.print({
  type: 'escpos',
  printer: 'ReceiptPrinter_1', // OS Spooler Name
  data: receipt
});

console.log(`Print job queued! ID: ${jobId}`);
```

---

## 📚 Documentation

For deep dives, API references, and framework-specific implementations, check out our docs:

- [API Reference](./docs/api-reference.md)
- [Next.js Framework Guide](./docs/framework-guides/nextjs.md)
- [Express Framework Guide](./docs/framework-guides/express.md)
- [Vanilla JS / Node Guide](./docs/framework-guides/vanilla.md)

---

## ⚙️ Configuration

The bridge is highly configurable via `node-print.config.ts` placed in the root directory.

```typescript
export default {
  port: 18181,
  security: {
    token: 'my_secret_token',
    allowedOrigins: ['https://my-pos.com']
  },
  queue: {
    retries: 3
  },
  routes: {
    receipt: 'Front_Desk_Printer',
    kitchen: 'Kitchen_Network_Printer'
  }
};
```
