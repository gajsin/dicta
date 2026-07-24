import { DEFAULT_HOTKEY } from './hotkey.js';

export const PROVIDER_IDS = ['polza', 'openai', 'openrouter', 'groq'] as const;
export type ProviderId = (typeof PROVIDER_IDS)[number];

export type PostprocessMode = 'raw' | 'minimal' | 'balanced' | 'business';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ProviderApiKeys {
  polza: string;
  openai: string;
  openrouter: string;
  groq: string;
}

export interface AppSettings {
  /** Legacy compatibility field. New code uses providerApiKeys. */
  apiKey: string;
  sttProvider: ProviderId;
  llmProvider: ProviderId;
  providerApiKeys: ProviderApiKeys;
  verifiedProviders: ProviderId[];
  selectedModel: string;
  selectedLanguage: string;
  hotkey: string;
  postprocessEnabled: boolean;
  postprocessMode: PostprocessMode;
  postprocessModel: string;
  selectedDeviceId: string;
  theme: ThemeMode;
  accentColor: string;
  accentOpacity: number;
  autostart: boolean;
  saveHistory: boolean;
}

export type AppSettingsPatch = Partial<
  Omit<AppSettings, 'providerApiKeys'>
> & {
  providerApiKeys?: Partial<ProviderApiKeys>;
};

const POSTPROCESS_MODES = new Set<PostprocessMode>([
  'raw',
  'minimal',
  'balanced',
  'business',
]);
const THEME_MODES = new Set<ThemeMode>(['light', 'dark', 'system']);
const PROVIDERS = new Set<ProviderId>(PROVIDER_IDS);

export function isProviderId(value: unknown): value is ProviderId {
  return typeof value === 'string' && PROVIDERS.has(value as ProviderId);
}

export function createDefaultProviderApiKeys(): ProviderApiKeys {
  return {
    polza: '',
    openai: '',
    openrouter: '',
    groq: '',
  };
}

export function createDefaultSettings(): AppSettings {
  return {
    apiKey: '',
    sttProvider: 'groq',
    llmProvider: 'groq',
    providerApiKeys: createDefaultProviderApiKeys(),
    verifiedProviders: [],
    selectedModel: 'whisper-large-v3-turbo',
    selectedLanguage: 'auto',
    hotkey: DEFAULT_HOTKEY,
    postprocessEnabled: false,
    postprocessMode: 'raw',
    postprocessModel: 'openai/gpt-oss-120b',
    selectedDeviceId: '',
    theme: 'light',
    accentColor: '#5B5FEF',
    accentOpacity: 100,
    autostart: false,
    saveHistory: true,
  };
}

function providerOrDefault(value: unknown, fallback: ProviderId): ProviderId {
  return isProviderId(value) ? value : fallback;
}

function stringOrDefault(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function booleanOrDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function accentColorOrDefault(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value)
    ? value.toUpperCase()
    : fallback;
}

function accentOpacityOrDefault(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(100, Math.max(0, Math.round(value)))
    : fallback;
}

export function normalizeSettings(input: AppSettingsPatch = {}): AppSettings {
  const defaults = createDefaultSettings();
  const sttProvider = providerOrDefault(input.sttProvider, defaults.sttProvider);
  const llmProvider = providerOrDefault(input.llmProvider, defaults.llmProvider);
  const inputKeys = input.providerApiKeys ?? {};
  const providerApiKeys: ProviderApiKeys = {
    polza: stringOrDefault(inputKeys.polza, ''),
    openai: stringOrDefault(inputKeys.openai, ''),
    openrouter: stringOrDefault(inputKeys.openrouter, ''),
    groq: stringOrDefault(inputKeys.groq, ''),
  };
  const legacyApiKey = stringOrDefault(input.apiKey, '').trim();

  if (legacyApiKey && !providerApiKeys[sttProvider]) {
    providerApiKeys[sttProvider] = legacyApiKey;
  }

  const verifiedProviders = Array.isArray(input.verifiedProviders)
    ? input.verifiedProviders.reduce<ProviderId[]>((verified, provider) => {
        if (
          isProviderId(provider) &&
          providerApiKeys[provider].trim() &&
          !verified.includes(provider)
        ) {
          verified.push(provider);
        }
        return verified;
      }, [])
    : [];

  const postprocessMode =
    typeof input.postprocessMode === 'string' &&
    POSTPROCESS_MODES.has(input.postprocessMode as PostprocessMode)
      ? (input.postprocessMode as PostprocessMode)
      : defaults.postprocessMode;
  const theme =
    typeof input.theme === 'string' && THEME_MODES.has(input.theme as ThemeMode)
      ? (input.theme as ThemeMode)
      : defaults.theme;

  return {
    apiKey: providerApiKeys[sttProvider] || legacyApiKey,
    sttProvider,
    llmProvider,
    providerApiKeys,
    verifiedProviders,
    selectedModel: stringOrDefault(input.selectedModel, defaults.selectedModel),
    selectedLanguage: stringOrDefault(
      input.selectedLanguage,
      defaults.selectedLanguage,
    ),
    hotkey: stringOrDefault(input.hotkey, defaults.hotkey).trim() || DEFAULT_HOTKEY,
    postprocessEnabled: booleanOrDefault(
      input.postprocessEnabled,
      defaults.postprocessEnabled,
    ),
    postprocessMode,
    postprocessModel: stringOrDefault(
      input.postprocessModel,
      defaults.postprocessModel,
    ),
    selectedDeviceId: stringOrDefault(
      input.selectedDeviceId,
      defaults.selectedDeviceId,
    ),
    theme,
    accentColor: accentColorOrDefault(input.accentColor, defaults.accentColor),
    accentOpacity: accentOpacityOrDefault(
      input.accentOpacity,
      defaults.accentOpacity,
    ),
    autostart: booleanOrDefault(input.autostart, defaults.autostart),
    saveHistory: booleanOrDefault(input.saveHistory, defaults.saveHistory),
  };
}

export function mergeSettings(
  current: AppSettings,
  patch: AppSettingsPatch,
): AppSettings {
  const sttProvider = providerOrDefault(
    patch.sttProvider,
    current.sttProvider,
  );
  const providerApiKeys = patch.providerApiKeys
    ? { ...current.providerApiKeys, ...patch.providerApiKeys }
    : { ...current.providerApiKeys };

  const apiKey =
    patch.apiKey !== undefined
      ? patch.apiKey
      : patch.providerApiKeys
        ? providerApiKeys[sttProvider]
        : current.apiKey;

  return normalizeSettings({
    ...current,
    ...patch,
    apiKey,
    sttProvider,
    providerApiKeys,
  });
}

export function settingsForLocalStorage(settings: AppSettings): AppSettings {
  return {
    ...settings,
    apiKey: '',
    providerApiKeys: createDefaultProviderApiKeys(),
  };
}
