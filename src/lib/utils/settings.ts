import { invoke } from '@tauri-apps/api/core';

import {
  createDefaultSettings,
  normalizeSettings,
  settingsForLocalStorage,
  type AppSettings,
  type AppSettingsPatch,
  type ProviderApiKeys,
  type ProviderId,
} from '../settings/model';

export type {
  AppSettings,
  AppSettingsPatch,
  ProviderApiKeys,
  ProviderId,
} from '../settings/model';

const STORAGE_KEY = 'dicta.settings';

function hasTauriRuntime(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.__TAURI_INTERNALS__?.invoke === 'function'
  );
}

export async function loadSettingsFromServer(): Promise<AppSettings | null> {
  if (!hasTauriRuntime()) {
    return null;
  }

  const loaded = await invoke<AppSettingsPatch | null>('load_settings');
  return loaded ? normalizeSettings(loaded) : null;
}

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined' || hasTauriRuntime()) {
    return createDefaultSettings();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultSettings();
    }

    return normalizeSettings(JSON.parse(raw) as AppSettingsPatch);
  } catch (error) {
    console.error('[Dicta] Failed to read local settings:', error);
    return createDefaultSettings();
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined' || hasTauriRuntime()) {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(settingsForLocalStorage(settings)),
  );
}

export function defaultSettings(): AppSettings {
  return createDefaultSettings();
}

export function keyForProvider(
  keys: ProviderApiKeys,
  provider: ProviderId,
): string {
  return keys[provider];
}
