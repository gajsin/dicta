import { emit } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import type { AppSettings } from '../settings/model';
import type { WidgetPayload } from '../services/widgetBroadcaster';
import { broadcastWidgetUpdate } from '../services/widgetBroadcaster';
import type { WidgetState } from '../types/widget';
import { resolveActualTheme } from '../utils/accentTheme';
import { getNormalizedErrorInfo } from '../utils/errors';

interface TranscriptionResult {
  rawText: string;
  processedText: string;
}

interface RecordingControllerOptions {
  isTauriRuntime: boolean;
  windowLabel: string;
  getSettings: () => AppSettings;
  onHistoryItem: (text: string, durationSec: number, rawText: string) => void;
  onOpenSettings: () => void;
}

const BUSY_STATES: WidgetState[] = [
  'finishing',
  'transcribing',
  'refining',
  'copied',
  'stopping',
  'recognizing',
  'enhancing',
  'inserting',
];

export class RecordingController {
  recording = $state(false);
  processing = $state(false);
  widgetState = $state<WidgetState>('idle');
  widgetMessage = $state('Слушаю');
  audioLevel = $state(0);
  errorActionType = $state<'retry' | 'settings' | 'close'>('retry');
  timerSeconds = $state(0);
  lastRecordingStart = $state(0);

  readonly #isTauriRuntime: boolean;
  readonly #windowLabel: string;
  readonly #getSettings: () => AppSettings;
  readonly #onHistoryItem: RecordingControllerOptions['onHistoryItem'];
  readonly #onOpenSettings: () => void;

  #timerId: number | undefined;
  #transitionTimeoutId: number | undefined;
  #lastToggleTime = 0;
  #pasteCooldownUntil = 0;

  constructor(options: RecordingControllerOptions) {
    this.#isTauriRuntime = options.isTauriRuntime;
    this.#windowLabel = options.windowLabel;
    this.#getSettings = options.getSettings;
    this.#onHistoryItem = options.onHistoryItem;
    this.#onOpenSettings = options.onOpenSettings;
  }

  broadcast(): void {
    const settings = this.#getSettings();
    broadcastWidgetUpdate(this.#windowLabel, this.#isTauriRuntime, {
      state: this.widgetState,
      message: this.widgetMessage,
      timerSeconds: this.timerSeconds,
      audioLevel: this.audioLevel,
      theme: resolveActualTheme(settings.theme),
      hotkey: settings.hotkey,
      errorActionType: this.errorActionType,
    });
  }

  setAudioLevel(level: number): void {
    this.audioLevel = level;
    this.broadcast();
  }

  applyWidgetUpdate(payload: WidgetPayload): void {
    if (payload.state !== undefined) this.widgetState = payload.state;
    if (payload.message !== undefined) this.widgetMessage = payload.message;
    if (payload.timerSeconds !== undefined) {
      this.timerSeconds = payload.timerSeconds;
    }
    if (payload.audioLevel !== undefined) this.audioLevel = payload.audioLevel;
    if (payload.errorActionType !== undefined) {
      this.errorActionType = payload.errorActionType;
    }
  }

  async toggle(): Promise<void> {
    if (this.#windowLabel !== 'main') return;

    const now = Date.now();
    if (now < this.#pasteCooldownUntil || now - this.#lastToggleTime < 500) {
      return;
    }
    this.#lastToggleTime = now;

    if (this.processing || BUSY_STATES.includes(this.widgetState)) return;
    this.#clearTransitionTimeout();

    if (!this.recording) {
      await this.#start();
    } else {
      await this.#stopAndTranscribe();
    }
  }

  async cancel(): Promise<void> {
    if (
      this.#windowLabel !== 'main' ||
      (!this.recording &&
        this.widgetState !== 'listening' &&
        this.widgetState !== 'recording')
    ) {
      return;
    }

    this.recording = false;
    this.processing = false;
    this.#stopTimer();
    this.#clearTransitionTimeout();
    this.widgetState = 'cancelled';
    this.widgetMessage = 'Запись отменена';
    this.broadcast();

    if (!this.#isTauriRuntime) {
      this.#scheduleIdle(1000);
      return;
    }

    try {
      await invoke('cancel_recording');
      this.#transitionTimeoutId = window.setTimeout(() => {
        invoke('hide_overlay').catch(console.error);
        this.widgetState = 'idle';
        this.broadcast();
      }, 1000);
    } catch (error) {
      this.#showError(error);
    }
  }

  async retry(): Promise<void> {
    if (this.processing || this.recording) return;

    try {
      this.#clearTransitionTimeout();
      this.processing = true;
      this.widgetState = 'transcribing';
      this.widgetMessage = 'Распознаю…';
      this.broadcast();
      this.#scheduleRefiningState();

      if (!this.#isTauriRuntime) {
        this.processing = false;
        this.widgetState = 'idle';
        this.broadcast();
        return;
      }

      const result = await invoke<TranscriptionResult>('retry_transcription', {
        options: this.#transcriptionOptions(),
      });
      await this.#handleSuccess(result, this.timerSeconds);
    } catch (error) {
      this.recording = false;
      this.processing = false;
      this.#stopTimer();
      this.#showError(error);
    }
  }

  sendWidgetAction(action: string): void {
    if (this.#isTauriRuntime) {
      emit('widget-action', action).catch(console.error);
    } else {
      this.handleWidgetAction(action);
    }
  }

  handleWidgetAction(action: string): void {
    if (action === 'stop') {
      void this.toggle();
    } else if (action === 'cancel') {
      void this.cancel();
    } else if (action === 'retry') {
      void this.retry();
    } else if (action === 'open_settings') {
      this.#onOpenSettings();
      this.widgetState = 'idle';
      if (this.#isTauriRuntime) {
        invoke('show_from_tray').catch(console.error);
        invoke('hide_overlay').catch(console.error);
      }
    } else if (action === 'close') {
      if (this.#isTauriRuntime) invoke('hide_overlay').catch(console.error);
      this.widgetState = 'idle';
      this.broadcast();
    }
  }

  handleDeviceError(message: string): void {
    if (
      this.processing ||
      !this.recording ||
      Date.now() - this.lastRecordingStart < 1200
    ) {
      console.warn(
        '[Dicta] Ignored microphone cleanup event during stop/processing:',
        message,
      );
      return;
    }

    console.error('[Dicta] Microphone stream error:', message);
    this.recording = false;
    this.processing = false;
    this.#stopTimer();
    this.widgetState = 'error';
    this.widgetMessage =
      'Микрофон не найден. Проверьте подключение в настройках.';
    this.errorActionType = 'settings';
    this.broadcast();
  }

  handleRecordingTimeout(message: string): void {
    console.warn('[Dicta] Recording timeout reached:', message);
    if (this.#isTauriRuntime) {
      void invoke('cancel_recording').catch(console.error);
    }
    this.recording = false;
    this.processing = false;
    this.#stopTimer();
    this.widgetState = 'error';
    this.widgetMessage =
      message || 'Запись слишком длинная (максимум 10 минут).';
    this.errorActionType = 'retry';
    this.broadcast();
  }

  dispose(): void {
    this.#stopTimer();
    this.#clearTransitionTimeout();
  }

  async #start(): Promise<void> {
    try {
      if (!this.#isTauriRuntime) {
        throw new Error(
          'Запись доступна только в desktop-приложении Dicta',
        );
      }

      this.lastRecordingStart = Date.now();
      this.recording = true;
      this.#startTimer();
      this.widgetState = 'listening';
      this.widgetMessage = 'Слушаю';
      this.broadcast();

      await invoke('show_overlay');
      await invoke('start_recording', {
        deviceLabel: this.#getSettings().selectedDeviceId || null,
      });
    } catch (error) {
      this.recording = false;
      this.#stopTimer();
      this.#showError(error);
    }
  }

  async #stopAndTranscribe(): Promise<void> {
    try {
      this.recording = false;
      const durationSec = this.timerSeconds;
      this.#stopTimer();
      this.processing = true;
      this.widgetState = 'finishing';
      this.widgetMessage = 'Завершаю…';
      this.broadcast();

      if (!this.#isTauriRuntime) return;

      this.widgetState = 'transcribing';
      this.widgetMessage = 'Распознаю…';
      this.broadcast();
      this.#scheduleRefiningState();

      const startedAt = Date.now();
      const result = await invoke<TranscriptionResult>(
        'stop_recording_and_transcribe',
        { options: this.#transcriptionOptions() },
      );
      const minimumDelay = 600 - (Date.now() - startedAt);
      if (minimumDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, minimumDelay));
      }
      await this.#handleSuccess(result, durationSec);
    } catch (error) {
      this.recording = false;
      this.processing = false;
      this.#stopTimer();
      const errorInfo = getNormalizedErrorInfo(error);
      if (errorInfo.message.includes('Запись уже была завершена')) {
        console.warn('[Dicta] Ignored duplicate stop call');
        this.widgetState = 'idle';
      } else {
        this.widgetState = 'error';
        this.widgetMessage = errorInfo.message;
        this.errorActionType = errorInfo.actionType;
      }
      this.broadcast();
    }
  }

  async #handleSuccess(
    result: TranscriptionResult,
    durationSec: number,
  ): Promise<void> {
    const text = result.processedText || '';
    const rawText = result.rawText || text;

    if (!text.trim()) {
      this.processing = false;
      this.widgetState = 'error';
      this.widgetMessage =
        'Речь не обнаружена. Попробуйте произнести фразу чётче.';
      this.errorActionType = 'retry';
      this.broadcast();
      return;
    }

    this.widgetState = 'copied';
    this.widgetMessage = 'Скопировано';
    this.broadcast();
    this.#onHistoryItem(text, durationSec, rawText);
    try {
      await invoke('copy_and_paste', { text, paste: true });
    } catch (error) {
      console.error('[Dicta] Failed to insert recognized text:', error);
      this.processing = false;
      this.widgetState = 'error';
      this.widgetMessage =
        'Текст распознан и сохранён в истории, но вставить его не удалось.';
      this.errorActionType = 'close';
      this.broadcast();
      return;
    }
    this.#pasteCooldownUntil = Date.now() + 1500;

    this.#clearTransitionTimeout();
    this.#transitionTimeoutId = window.setTimeout(() => {
      if (this.#isTauriRuntime) {
        invoke('hide_overlay').catch(console.error);
      }
      this.processing = false;
      this.widgetState = 'idle';
      this.widgetMessage = 'Слушаю';
      this.broadcast();
    }, 1400);
  }

  #transcriptionOptions() {
    const settings = this.#getSettings();
    return {
      providerApiKeys: settings.providerApiKeys,
      sttProvider: settings.sttProvider,
      llmProvider: settings.llmProvider,
      model: settings.selectedModel,
      language: settings.selectedLanguage,
      postprocessEnabled:
        settings.postprocessEnabled && settings.postprocessMode !== 'raw',
      postprocessMode: settings.postprocessMode,
      postprocessModel: settings.postprocessModel,
    };
  }

  #scheduleRefiningState(): void {
    const settings = this.#getSettings();
    if (
      !settings.postprocessEnabled ||
      settings.postprocessMode === 'raw'
    ) {
      return;
    }

    this.#transitionTimeoutId = window.setTimeout(() => {
      if (
        this.processing &&
        (this.widgetState === 'transcribing' ||
          this.widgetState === 'recognizing')
      ) {
        this.widgetState = 'refining';
        this.widgetMessage = 'Улучшаю текст…';
        this.broadcast();
      }
    }, 750);
  }

  #showError(error: unknown): void {
    const errorInfo = getNormalizedErrorInfo(error);
    this.widgetState = 'error';
    this.widgetMessage = errorInfo.message;
    this.errorActionType = errorInfo.actionType;
    this.broadcast();
  }

  #startTimer(): void {
    if (this.#timerId !== undefined) clearInterval(this.#timerId);
    this.timerSeconds = 0;
    this.broadcast();
    this.#timerId = window.setInterval(() => {
      this.timerSeconds += 1;
      this.broadcast();
    }, 1000);
  }

  #stopTimer(): void {
    if (this.#timerId !== undefined) {
      clearInterval(this.#timerId);
      this.#timerId = undefined;
    }
  }

  #clearTransitionTimeout(): void {
    if (this.#transitionTimeoutId !== undefined) {
      clearTimeout(this.#transitionTimeoutId);
      this.#transitionTimeoutId = undefined;
    }
  }

  #scheduleIdle(delayMs: number): void {
    this.#transitionTimeoutId = window.setTimeout(() => {
      this.widgetState = 'idle';
      this.broadcast();
    }, delayMs);
  }
}
