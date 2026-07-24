import assert from 'node:assert/strict';
import test from 'node:test';

import { createAccentThemeTokens } from '../src/lib/utils/accentTheme.js';

test('accent opacity is reflected in solid and derived theme tokens', () => {
  const tokens = createAccentThemeTokens('#F97316', 35);

  assert.equal(tokens['--accent-primary'], 'rgba(249, 115, 22, 0.35)');
  assert.equal(tokens['--accent-soft'], 'rgba(249, 115, 22, 0.035)');
});

test('zero accent opacity makes every accent paint token transparent', () => {
  const tokens = createAccentThemeTokens('#F97316', 0);

  assert.equal(tokens['--accent-primary'], 'rgba(249, 115, 22, 0)');
  assert.equal(tokens['--accent-hover'], 'rgba(229, 95, 2, 0)');
  assert.equal(tokens['--focus-ring'], 'rgba(249, 115, 22, 0)');
});
