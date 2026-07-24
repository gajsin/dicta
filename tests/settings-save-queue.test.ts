import assert from 'node:assert/strict';
import test from 'node:test';

import { SettingsSaveQueue } from '../src/lib/settings/SettingsSaveQueue.js';

const delay = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

test('debounced settings saves use the latest snapshot', async () => {
  let current = 1;
  const saved: number[] = [];
  const queue = new SettingsSaveQueue({
    snapshot: () => current,
    save: async (value) => {
      saved.push(value);
    },
    onStatusChange: () => {},
    debounceMs: 5,
  });

  queue.request();
  current = 2;
  queue.request();
  await delay(20);

  assert.deepEqual(saved, [2]);
  queue.dispose();
});

test('a save requested during an in-flight save is serialized', async () => {
  let current = 1;
  const saved: number[] = [];
  let releaseFirstSave: (() => void) | undefined;

  const queue = new SettingsSaveQueue({
    snapshot: () => current,
    save: async (value) => {
      saved.push(value);
      if (value === 1) {
        await new Promise<void>((resolve) => {
          releaseFirstSave = resolve;
        });
      }
    },
    onStatusChange: () => {},
  });

  const first = queue.flush();
  await delay(0);
  current = 2;
  const second = queue.flush();
  releaseFirstSave?.();
  await Promise.all([first, second]);

  assert.deepEqual(saved, [1, 2]);
  queue.dispose();
});

test('save failures are surfaced and update the visible status', async () => {
  const statuses: string[] = [];
  const queue = new SettingsSaveQueue({
    snapshot: () => 'snapshot',
    save: async () => {
      throw new Error('write failed');
    },
    onStatusChange: (status) => statuses.push(status),
  });

  await assert.rejects(queue.flush(), /write failed/);
  assert.equal(statuses.at(-1), 'error');
  queue.dispose();
});
