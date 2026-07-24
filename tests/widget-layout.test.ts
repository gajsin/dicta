import assert from 'node:assert/strict';
import test from 'node:test';

import { WIDGET_CAPSULE_SIZE } from '../src/lib/components/widgetLayout.js';

test('every visible widget state uses the listening capsule dimensions', () => {
  assert.deepEqual(WIDGET_CAPSULE_SIZE, {
    widthPx: 264,
    heightPx: 42,
  });
});
