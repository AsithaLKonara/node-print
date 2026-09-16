import test, { mock } from 'node:test';
import assert from 'node:assert';
import { osUtils, printerUtils } from '../../apps/bridge/src/printJob';
import fs from 'fs';

test('OS Spooler - Windows Execution Abstraction', async () => {
  mock.method(fs, 'writeFileSync', () => {});
  mock.method(fs, 'unlinkSync', () => {});
  
  let executedCommand = '';
  mock.method(osUtils, 'execCommand', async (cmd: string) => {
    executedCommand = cmd;
    return { stdout: '', stderr: '' };
  });

  const originalPlatform = process.platform;
  Object.defineProperty(process, 'platform', { value: 'win32' });

  try {
    await printerUtils.printRawData('MyPrinter', Buffer.from('data'));
    assert.ok(executedCommand.includes('print /d'));
    assert.ok(executedCommand.includes('MyPrinter'));
  } finally {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  }
});

test('OS Spooler - macOS/Linux Execution Abstraction', async () => {
  mock.method(fs, 'writeFileSync', () => {});
  mock.method(fs, 'unlinkSync', () => {});
  
  let executedCommand = '';
  mock.method(osUtils, 'execCommand', async (cmd: string) => {
    executedCommand = cmd;
    return { stdout: '', stderr: '' };
  });

  const originalPlatform = process.platform;
  Object.defineProperty(process, 'platform', { value: 'darwin' });

  try {
    await printerUtils.printRawData('MyPrinter', Buffer.from('data'));
    assert.ok(executedCommand.includes('lp -d "MyPrinter" -o raw'));
  } finally {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  }
});
