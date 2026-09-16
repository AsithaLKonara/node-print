# Vanilla JS & HTML Guide

You don't need a heavy framework or a bundler to use Node-Print. You can easily communicate directly with the local bridge service using standard browser `fetch` requests.

## Implementation Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Vanilla POS</title>
</head>
<body>
  <h1>Local POS System</h1>
  
  <div>
    <select id="printerSelect">
      <option value="">Loading Printers...</option>
    </select>
  </div>
  
  <br>
  
  <button id="printBtn">Print Test Receipt</button>
  <button id="drawerBtn">Open Cash Drawer</button>

  <script>
    const BRIDGE_URL = 'http://127.0.0.1:18181';
    
    // 1. Load Printers on Mount
    async function fetchPrinters() {
      const res = await fetch(`${BRIDGE_URL}/printers`);
      const json = await res.json();
      
      const select = document.getElementById('printerSelect');
      select.innerHTML = '';
      
      json.data.printers.forEach(printer => {
        const opt = document.createElement('option');
        opt.value = printer.id;
        opt.innerText = printer.name;
        select.appendChild(opt);
      });
    }

    // 2. Print Raw Text
    document.getElementById('printBtn').onclick = async () => {
      const printer = document.getElementById('printerSelect').value;
      
      const payload = {
        type: 'raw',
        printer: printer,
        data: btoa('HELLO WORLD FROM BROWSER!\n\n\n\n\n') // Base64 encode raw text
      };

      const res = await fetch(`${BRIDGE_URL}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if(res.ok) alert('Printed!');
    };
    
    // 3. Open Cash Drawer
    document.getElementById('drawerBtn').onclick = async () => {
      const printer = document.getElementById('printerSelect').value;
      
      await fetch(`${BRIDGE_URL}/cash-drawer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printerId: printer })
      });
    };

    // Init
    fetchPrinters();
  </script>
</body>
</html>
```

## Using HTML Rasterization

If you want to design beautiful receipts using HTML/CSS without learning ESC/POS bytes, you can use the bridge's headless rasterizer:

```javascript
const htmlContent = `
  <div style="width: 300px; text-align: center; font-family: sans-serif;">
    <h1>My Store</h1>
    <hr>
    <p>Thanks for your purchase!</p>
    <img src="https://my-store.com/qr-code.png" width="100" />
  </div>
`;

// Encode to Base64
const base64Html = btoa(htmlContent);

// Send as type: "html"
await fetch(`${BRIDGE_URL}/print`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'html',
    printer: 'ReceiptPrinter',
    data: base64Html
  })
});
```
