import test, { mock } from 'node:test';
import assert from 'node:assert';
import { printerUtils } from '../../apps/bridge/src/printJob';
import { JobManager } from '../../apps/bridge/src/JobManager';

test('JobManager - Enqueue and Complete', async () => {
  // Mock printerUtils
  mock.method(printerUtils, 'printRawData', async () => { return; });
  
  const manager = new JobManager();
  
  const events: string[] = [];
  manager.on('job.processing', () => events.push('processing'));
  manager.on('job.completed', () => events.push('completed'));

  const job = manager.enqueue('TestPrinter', Buffer.from('data'));
  assert.ok(['queued', 'processing'].includes(job.status));
  
  await new Promise(r => setTimeout(r, 100));

  const finalJob = manager.getJob(job.id);
  assert.strictEqual(finalJob?.status, 'completed');
  assert.deepStrictEqual(events, ['processing', 'completed']);
});

test('JobManager - Retries and Failure', async () => {
  let callCount = 0;
  mock.method(printerUtils, 'printRawData', async () => {
    callCount++;
    throw new Error('Printer offline');
  });

  const manager = new JobManager();
  manager.config.retriesLimit = 2;
  
  const events: string[] = [];
  manager.on('job.retrying', () => events.push('retrying'));
  manager.on('job.failed', () => events.push('failed'));

  const job = manager.enqueue('TestPrinter', Buffer.from('data'));
  
  // Job manager sleeps 2000ms between retries, wait accordingly
  await new Promise(r => setTimeout(r, 4500)); 

  const finalJob = manager.getJob(job.id);
  assert.strictEqual(finalJob?.status, 'failed');
  assert.strictEqual(finalJob?.error, 'Printer offline');
  assert.strictEqual(callCount, 3);
  assert.deepStrictEqual(events, ['retrying', 'retrying', 'failed']);
});
