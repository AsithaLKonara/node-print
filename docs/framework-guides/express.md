# Express / Backend Integration Guide

If your backend is running on an intranet, POS appliance, or local area network alongside the printers, you can use the `@asithakonara/node-print-client` directly within your Express/Fastify/NestJS servers to orchestrate hardware logic.

## 1. Setup

Install the SDK in your backend project:

```bash
npm i @asithakonara/node-print-client
```

## 2. Server Controller Example

```typescript
import express from 'express';
import { NodePrintClient, EscPosBuilder } from '@asithakonara/node-print-client';

const app = express();
app.use(express.json());

// Initialize connection to local bridge
const printerClient = new NodePrintClient({
  url: 'http://127.0.0.1:18181'
});

app.post('/api/checkout', async (req, res) => {
  const { cart, tableNumber } = req.body;
  
  try {
    // 1. Process payment & business logic...
    const orderId = db.orders.create({ cart, tableNumber });

    // 2. Generate KOT (Kitchen Order Ticket)
    const kitchenTicket = new EscPosBuilder()
      .align('center')
      .bold(true).text('KITCHEN TICKET').bold(false)
      .text(`Table: ${tableNumber}`)
      .feed(1)
      .align('left');
      
    cart.forEach(item => {
      kitchenTicket.text(`[ ] ${item.qty}x ${item.name}`);
    });
    
    kitchenTicket.cut().build();

    // 3. Dispatch to kitchen printer route
    await printerClient.print({
      type: 'escpos',
      printer: 'kitchen',
      data: kitchenTicket
    });

    res.json({ success: true, orderId });

  } catch (error) {
    console.error('Failed to dispatch kitchen ticket', error);
    res.status(500).json({ error: 'Order failed' });
  }
});

app.listen(8080);
```

## Considerations

- When executing prints from a Node backend, the bridge service must be reachable from the server's network. If the backend is running in AWS/Vercel, it cannot reach a printer bridge on a store's local 192.168.x.x network. In cloud architectures, use the **Next.js/Client-side** integration instead.
