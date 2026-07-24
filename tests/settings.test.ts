import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createDefaultSettings,
  mergeSettings,
  normalizeSettings,
  settingsForLocalStorage,
} from '../src/lib/settings/model.js';
import { loadSettingsWithRetry } from '../src/lib/settings/retry.js';
import { STT_MODELS_BY_PROVIDER } from '../src/lib/constants/models.js';

test('desktop settings hydration retries while the backend is starting', async () => {
  let attempts = 0;
  const expected = normalizeSettings({
    providerApiKeys: {
      groq: 'gsk_loaded',
    },
  });

  const loaded = await loadSettingsWithRetry(
    async () => {
      attempts += 1;
      if (attempts < 3) {
        throw new Error('backend state is not managed yet');
      }
      return expected;
    },
    [0, 0],
  );

  assert.equal(attempts, 3);
  assert.equal(loaded?.providerApiKeys.groq, 'gsk_loaded');
});

test('normalizes a legacy API key into the selected provider', () => {
  const normalized = normalizeSettings({
    apiKey: 'gsk_legacy',
    sttProvider: 'groq',
    providerApiKeys: {
      polza: '',
      openai: '',
      openrouter: '',
      groq: '',
    },
  });

  assert.equal(normalized.providerApiKeys.groq, 'gsk_legacy');
  assert.equal(normalized.apiKey, 'gsk_legacy');
});

test('merging a server snapshot propagates explicit key deletion', () => {
  const current = normalizeSettings({
    providerApiKeys: {
      polza: '',
      openai: '',
      openrouter: '',
      groq: 'gsk_saved',
    },
  });

  const merged = mergeSettings(current, {
    providerApiKeys: {
      polza: '',
      openai: '',
      openrouter: '',
      groq: '',
    },
  });

  assert.equal(merged.providerApiKeys.groq, '');
});

test('verified providers survive normalization only while their key exists', () => {
  const normalized = normalizeSettings({
    providerApiKeys: {
      groq: 'gsk_saved',
      openrouter: '',
    },
    verifiedProviders: ['groq', 'openrouter', 'unknown', 'groq'],
  } as never);

  assert.deepEqual(normalized.verifiedProviders, ['groq']);
});

test('OpenRouter defaults to a transcription-only multilingual model', () => {
  assert.equal(
    STT_MODELS_BY_PROVIDER.openrouter[0]?.value,
    'openai/gpt-4o-mini-transcribe',
  );
});

test('invalid persisted enum values fall back to production defaults', () => {
  const normalized = normalizeSettings({
    sttProvider: 'unknown',
    llmProvider: 'broken',
    postprocessMode: 'magic',
    theme: 'neon',
  } as never);
  const defaults = createDefaultSettings();

  assert.equal(normalized.sttProvider, defaults.sttProvider);
  assert.equal(normalized.llmProvider, defaults.llmProvider);
  assert.equal(normalized.postprocessMode, defaults.postprocessMode);
  assert.equal(normalized.theme, defaults.theme);
});

test('accent color is normalized as a persisted application setting', () => {
  const settings = normalizeSettings({
    accentColor: '#f97316',
    accentOpacity: 35,
  } as never);

  assert.equal(settings.accentColor, '#F97316');
  assert.equal(settings.accentOpacity, 35);
  assert.equal(
    normalizeSettings({ accentOpacity: -10 } as never).accentOpacity,
    0,
  );
  assert.equal(
    normalizeSettings({ accentOpacity: 140 } as never).accentOpacity,
    100,
  );
});

test('browser persistence never writes API secrets', () => {
  const safe = settingsForLocalStorage(
    normalizeSettings({
      apiKey: 'secret',
      providerApiKeys: {
        polza: 'p',
        openai: 'o',
        openrouter: 'r',
        groq: 'g',
      },
    }),
  );

  assert.equal(safe.apiKey, '');
  assert.deepEqual(safe.providerApiKeys, {
    polza: '',
    openai: '',
    openrouter: '',
    groq: '',
  });
});
