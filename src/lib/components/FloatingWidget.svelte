<script lang="ts">
  import './FloatingWidget.css';
  import AudioVisualizer from './ui/AudioVisualizer.svelte';
  import { WIDGET_CAPSULE_SIZE } from './widgetLayout';
  import { getRecordingStatus } from '../recording/status';
  import { resolveActualTheme, type ThemeMode } from '../utils/accentTheme';

  import type { WidgetState } from '../types/widget';
  export type { WidgetState };

  interface Props {
    visible?: boolean;
    widgetState?: WidgetState;
    audioLevel?: number;
    timerSeconds?: number;
    message?: string;
    targetApp?: string;
    hotkeyName?: string;
    theme?: string;
    errorActionType?: 'retry' | 'settings' | 'close';
    onStop?: () => void;
    onCancel?: () => void;
    onRetry?: () => void;
    onOpenSettings?: () => void;
    onClose?: () => void;
  }

  let {
    visible = false,
    widgetState = 'idle',
    audioLevel = 0,
    timerSeconds = 0,
    message = '',
    targetApp = '',
    hotkeyName = 'F9',
    theme = 'system',
    errorActionType = 'retry',
    onStop = () => {},
    onCancel = () => {},
    onRetry = () => {},
    onOpenSettings = () => {},
    onClose = () => {}
  }: Props = $props();

  const isListeningState = $derived(widgetState === 'listening' || widgetState === 'recording');
  const actualThemeMode = $derived(resolveActualTheme((theme || 'system') as ThemeMode));
  const recordingStatus = $derived(getRecordingStatus(widgetState, message));

  // Esc keyboard navigation inside overlay
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!visible) return;
    const isListening = widgetState === 'listening' || widgetState === 'recording';
    if (e.key === 'Escape') {
      e.preventDefault();
      if (isListening) {
        onCancel();
      } else {
        onClose();
      }
    }
  };

  const formatTimer = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if visible && widgetState !== 'idle'}
  <div class="overlay-wrapper" data-tauri-drag-region>
    <!-- Compact Desktop Surface Capsule -->
    <div
      class="overlay-capsule"
      class:theme-dark={actualThemeMode === 'dark'}
      class:theme-light={actualThemeMode === 'light'}
      class:listening={recordingStatus.kind === 'listening'}
      class:finishing={recordingStatus.kind === 'processing' && (widgetState === 'finishing' || widgetState === 'stopping')}
      class:transcribing={recordingStatus.kind === 'processing'}
      class:refining={widgetState === 'refining' || widgetState === 'enhancing'}
      class:copied={recordingStatus.kind === 'success'}
      class:cancelled={recordingStatus.kind === 'cancelled'}
      class:error={recordingStatus.kind === 'error'}
      style="--widget-capsule-width: {WIDGET_CAPSULE_SIZE.widthPx}px; --widget-capsule-height: {WIDGET_CAPSULE_SIZE.heightPx}px;"
      data-tauri-drag-region
    >
      {#key `${recordingStatus.kind}:${widgetState}`}
        <!-- STATE 1: ACTIVE RECORDING / LISTENING -->
        {#if recordingStatus.kind === 'listening'}
        <div class="capsule-content listening-content" data-tauri-drag-region>
          <!-- Group 1: Activity Indicator + Status Text -->
          <div class="status-group" data-tauri-drag-region>
            <span class="mic-dot pulse" title="Запись активна"></span>
            <span class="status-label" data-tauri-drag-region>{recordingStatus.label}</span>
          </div>

          <!-- Group 2: Audio Visualization -->
          <AudioVisualizer {visible} isListening={isListeningState} {audioLevel} />

          <!-- Group 3: Timer -->
          <span class="timer-label">{formatTimer(timerSeconds)}</span>

          <!-- Group 4: Stop Button -->
          <button
            class="stop-btn"
            onclick={onStop}
            title="Завершить запись ({hotkeyName})"
            aria-label="Завершить запись ({hotkeyName})"
          >
            <span class="stop-square"></span>
          </button>
        </div>

      <!-- UNIFIED PROCESSING STATES (finishing / transcribing / refining / copied) -->
        {:else if recordingStatus.kind === 'processing' || recordingStatus.kind === 'success'}
        <div class="capsule-content centered-content" data-tauri-drag-region>
          {#if recordingStatus.kind === 'success'}
            <span class="check-icon" aria-hidden="true">✓</span>
            <span class="status-label" data-tauri-drag-region>{recordingStatus.label}</span>
          {:else if widgetState === 'refining' || widgetState === 'enhancing'}
            <span class="sparkle-icon" aria-hidden="true">✦</span>
            <span class="status-label" data-tauri-drag-region>{recordingStatus.label}</span>
          {:else}
            <div class="spinner-icon">
              <svg viewBox="0 0 24 24" class="spin-svg">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="36 18"></circle>
              </svg>
            </div>
            <span class="status-label" data-tauri-drag-region>{recordingStatus.label}</span>
          {/if}
        </div>

      <!-- ERROR STATE -->
        {:else if recordingStatus.kind === 'error'}
        <div class="capsule-content error-content" data-tauri-drag-region>
          <span class="error-badge-icon" aria-hidden="true">!</span>
          <span class="status-label error-text" title={message} data-tauri-drag-region>
            {recordingStatus.label}
          </span>
          <div class="error-actions">
            {#if errorActionType === 'settings'}
              <button class="action-icon-btn" onclick={onRetry} title="Повторить транскрибацию" aria-label="Повторить транскрибацию">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                </svg>
              </button>
              <button class="action-icon-btn" onclick={onOpenSettings} title="Открыть настройки" aria-label="Открыть настройки">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </button>
            {:else}
              <button class="action-icon-btn" onclick={onRetry} title="Повторить транскрибацию" aria-label="Повторить транскрибацию">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                </svg>
              </button>
            {/if}
            <button class="close-icon-btn" onclick={onClose} title="Закрыть" aria-label="Закрыть">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

      <!-- CANCELLED STATE -->
        {:else if recordingStatus.kind === 'cancelled'}
        <div class="capsule-content centered-content" data-tauri-drag-region>
          <span class="info-badge-icon" aria-hidden="true">i</span>
          <span class="status-label" data-tauri-drag-region>{recordingStatus.label}</span>
        </div>
        {/if}
      {/key}
    </div>
  </div>
{/if}
