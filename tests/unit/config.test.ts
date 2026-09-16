import test from 'node:test';
import assert from 'node:assert';
import { loadConfig } from '../../apps/bridge/src/config';

test('Config - Fallback and Parsing', () => {
  const config = loadConfig();
  
  assert.ok(typeof config.port === 'number');
  assert.ok(Array.isArray(config.security.allowedOrigins));
  assert.ok(typeof config.queue.retries === 'number');
  assert.ok(typeof config.routes === 'object');
});
