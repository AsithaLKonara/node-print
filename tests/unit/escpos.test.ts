import test from 'node:test';
import assert from 'node:assert';
import { EscPosBuilder } from '../../packages/escpos/src/index';

test('EscPosBuilder - Initialization', () => {
  const builder = new EscPosBuilder();
  const buffer = builder.build();
  assert.strictEqual(buffer.length, 2);
  assert.strictEqual(buffer[0], 0x1b); // ESC
  assert.strictEqual(buffer[1], 0x40); // @
});

test('EscPosBuilder - Text & Styling', () => {
  const builder = new EscPosBuilder();
  builder.text('Hello').bold(true).align('center').cut();
  const buffer = builder.build();
  
  assert.deepStrictEqual(buffer.subarray(0, 2), Buffer.from([0x1b, 0x40])); // Init
  assert.deepStrictEqual(buffer.subarray(2, 7), Buffer.from('Hello')); // Text
  assert.deepStrictEqual(buffer.subarray(7, 10), Buffer.from([0x1b, 0x45, 1])); // Bold
  assert.deepStrictEqual(buffer.subarray(10, 13), Buffer.from([0x1b, 0x61, 1])); // Align
  assert.deepStrictEqual(buffer.subarray(13, 17), Buffer.from([0x1d, 0x56, 0x42, 0x00])); // Cut
});

test('EscPosBuilder - Columns Layout Padding', () => {
  const builder = new EscPosBuilder();
  builder.columns([
    { text: 'A', width: 5, align: 'left' },
    { text: 'B', width: 5, align: 'center' },
    { text: 'C', width: 5, align: 'right' }
  ]);
  const buffer = builder.build();
  
  // Extract just the text part (ignoring Init bytes and newline feed byte)
  const result = buffer.toString('utf8', 2, buffer.length - 1);
  
  // Left: 'A    ' (5 chars)
  // Center: '  B  ' (5 chars)
  // Right: '    C' (5 chars)
  assert.strictEqual(result, 'A      B      C');
});

test('EscPosBuilder - Columns Data Integrity', () => {
  const builder = new EscPosBuilder();
  builder.columns([
    { text: 'VeryLongText', width: 8, align: 'left' }
  ]);
  const buffer = builder.build();
  const result = buffer.toString('utf8', 2, buffer.length - 1);
  assert.strictEqual(result, 'VeryLong');
});

test('EscPosBuilder - Cash Drawer Kick', () => {
  const builder = new EscPosBuilder();
  builder.cashDrawer(5);
  const buffer = builder.build();
  assert.deepStrictEqual(buffer.subarray(2, 7), Buffer.from([0x1b, 0x70, 0x01, 0x19, 0xfa]));
});
