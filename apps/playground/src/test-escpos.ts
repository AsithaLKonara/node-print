import fetch from 'node-fetch';
import { EscPosBuilder } from '@asitha/escpos';

async function testEscPosPrint() {
  const printerName = process.argv[2];
  const sizeMode = process.argv[3] || '80mm'; // '58mm' or '80mm'
  
  if (!printerName) {
    console.error('Usage: npx ts-node src/test-escpos.ts "Your_Printer_Name" [58mm|80mm]');
    process.exit(1);
  }

  const paperWidth = sizeMode === '58mm' ? 32 : 48; // Common chars per line
  
  const builder = new EscPosBuilder();
  
  builder
    .align('center')
    .size(2, 2)
    .bold(true)
    .textLine('NODE-PRINT RECEIPT')
    .size(1, 1)
    .bold(false)
    .textLine('================================================'.substring(0, paperWidth))
    .align('left')
    .textLine(`Format: ${sizeMode}`)
    .textLine('This is a test of the ESC/POS engine.')
    .feed(1)
    .columns([
      { text: 'Item 1', width: paperWidth - 10, align: 'left' },
      { text: '$10.00', width: 10, align: 'right' }
    ])
    .columns([
      { text: 'Item 2', width: paperWidth - 10, align: 'left' },
      { text: '$20.00', width: 10, align: 'right' }
    ])
    .textLine('------------------------------------------------'.substring(0, paperWidth))
    .columns([
      { text: 'TOTAL', width: paperWidth - 10, align: 'left' },
      { text: '$30.00', width: 10, align: 'right' }
    ])
    .feed(1)
    .align('center')
    .barcode('1234567890128', 'CODE128')
    .feed(1)
    .qrcode('https://github.com/AsithaLKonara/PrinterBridge', 4)
    .feed(1)
    .textLine('Thank you!')
    .cut();

  const buffer = builder.build();
  const base64Data = buffer.toString('base64');

  console.log(`Sending ${sizeMode} ESC/POS print request to ${printerName}...`);
  
  try {
    const res = await fetch('http://127.0.0.1:18181/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        printer: printerName,
        type: 'escpos',
        data: base64Data
      })
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('Print failed:', json.error);
    } else {
      console.log('Print success!', json.data);
    }
  } catch (err: any) {
    console.error('Error connecting to bridge:', err.message);
  }
}

testEscPosPrint();
