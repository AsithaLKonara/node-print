import test from 'node:test';
import assert from 'node:assert';
import { NodePrintClient } from '../../packages/client/src/index';

test('Client SDK - Initialization and API calls', async () => {
  const client = new NodePrintClient({ url: 'http://127.0.0.1:18181', token: 'test_token' });
  
  // Mock global fetch for integration abstraction test
  global.fetch = async (url: any, options: any) => {
    
    // Assert auth headers are passed
    assert.strictEqual(options.headers['Authorization'], 'Bearer test_token');

    if (url.toString().includes('/printers')) {
      return {
        ok: true,
        json: async () => ({ data: { printers: [{ id: 'MockPrinter', name: 'Mock Printer' }] } })
      } as any;
    }
    if (url.toString().includes('/print')) {
      return {
        ok: true,
        json: async () => ({ data: { jobId: 'job_123', status: 'queued' } })
      } as any;
    }
    if (url.toString().includes('/routes')) {
      return {
        ok: true,
        json: async () => ({ data: { routes: { receipt: 'MockPrinter' } } })
      } as any;
    }
    
    return { ok: false } as any;
  };

  const printers = await client.printers.list();
  assert.strictEqual(printers.length, 1);
  assert.strictEqual(printers[0].name, 'Mock Printer');

  const jobId = await client.print({
    type: 'raw',
    printer: 'MockPrinter',
    data: 'base64data'
  });
  assert.strictEqual(jobId, 'job_123');

  const routes = await client.routes.list();
  assert.strictEqual(routes['receipt'], 'MockPrinter');
});
