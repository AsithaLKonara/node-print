const { NodePrintWebUSBClient } = require('./packages/client/dist/webusb');

Object.defineProperty(globalThis, 'navigator', {
  value: {
    usb: {
      requestDevice: async () => ({
        vendorId: 0x04b8,
        productId: 0x0202,
        configuration: {
          interfaces: [
            {
              alternates: [
                { endpoints: [{ direction: 'out', endpointNumber: 1 }] }
              ]
            }
          ]
        },
        open: async () => console.log('[Mock USB] open()'),
        selectConfiguration: async () => console.log('[Mock USB] selectConfiguration()'),
        claimInterface: async () => console.log('[Mock USB] claimInterface()'),
        transferOut: async (ep, data) => {
          console.log(`[Mock USB] transferOut to endpoint ${ep} with ${data.byteLength} bytes`);
          return { status: 'ok' };
        },
        close: async () => console.log('[Mock USB] close()')
      })
    }
  },
  writable: true
});

async function testWebUSB() {
  console.log('[Test] Instantiating NodePrintWebUSBClient...');
  const client = new NodePrintWebUSBClient();
  
  console.log('[Test] Requesting device...');
  await client.requestDevice();
  
  console.log('[Test] Connecting to device...');
  await client.connect();
  
  console.log('[Test] Printing test payload...');
  await client.print(Buffer.from('Hello WebUSB'));
  
  console.log('✅ TEST PASSED: WebUSB client executed perfectly with the mock navigator!');
}

testWebUSB().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
