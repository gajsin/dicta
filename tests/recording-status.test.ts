import assert from 'node:assert/strict';
import test from 'node:test';

import { getRecordingStatus } from '../src/lib/recording/status.js';

test('main recording control exposes the complete successful sequence', () => {
  assert.deepEqual(getRecordingStatus('idle', ''), {
    kind: 'idle',
    label: 'Начать запись',
  });
  assert.deepEqual(getRecordingStatus('listening', 'Слушаю'), {
    kind: 'listening',
    label: 'Слушаю',
  });
  assert.deepEqual(getRecordingStatus('transcribing', 'Распознаю…'), {
    kind: 'processing',
    label: 'Распознаю…',
  });
  assert.deepEqual(getRecordingStatus('copied', 'Скопировано'), {
    kind: 'success',
    label: 'Скопировано',
  });
});

test('legacy widget aliases map to the same visible states', () => {
  assert.equal(getRecordingStatus('recording', '').kind, 'listening');
  assert.equal(getRecordingStatus('recognizing', '').kind, 'processing');
  assert.equal(getRecordingStatus('done', '').kind, 'success');
});
