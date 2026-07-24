<script lang="ts">
  import './SettingsPanel.css';
  import { onDestroy, untrack } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import type { SelectOption } from './ui/types';
  import type {
    AppSettings,
    AppSettingsPatch,
    ProviderApiKeys,
    ProviderId,
  } from '../utils/settings';
  import { LLM_MODELS_BY_PROVIDER, STT_MODELS_BY_PROVIDER } from '../constants/models';
  import {
    DEFAULT_HOTKEY,
    hotkeyFromKeyboardEvent,
  } from '../settings/hotkey';
  import { SettingsSaveQueue } from '../settings/SettingsSaveQueue';
  import { MicrophoneTestController } from '../settings/MicrophoneTestController.svelte';
  import { ProviderVerificationController } from '../settings/ProviderVerificationController.svelte';
  import { isProviderId, type ThemeMode } from '../settings/model';

  import GeneralTab from './settings/GeneralTab.svelte';
  import ProcessingTab from './settings/ProcessingTab.svelte';
  import ProvidersTab from './settings/ProvidersTab.svelte';
  import PersonalizationTab from './settings/PersonalizationTab.svelte';
  import SettingsSidebar from './settings/subcomponents/SettingsSidebar.svelte';
  import { resolveActualTheme } from '../utils/accentTheme';

  export type SettingsTab = 'general' | 'processing' | 'providers' | 'personalization';

  const toProviderKeyMap = (keys: ProviderApiKeys): Record<string, string> => ({
    polza: keys.polza,
    openai: keys.openai,
    openrouter: keys.openrouter,
    groq: keys.groq,
  });

  interface Props {
    hotkey?: string;
    sttProvider?: ProviderId;
    llmProvider?: ProviderId;
    apiKey?: string;
    providerApiKeys?: ProviderApiKeys;
    verifiedProviders?: ProviderId[];
    selectedModel?: string;
    selectedLanguage?: string;
    selectedDeviceId?: string;
    postprocessEnabled?: boolean;
    postprocessMode?: AppSettings['postprocessMode'];
    postprocessModel?: string;
    autostart?: boolean;
    saveHistory?: boolean;
    theme?: ThemeMode;
    accentColor?: string;
    accentOpacity?: number;
    availableDevices?: Array<{ name: string; isDefault: boolean }>;
    historyCount?: number;
    onClearHistory?: () => void;
    onSave?: (newSettings: AppSettingsPatch) => Promise<void>;
    onClose?: () => void;
  }

  let {
    hotkey = 'F9',
    sttProvider = 'groq',
    llmProvider = 'groq',
    apiKey = '',
    providerApiKeys = { groq: '', openai: '', polza: '', openrouter: '' },
    verifiedProviders = [],
    selectedModel = 'whisper-large-v3-turbo',
    selectedLanguage = 'auto',
    selectedDeviceId = '',
    postprocessEnabled = true,
    postprocessMode = 'balanced',
    postprocessModel = 'openai/gpt-oss-120b',
    autostart = true,
    saveHistory = true,
    theme = 'light',
    accentColor = '#5B5FEF',
    accentOpacity = 100,
    availableDevices = [],
    historyCount = 0,
    onClearHistory,
    onSave = async () => {},
    onClose = () => {}
  }: Props = $props();

  let activeTab = $state<SettingsTab>('general');

  // Theme & Accent State
  let localThemeMode = $state<ThemeMode>('light');
  let localAccentColor = $state('#5B5FEF');
  let localAccentOpacity = $state(100);

  const handleThemeModeChange = (mode: ThemeMode) => {
    localThemeMode = mode;
    const actual = resolveActualTheme(mode);
    document.documentElement.classList.toggle('theme-dark', actual === 'dark');
    document.documentElement.classList.toggle('theme-light', actual === 'light');
    triggerSave();
  };

  const handleAccentColorChange = (color: string, opacity: number) => {
    localAccentColor = color;
    localAccentOpacity = opacity;
    triggerSave();
  };

  // Interactive local settings state
  let localHotkey = $state('F9');
  let localDeviceId = $state('');
  let localAutostart = $state(true);
  let localSaveHistory = $state(true);

  // Single unified mode control (raw, minimal, balanced, business)
  let localEnhanceMode = $state<'raw' | 'minimal' | 'balanced' | 'business'>('raw');

  let localLlmProvider = $state<ProviderId>('groq');
  let localLlmModel = $state('openai/gpt-oss-120b');
  let localSttProvider = $state<ProviderId>('groq');
  let localSttModel = $state('whisper-large-v3-turbo');

  const providerVerification = new ProviderVerificationController({
    persist: () => persistSettingsImmediately(),
    deleteKey: async (provider) => {
      const tauriInternals =
        typeof window !== 'undefined' ? window.__TAURI_INTERNALS__ : undefined;
      if (tauriInternals?.invoke) {
        await invoke('delete_provider_api_key', { provider });
      }
    },
  });
  const providerKeyMap = $derived(toProviderKeyMap(providerVerification.keys));

  // Password mask state
  let showKeyMap = $state<Record<string, boolean>>({
    groq: false,
    polza: false,
    openai: false,
    openrouter: false
  });

  $effect(() => {
    const incoming = {
      hotkey,
      selectedDeviceId,
      autostart,
      saveHistory,
      postprocessEnabled,
      postprocessMode,
      llmProvider,
      postprocessModel,
      sttProvider,
      selectedModel,
      theme,
      accentColor,
      accentOpacity,
      verifiedProviders: [...verifiedProviders],
      providerApiKeys: {
        groq: providerApiKeys.groq ?? (sttProvider === 'groq' ? apiKey : ''),
        polza: providerApiKeys.polza ?? (sttProvider === 'polza' ? apiKey : ''),
        openai: providerApiKeys.openai ?? (sttProvider === 'openai' ? apiKey : ''),
        openrouter: providerApiKeys.openrouter ?? (sttProvider === 'openrouter' ? apiKey : ''),
      },
    };

    untrack(() => {
      localHotkey = incoming.hotkey || DEFAULT_HOTKEY;
      localDeviceId = incoming.selectedDeviceId;
      localAutostart = incoming.autostart;
      localSaveHistory = incoming.saveHistory;
      localEnhanceMode = incoming.postprocessEnabled
        ? incoming.postprocessMode
        : 'raw';
      localLlmProvider = incoming.llmProvider;
      localLlmModel = incoming.postprocessModel;
      localSttProvider = incoming.sttProvider;
      localSttModel = incoming.selectedModel;
      localThemeMode = incoming.theme;
      localAccentColor = incoming.accentColor;
      localAccentOpacity = incoming.accentOpacity;
      providerVerification.hydrate(
        incoming.providerApiKeys,
        incoming.verifiedProviders,
      );
    });
  });

  const micSelectOptions = $derived<SelectOption[]>([
    { value: '', label: 'Микрофон по умолчанию', detail: 'Системный по умолчанию' },
    ...(availableDevices || []).map(d => ({
      value: d.name,
      label: d.name,
      detail: d.isDefault ? 'Системный по умолчанию' : undefined
    }))
  ]);

  const sttProviderOptions: SelectOption[] = [
    { value: 'groq', label: 'Groq', detail: 'Быстрый STT' },
    { value: 'polza', label: 'Polza.ai', detail: 'Единый API' },
    { value: 'openai', label: 'OpenAI', detail: 'Официальный API' },
    { value: 'openrouter', label: 'OpenRouter', detail: 'Мультимодели' },
  ];

  const sttModelOptions = $derived<SelectOption[]>(
    (STT_MODELS_BY_PROVIDER[localSttProvider] || []).map(m => ({
      value: m.value,
      label: m.label,
      detail: m.detail
    }))
  );

  const llmProviderOptions: SelectOption[] = [
    { value: 'groq', label: 'Groq', detail: 'Llama 3.3 & GPT-OSS' },
    { value: 'polza', label: 'Polza.ai', detail: 'Мультимодели' },
    { value: 'openai', label: 'OpenAI', detail: 'GPT-4o' },
    { value: 'openrouter', label: 'OpenRouter', detail: 'Мультиагрегатор' },
  ];

  const llmModelOptions = $derived<SelectOption[]>(
    (LLM_MODELS_BY_PROVIDER[localLlmProvider] || []).map(m => ({
      value: m.value,
      label: m.label,
      detail: m.detail
    }))
  );

  const themeModeOptions: SelectOption[] = [
    { value: 'system', label: 'Системная', detail: 'Следовать за OS' },
    { value: 'dark', label: 'Тёмная', detail: 'Тёмное оформление' },
    { value: 'light', label: 'Светлая', detail: 'Светлое оформление' },
  ];

  const handleSttProviderChange = (newProv: string) => {
    if (!isProviderId(newProv)) return;
    localSttProvider = newProv;
    const models = STT_MODELS_BY_PROVIDER[newProv];
    if (models && models.length > 0) {
      localSttModel = models[0].value;
    }
    triggerSave();
  };

  const handleLlmProviderChange = (newProv: string) => {
    if (!isProviderId(newProv)) return;
    localLlmProvider = newProv;
    const models = LLM_MODELS_BY_PROVIDER[newProv];
    if (models && models.length > 0) {
      localLlmModel = models[0].value;
    }
    triggerSave();
  };

  const toggleShowKey = (provider: string) => {
    showKeyMap[provider] = !showKeyMap[provider];
  };

  const microphoneTest = new MicrophoneTestController(() => localDeviceId);

  // Hotkey rebind capture
  let isCapturingHotkey = $state(false);
  let hotkeyErrorMsg = $state('');

  const handleHotkeyKeyDown = (e: KeyboardEvent) => {
    if (!isCapturingHotkey) return;
    e.preventDefault();
    e.stopPropagation();

    const result = hotkeyFromKeyboardEvent(e);
    if (result.kind === 'pending') {
      return;
    }
    if (result.kind === 'error') {
      hotkeyErrorMsg = result.message;
      return;
    }

    const previousHotkey = localHotkey;
    const requestedHotkey = result.hotkey;
    localHotkey = requestedHotkey;
    isCapturingHotkey = false;
    hotkeyErrorMsg = '';
    void persistSettingsImmediately().catch((error) => {
      if (localHotkey === requestedHotkey) {
        localHotkey = previousHotkey;
      }
      hotkeyErrorMsg = String(error || 'Не удалось применить горячую клавишу');
    });
  };

  const resetHotkeyToDefault = () => {
    const previousHotkey = localHotkey;
    localHotkey = DEFAULT_HOTKEY;
    isCapturingHotkey = false;
    hotkeyErrorMsg = '';
    void persistSettingsImmediately().catch((error) => {
      if (localHotkey === DEFAULT_HOTKEY) {
        localHotkey = previousHotkey;
      }
      hotkeyErrorMsg = String(error || 'Не удалось сбросить горячую клавишу');
    });
  };

  const openDataFolder = async (): Promise<{ ok: boolean; path?: string; error?: string }> => {
    const tauriInternals = typeof window !== 'undefined' ? window.__TAURI_INTERNALS__ : undefined;
    if (tauriInternals?.invoke) {
      try {
        const resPath = await invoke<string>('open_data_folder');
        return { ok: true, path: resPath };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error
          ? err.message
          : String(err || 'Не удалось открыть папку');
        console.error('[Dicta] Failed to open data folder:', err);
        return { ok: false, error: errorMsg };
      }
    }
    return { ok: false, error: 'Работа в браузерном режиме (Tauri API недоступен)' };
  };

  let saveStatus = $state<'idle' | 'saved' | 'error'>('idle');

  const currentSettings = (): AppSettingsPatch => ({
    hotkey: localHotkey,
    selectedDeviceId: localDeviceId,
    autostart: localAutostart,
    saveHistory: localSaveHistory,
    postprocessEnabled: localEnhanceMode !== 'raw',
    postprocessMode: localEnhanceMode,
    sttProvider: localSttProvider,
    selectedModel: localSttModel,
    llmProvider: localLlmProvider,
    postprocessModel: localLlmModel,
    providerApiKeys: { ...providerVerification.keys },
    verifiedProviders: [...providerVerification.verifiedProviders],
    apiKey: providerVerification.keys[localSttProvider] || '',
    theme: localThemeMode,
    accentColor: localAccentColor,
    accentOpacity: localAccentOpacity,
  });

  const saveQueue = new SettingsSaveQueue({
    snapshot: currentSettings,
    save: async (settings) => {
      try {
        await onSave(settings);
      } catch (error) {
        console.error('[Dicta] Settings save failed:', error);
        throw error;
      }
    },
    onStatusChange: (status) => {
      saveStatus = status;
    },
  });

  const persistSettingsImmediately = () => saveQueue.flush();
  const triggerSave = () => saveQueue.request();

  onDestroy(() => {
    saveQueue.dispose();
    microphoneTest.dispose();
  });
</script>

<svelte:window onkeydown={handleHotkeyKeyDown} />

<div class="settings-layout">
  <!-- Desktop Native Left Vertical Sidebar Navigation -->
  <SettingsSidebar
    {activeTab}
    onSelectTab={(tab) => { activeTab = tab; }}
    {onClose}
  />

  <!-- Right Main Content Column -->
  <main class="settings-content-area">
    <div class="content-container">
      {#if saveStatus === 'error'}
        <div class="settings-save-error" role="alert">
          Не удалось сохранить настройки. Проверьте доступ к локальному хранилищу и повторите изменение.
        </div>
      {/if}
      {#if activeTab === 'general'}
        <GeneralTab
          {localHotkey}
          {isCapturingHotkey}
          {hotkeyErrorMsg}
          {localDeviceId}
          {micSelectOptions}
          isTestingMic={microphoneTest.isActive}
          micVolumeLevel={microphoneTest.volumeLevel}
          micTestError={microphoneTest.errorMessage}
          {localAutostart}
          onOpenDataFolder={openDataFolder}
          onStartMicTest={() => microphoneTest.start()}
          onStopMicTest={() => microphoneTest.stop()}
          onStartCapturingHotkey={() => {
            isCapturingHotkey = true;
            hotkeyErrorMsg = '';
          }}
          onCancelCapturingHotkey={() => {
            isCapturingHotkey = false;
            hotkeyErrorMsg = '';
          }}
          onResetHotkey={resetHotkeyToDefault}
          onDeviceChange={(val) => { localDeviceId = val; triggerSave(); }}
          onAutostartChange={(val) => { localAutostart = val; triggerSave(); }}
        />
      {:else if activeTab === 'processing'}
        <ProcessingTab
          {localEnhanceMode}
          {localSttProvider}
          {localSttModel}
          {localLlmProvider}
          {localLlmModel}
          {sttProviderOptions}
          {sttModelOptions}
          {llmProviderOptions}
          {llmModelOptions}
          localApiKeys={providerKeyMap}
          {saveStatus}
          onEnhanceModeChange={(mode) => { localEnhanceMode = mode; triggerSave(); }}
          onSttProviderChange={handleSttProviderChange}
          onSttModelChange={(val) => { localSttModel = val; triggerSave(); }}
          onLlmProviderChange={handleLlmProviderChange}
          onLlmModelChange={(val) => { localLlmModel = val; triggerSave(); }}
          onGoToProviders={() => { activeTab = 'providers'; }}
        />
      {:else if activeTab === 'providers'}
        <ProvidersTab
          localApiKeys={providerKeyMap}
          {showKeyMap}
          keyCheckStatus={providerVerification.statuses}
          getProviderStatusBadge={(provider) =>
            isProviderId(provider)
              ? providerVerification.badge(provider)
              : { label: 'Не подключён', statusClass: 'disconnected', state: 'disconnected' }}
          localSttProvider={localSttProvider}
          localLlmProvider={localLlmProvider}
          onCheckKey={(provider) => providerVerification.verify(provider)}
          onClearKey={(provider) => providerVerification.clear(provider)}
          onToggleKeyMask={toggleShowKey}
          onSaveKey={(provider, value) => providerVerification.save(provider, value)}
        />
      {:else if activeTab === 'personalization'}
        <PersonalizationTab
          currentThemeMode={localThemeMode}
          accentColor={localAccentColor}
          accentOpacity={localAccentOpacity}
          onThemeModeChange={handleThemeModeChange}
          onAccentColorChange={handleAccentColorChange}
        />
      {/if}
    </div>
  </main>
</div>
