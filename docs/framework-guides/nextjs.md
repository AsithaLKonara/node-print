# Next.js App Router Guide

Node-Print integrates flawlessly with Next.js, allowing your cloud-hosted React application to print directly to the cashier's local hardware without prompting the browser dialog.

## 1. Setup

Install the SDK in your Next.js project:

```bash
npm i @asitha/node-print-client
```

## 2. Global Client Initialization

Create a singleton client instance that can be reused across your application.

```typescript
// lib/printer.ts
import { NodePrintClient } from '@asitha/node-print-client';

export const printerClient = new NodePrintClient({
  url: 'http://127.0.0.1:18181', // Assumes bridge is running on the POS terminal
  token: process.env.NEXT_PUBLIC_PRINTER_TOKEN
});
```

## 3. Server Actions vs Client Components

Because the target printers exist on the **Local Network/Host Machine** (127.0.0.1) of the cashier, you **MUST** execute the print requests from the **Client Component**, not the Next.js Server Component. 

A Next.js server runs in the cloud; it cannot reach `127.0.0.1` on the user's laptop.

```tsx
// app/checkout/page.tsx
'use client'

import { useState } from 'react';
import { printerClient } from '@/lib/printer';
import { EscPosBuilder } from '@asitha/node-print-client';

export default function CheckoutPage() {
  const [printing, setPrinting] = useState(false);

  const handleCheckout = async () => {
    setPrinting(true);
    try {
      // 1. Build receipt
      const payload = new EscPosBuilder()
        .align('center')
        .bold(true)
        .text('RECEIPT')
        .feed(1)
        .columns(['Total', '$99.99'], [24, 16])
        .cut()
        .build();

      // 2. Dispatch job directly from browser to localhost bridge
      await printerClient.print({
        type: 'escpos',
        printer: 'receipt', // Using dynamic routing mapped in bridge
        data: payload
      });
      
      alert('Printing initiated successfully!');
    } catch (e) {
      alert('Failed to connect to local printer bridge.');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <button disabled={printing} onClick={handleCheckout}>
      {printing ? 'Printing...' : 'Checkout & Print'}
    </button>
  );
}
```

## 4. Hardware Selection UI

You can build a settings page to let cashiers select which printer should be mapped to which function.

```tsx
// app/settings/page.tsx
'use client'

import { useEffect, useState } from 'react';
import { printerClient } from '@/lib/printer';

export default function Settings() {
  const [printers, setPrinters] = useState([]);

  useEffect(() => {
    // Fetches hardware OS printers instantly!
    printerClient.printers.list().then(setPrinters);
  }, []);

  const setReceiptPrinter = async (osPrinterId: string) => {
    // Maps the abstract 'receipt' route to the physical OS printer ID
    await printerClient.routes.set('receipt', osPrinterId);
  };

  return (
    <select onChange={(e) => setReceiptPrinter(e.target.value)}>
      {printers.map(p => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  );
}
```
