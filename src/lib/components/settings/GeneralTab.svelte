<script lang="ts">
  import { onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import CompactSelect from '../CompactSelect.svelte';
  import type { SelectOption } from '../ui/types';
  import Button from '../ui/Button.svelte';
  import SettingsRow from '../ui/SettingsRow.svelte';
  import HotkeyRecorder from './subcomponents/HotkeyRecorder.svelte';

  interface Props {
    localHotkey: string;
    isCapturingHotkey: boolean;
    hotkeyErrorMsg?: string;
    localDeviceId: string;
    micSelectOptions: SelectOption[];
    isTestingMic: boolean;
    micVolumeLevel: number;
    micTestError?: string;
    localAutostart: boolean;
    autostartDisabled?: boolean;
    autostartError?: string;
    onStartMicTest: () => void;
    onStopMicTest: () => void;
    onStartCapturingHotkey: () => void;
    onCancelCapturingHotkey: () => void;
    onResetHotkey: () => void;
    onDeviceChange: (id: string) => void;
    onAutostartChange: (val: boolean) => void;
    onOpenDataFolder?: () => Promise<{ ok: boolean; path?: string; error?: string }>;
  }

  let {
    localHotkey = 'F9',
    isCapturingHotkey = false,
    hotkeyErrorMsg = '',
    localDeviceId = '',
    micSelectOptions = [],
    isTestingMic = false,
    micVolumeLevel = 0,
    micTestError = '',
    localAutostart = true,
    autostartDisabled = false,
    autostartError = '',
    onStartMicTest,
    onStopMicTest,
    onStartCapturingHotkey,
    onCancelCapturingHotkey,
    onResetHotkey,
    onDeviceChange,
    onAutostartChange,
    onOpenDataFolder,
  }: Props = $props();

  let folderError = $state('');

  const handleOpenDataFolder = async () => {
    folderError = '';
    if (onOpenDataFolder) {
      const res = await onOpenDataFolder();
      if (res && !res.ok) {
        folderError = res.error || 'Не удалось открыть папку';
        setTimeout(() => { folderError = ''; }, 4000);
      }
    }
  };

  // Detect if selected device is disconnected/lost
  const isDeviceLost = $derived(
    Boolean(localDeviceId && !micSelectOptions.some((o) => o.value === localDeviceId))
  );

  // Compute enriched options list (including lost device if disconnected)
  const effectiveMicOptions = $derived.by<SelectOption[]>(() => {
    let opts = [...micSelectOptions];
    if (isDeviceLost) {
      opts.push({
        value: localDeviceId,
        label: `${localDeviceId} (Отключено)`,
        detail: 'Устройство недоступно'
      });
    }
    return opts;
  });

  // Track low volume / silence warning during mic test
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  let showSilenceWarning = $state(false);

  $effect(() => {
    if (isTestingMic) {
      if (micVolumeLevel > 3) {
        if (silenceTimer) {
          clearTimeout(silenceTimer);
          silenceTimer = null;
        }
        showSilenceWarning = false;
      } else if (!silenceTimer) {
        silenceTimer = setTimeout(() => {
          if (isTestingMic && micVolumeLevel <= 3) {
            showSilenceWarning = true;
          }
        }, 3500);
      }
    } else {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
      showSilenceWarning = false;
    }
  });

  onDestroy(() => {
    if (silenceTimer) clearTimeout(silenceTimer);
  });
</script>

<div class="tab-header">
  <h2>Основные настройки</h2>
  <p>Параметры горячей клавиши диктовки, микрофона и расположения данных</p>
</div>

<div class="settings-section">
  <!-- Hotkey row -->
  <HotkeyRecorder
    {localHotkey}
    {isCapturingHotkey}
    {hotkeyErrorMsg}
    {onStartCapturingHotkey}
    {onCancelCapturingHotkey}
    {onResetHotkey}
  />

  <!-- Microphone selection -->
  <SettingsRow
    title="Микрофон"
    description="Выберите устройство аудиоввода для записи и распознавания речи"
  >
    <div class="mic-control-block">
      <div class="mic-select-wrapper">
        <CompactSelect
          value={localDeviceId}
          options={effectiveMicOptions}
          onChange={(val) => onDeviceChange(val)}
          ariaLabel="Выбор микрофона"
        />
      </div>

      {#if isDeviceLost}
        <div class="device-lost-banner" transition:fade={{ duration: 100 }}>
          <svg viewBox="0 0 24 24" class="warn-icon" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>Выбранное устройство отключено. Используется системный микрофон.</span>
        </div>
      {/if}
    </div>
  </SettingsRow>

  <!-- Audio Level Test Row -->
  <SettingsRow
    title="Проверка звука"
    description="Говорите в микрофон: вы увидите уровень и услышите голос. Чтобы избежать эха, используйте наушники"
  >
    <div class="mic-test-row-block">
      {#if isTestingMic}
        <div class="sound-level-meter-wrapper active" transition:fade={{ duration: 100 }}>
          <div class="sound-level-track">
            <div
              class="sound-level-fill"
              style="width: {Math.min(100, Math.max(4, micVolumeLevel * 2.5))}%"
            ></div>
          </div>
          <span class="sound-level-value">{Math.round(micVolumeLevel)}%</span>
        </div>
      {/if}

      <Button
        variant="secondary"
        size="default"
        class={isTestingMic ? 'testing-active-btn mic-test-btn' : 'mic-test-btn'}
        onclick={(e) => { (e.currentTarget as HTMLElement)?.blur(); isTestingMic ? onStopMicTest() : onStartMicTest(); }}
        ariaLabel={isTestingMic ? 'Остановить проверку микрофона' : 'Проверить звук микрофона'}
      >
        {#if isTestingMic}
          Стоп
        {:else}
          <svg class="mic-btn-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
          Проверить звук
        {/if}
      </Button>

      {#if micTestError}
        <span class="mic-test-feedback error" role="alert">{micTestError}</span>
      {:else if showSilenceWarning}
        <span class="mic-test-feedback warning" role="status">
          Сигнал слишком тихий. Проверьте громкость микрофона и выбранное устройство.
        </span>
      {/if}
    </div>
  </SettingsRow>

  <!-- Autostart toggle -->
  <SettingsRow
    title="Автозапуск при старте Windows"
    description="Dicta будет автоматически запускаться в трее при входе в систему"
  >
    <div class="autostart-control-wrap">
      <Button
        variant="secondary"
        size="default"
        class="autostart-action-btn {localAutostart ? 'active' : ''}"
        disabled={autostartDisabled}
        onclick={() => onAutostartChange(!localAutostart)}
        ariaLabel="Переключить автозапуск при старте Windows"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="autostart-btn-icon" aria-hidden="true">
          <rect x="3.5" y="4" width="7.5" height="7" rx="1" />
          <rect x="13" y="4" width="7.5" height="7" rx="1" />
          <rect x="3.5" y="13" width="7.5" height="7" rx="1" />
          <rect x="13" y="13" width="7.5" height="7" rx="1" />
        </svg>
        {localAutostart ? 'Автозапуск включён' : 'Включить автозапуск'}
      </Button>
      {#if autostartError}
        <span class="autostart-error-hint">{autostartError}</span>
      {/if}
    </div>
  </SettingsRow>

  <!-- Data Location / Storage Folder row -->
  <SettingsRow
    title="Расположение данных"
    description="Хранилище конфигурации settings.json и локальных настроек"
  >
    <div class="data-action-block">
      <Button
        variant="secondary"
        size="default"
        class="folder-action-btn"
        onclick={handleOpenDataFolder}
        ariaLabel="Открыть папку в Проводнике"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="folder-btn-icon" aria-hidden="true">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        Открыть папку в Проводнике
      </Button>

      {#if folderError}
        <span class="folder-error-text">{folderError}</span>
      {/if}
    </div>
  </SettingsRow>
</div>

<style>
  .tab-header {
    margin-bottom: 16px;
  }

  .tab-header h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary, #E5E7EB);
    margin: 0 0 4px;
    letter-spacing: -0.01em;
    line-height: 28px;
  }

  .tab-header p {
    font-size: 13px;
    color: var(--text-secondary, #9CA3AF);
    margin: 0;
    line-height: 18px;
  }

  .settings-section {
    background: var(--bg-surface, #191C23);
    border: 1px solid var(--border-color, #242830);
    border-radius: var(--radius-card, 12px);
    padding: 0;
    box-shadow: none;
    overflow: hidden;
    max-width: 700px;
    width: 100%;
  }

  /* Microphone control block */
  .mic-control-block {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    width: 260px;
  }

  .mic-select-wrapper {
    width: 260px;
    flex-shrink: 0;
  }

  .mic-test-row-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    width: 260px;
  }

  .sound-level-meter-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 260px;
    opacity: 0.5;
    transition: opacity 150ms ease;
  }

  .sound-level-meter-wrapper.active {
    opacity: 1;
  }

  .sound-level-track {
    flex: 1;
    min-width: 0;
    height: 8px;
    background: var(--bg-control, #1F232B);
    border: 1px solid var(--border-color, #242830);
    border-radius: 99px;
    overflow: hidden;
    position: relative;
  }

  .sound-level-fill {
    height: 100%;
    background: var(--accent-primary, #5B5FEF);
    border-radius: 99px;
    transition: width 80ms ease-out;
  }

  .sound-level-value {
    font-size: 12px;
    font-weight: 500;
    font-family: var(--font-mono, monospace);
    color: var(--text-secondary, #9CA3AF);
    min-width: 32px;
    text-align: right;
  }

  .mic-test-feedback {
    width: 260px;
    font-size: 11px;
    line-height: 15px;
    text-align: left;
  }

  .mic-test-feedback.error {
    color: var(--danger-color, #E5484D);
  }

  .mic-test-feedback.warning {
    color: var(--warning-color, #D97706);
  }

  :global(.mic-test-btn),
  :global(.folder-action-btn),
  :global(.autostart-action-btn) {
    height: 36px !important;
    width: 260px !important;
    padding: 0 14px !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    white-space: nowrap;
    justify-content: center !important;
    box-sizing: border-box !important;
  }

  .mic-btn-icon,
  .autostart-btn-icon,
  .folder-btn-icon {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
    margin-right: 6px;
    flex-shrink: 0;
    transition: color 120ms ease, stroke 120ms ease;
  }

  :global(.autostart-action-btn.active) :global(.autostart-btn-icon) {
    color: var(--accent-text, var(--accent-primary, #FF6A00)) !important;
    stroke: var(--accent-text, var(--accent-primary, #FF6A00)) !important;
  }

  :global(.testing-active-btn) {
    width: 260px !important;
    border-color: rgba(239, 68, 68, 0.4) !important;
    color: #FF7B80 !important;
    background: rgba(239, 68, 68, 0.12) !important;
    font-weight: 600 !important;
    justify-content: center !important;
  }

  @keyframes pulseDot {
    0% { opacity: 0.4; }
    100% { opacity: 1; }
  }

  .device-lost-banner {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    color: var(--warning-color, #D97706);
    background: var(--warning-bg, rgba(217, 119, 6, 0.09));
    padding: 6px 10px;
    border-radius: var(--radius-sm, 6px);
    border: 1px solid rgba(217, 119, 6, 0.2);
  }

  .warn-icon {
    width: 14px;
    height: 14px;
    stroke: currentColor;
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    flex-shrink: 0;
  }

  /* Autostart row */
  .autostart-control-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    gap: 4px;
    width: 260px;
  }

  .autostart-error-hint {
    font-size: 11px;
    color: var(--danger-color, #E5484D);
  }

  /* Data location block */
  .data-action-block {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    width: 260px;
  }

  .folder-btn-icon {
    width: 16px;
    height: 16px;
    margin-right: 6px;
    flex-shrink: 0;
  }

  .folder-error-text {
    font-size: 11px;
    color: var(--danger-color, #E5484D);
  }
</style>
