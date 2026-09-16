import fetch from 'node-fetch';

async function testRawPrint() {
  const printerName = process.argv[2];
  
  if (!printerName) {
    console.error('Usage: ts-node src/test-raw.ts "Your_Printer_Name"');
    console.error('You can list printers by running `npx ts-node ../bridge/src/cli.ts printers`');
    process.exit(1);
  }

  // A simple raw string (this works for many thermal printers, or it just prints text directly)
  // For ESC/POS, we could send specific hex bytes. Let's just send "Hello World\n\n\n"
  const rawString = "Hello from node-print!\\n\\n\\n";
  const base64Data = Buffer.from(rawString).toString('base64');

  console.log(`Sending print request to ${printerName}...`);
  
  try {
    const res = await fetch('http://127.0.0.1:18181/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        printer: printerName,
        type: 'raw',
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

testRawPrint();
