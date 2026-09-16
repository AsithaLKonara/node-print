"use client";

import React, { useState, useEffect, useRef } from 'react';
import { NodePrintClient } from '@asitha/client';
import { EscPosBuilder } from '@asitha/escpos';

const PRODUCTS = [
  { id: 1, name: 'Espresso', price: 3.50 },
  { id: 2, name: 'Latte', price: 4.50 },
  { id: 3, name: 'Cappuccino', price: 4.50 },
  { id: 4, name: 'Croissant', price: 2.75 },
  { id: 5, name: 'Muffin', price: 3.00 },
];

export default function POSDemo() {
  const [cart, setCart] = useState<{ id: number; name: string; price: number; qty: number }[]>([]);
  const [connected, setConnected] = useState(false);
  const [printers, setPrinters] = useState<any[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState(false);
  
  const clientRef = useRef<NodePrintClient | null>(null);

  useEffect(() => {
    // Initialize NodePrint Client
    const client = new NodePrintClient({ url: 'http://127.0.0.1:18181' });
    clientRef.current = client;

    client.on('connected', () => {
      setConnected(true);
      client.printers.list().then(list => {
        setPrinters(list);
        if (list.length > 0) {
          // Select default printer if exists, else first
          const def = list.find((p: any) => p.isDefault);
          setSelectedPrinter(def ? def.id : list[0].id);
        }
      }).catch(console.error);
    });

    client.on('job.completed', (job) => {
      console.log('Print job completed:', job);
      setIsPrinting(false);
      setCart([]);
      alert("Receipt printed successfully!");
    });

    client.on('job.failed', (job) => {
      console.error('Print job failed:', job);
      setIsPrinting(false);
      alert("Print failed: " + job.error);
    });

    client.connect();
    
    // Attempt standard fetch in case websocket doesn't connect instantly
    client.printers.list().then(list => {
      setPrinters(list);
      if (list.length > 0 && !selectedPrinter) {
        const def = list.find((p: any) => p.isDefault);
        setSelectedPrinter(def ? def.id : list[0].id);
      }
    }).catch(() => {});

  }, []);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleCheckout = async () => {
    if (!clientRef.current || !selectedPrinter || cart.length === 0) return;
    setIsPrinting(true);

    // Build Receipt using EscPosBuilder
    const builder = new EscPosBuilder();
    builder
      .align('center')
      .bold(true)
      .size(2, 2)
      .textLine('NODE-PRINT POS')
      .size(1, 1)
      .bold(false)
      .textLine('123 Coffee Street, Tech City')
      .feed(1)
      .align('left')
      .textLine('------------------------------------------------') // 48 chars (80mm)
      .textLine('QTY   ITEM                             PRICE    ');

    cart.forEach(item => {
      const qtyStr = item.qty.toString().padEnd(6, ' ');
      const nameStr = item.name.padEnd(30, ' ');
      const priceStr = `$${(item.price * item.qty).toFixed(2)}`.padStart(12, ' ');
      builder.textLine(`${qtyStr}${nameStr}${priceStr}`);
    });

    builder
      .textLine('------------------------------------------------')
      .bold(true)
      .textLine(`TOTAL: $${total.toFixed(2)}`.padStart(48, ' '))
      .bold(false)
      .feed(1)
      .align('center')
      .barcode(Date.now().toString().slice(-12), 'CODE128') // Demo barcode
      .feed(1)
      .qrcode('https://github.com/AsithaLKonara/PrinterBridge', 4)
      .feed(1)
      .textLine('Thank you for your business!')
      .cut();

    const base64Data = builder.build().toString('base64');

    try {
      await clientRef.current.print({
        printer: selectedPrinter,
        type: 'escpos',
        data: base64Data
      });
      // The websocket event will handle UI reset
    } catch (e: any) {
      console.error(e);
      alert('Failed to send print job: ' + e.message);
      setIsPrinting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <div className="status-bar">
        <h2>Node-Print POS</h2>
        <div>
          <span className={`badge ${connected ? '' : 'offline'}`}>
            {connected ? 'Bridge Connected' : 'Bridge Offline'}
          </span>
          <select 
            style={{ marginLeft: '1rem', padding: '0.25rem', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
            value={selectedPrinter} 
            onChange={(e) => setSelectedPrinter(e.target.value)}
          >
            <option value="">Select Printer...</option>
            {printers.map(p => (
              <option key={p.id} value={p.id}>{p.name} {p.isDefault ? '(Default)' : ''}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="container">
        <main className="main">
          <div className="product-grid">
            {PRODUCTS.map(p => (
              <div key={p.id} className="product-card" onClick={() => addToCart(p)}>
                <h3>{p.name}</h3>
                <p>${p.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </main>
        
        <aside className="sidebar">
          <h2>Current Order</h2>
          {cart.length === 0 ? (
            <p style={{ color: 'var(--text-dim)' }}>Cart is empty.</p>
          ) : (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <span>{item.qty}x {item.name}</span>
                  <span>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="cart-total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          
          <button 
            className="btn" 
            disabled={cart.length === 0 || !selectedPrinter || isPrinting}
            onClick={handleCheckout}
          >
            {isPrinting ? 'Printing...' : 'Checkout & Print'}
          </button>
        </aside>
      </div>
    </div>
  );
}
