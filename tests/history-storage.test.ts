import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseHistoryJson,
  serializeHistory,
} from '../src/lib/history/storage.js';

test('history storage ignores malformed records and normalizes safe fields', () => {
  const items = parseHistoryJson(
    JSON.stringify([
      null,
      { id: 'missing-fields' },
      {
        id: 'valid',
        timestamp: '2026-07-24T10:00:00.000Z',
        duration: -2,
        processedText: 'Готовый текст',
      },
    ]),
  );

  assert.equal(items.length, 1);
  assert.equal(items[0].id, 'valid');
  assert.equal(items[0].duration, 0);
  assert.equal(items[0].rawText, 'Готовый текст');
});

test('history serialization round-trips valid records', () => {
  const original = [
    {
      id: 'one',
      timestamp: '2026-07-24T10:00:00.000Z',
      duration: 4,
      processedText: 'Текст',
      rawText: 'Текст',
    },
  ];

  assert.deepEqual(parseHistoryJson(serializeHistory(original)), original);
});
