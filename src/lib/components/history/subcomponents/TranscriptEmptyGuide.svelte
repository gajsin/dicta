<script lang="ts">
  import { getRecordingStatus } from '../../../recording/status';
  import type { WidgetState } from '../../../types/widget';

  interface Props {
    hotkey?: string;
    recordingState?: WidgetState;
    statusMessage?: string;
    timerSeconds?: number;
    onStartRecording?: () => void;
    onStopRecording?: () => void;
    onRetry?: () => void;
  }

  let {
    hotkey = 'F9',
    recordingState = 'idle',
    statusMessage = '',
    timerSeconds = 0,
    onStartRecording = () => {},
    onStopRecording = () => {},
    onRetry = () => {},
  }: Props = $props();

  const recordingStatus = $derived(
    getRecordingStatus(recordingState, statusMessage),
  );
  const formattedTimer = $derived(
    `${String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:${String(timerSeconds % 60).padStart(2, '0')}`,
  );
</script>

<div class="detail-empty-guide">
  <div class="empty-guide-card">
    <div class="guide-header">
      <div class="mic-hero-circle">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
        </svg>
      </div>
      <h2>Готов к диктовке</h2>
      <p class="guide-subtitle">Нажмите <kbd>{hotkey}</kbd> в любом приложении или кнопку ниже, чтобы начать запись</p>
    </div>

    {#if recordingStatus.kind === 'idle' || recordingStatus.kind === 'cancelled'}
      <button type="button" class="empty-hero-rec-btn" onclick={onStartRecording}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
        </svg>
        <span>Начать запись</span>
        <kbd class="hero-kbd">{hotkey}</kbd>
      </button>
    {:else if recordingStatus.kind === 'listening'}
      <div class="empty-record-status listening" role="region" aria-label="Активная запись">
        <span class="empty-rec-dot" aria-hidden="true"></span>
        <span>{recordingStatus.label}…</span>
        <span class="empty-rec-timer">{formattedTimer}</span>
        <button type="button" onclick={onStopRecording}>Готово</button>
      </div>
    {:else if recordingStatus.kind === 'processing'}
      <div class="empty-record-status processing" role="status">
        <span class="empty-spinner" aria-hidden="true"></span>
        <span>{recordingStatus.label}</span>
      </div>
    {:else if recordingStatus.kind === 'success'}
      <div class="empty-record-status success" role="status">
        <span aria-hidden="true">✓</span>
        <span>{recordingStatus.label}</span>
      </div>
    {:else if recordingStatus.kind === 'error'}
      <div class="empty-record-status error" role="alert">
        <span class="empty-error-text" title={recordingStatus.label}>{recordingStatus.label}</span>
        <button type="button" onclick={onRetry}>Повторить</button>
      </div>
    {/if}

    <div class="guide-steps">
      <div class="step-card">
        <div class="step-num">1</div>
        <div class="step-info">
          <span class="step-title">Запись голоса</span>
          <span class="step-desc">Нажмите hotkey <kbd>{hotkey}</kbd> в любом окне и произнесите любую мысль</span>
        </div>
      </div>
      <div class="step-card">
        <div class="step-num">2</div>
        <div class="step-info">
          <span class="step-title">Улучшение ИИ</span>
          <span class="step-desc">Модель моментально очистит слова-паразиты и расставит знаки препинания</span>
        </div>
      </div>
      <div class="step-card">
        <div class="step-num">3</div>
        <div class="step-info">
          <span class="step-title">Мгновенная вставка</span>
          <span class="step-desc">Готовый текст подставится сам в активное поле или скопируется через <kbd>Ctrl+V</kbd></span>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .detail-empty-guide {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 420px;
    padding: 32px 16px;
  }

  .empty-guide-card {
    max-width: 480px;
    width: 100%;
    background: var(--bg-surface, #191C23);
    border: 1px solid var(--border-color, #242830);
    border-radius: var(--radius-card, 16px);
    padding: 36px 32px;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    text-align: center;
    box-sizing: border-box;
  }

  .guide-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .mic-hero-circle {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--accent-soft, rgba(91, 95, 239, 0.1));
    color: var(--accent-primary, #5B5FEF);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mic-hero-circle svg {
    width: 24px;
    height: 24px;
  }

  .guide-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary, #E5E7EB);
    letter-spacing: -0.02em;
  }

  .guide-subtitle {
    margin: 0;
    font-size: 13px;
    color: var(--text-secondary, #9CA3AF);
    line-height: 1.4;
  }

  .empty-hero-rec-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 38px;
    padding: 0 18px;
    background: var(--accent-primary, #5B5FEF);
    color: var(--accent-foreground, #FFFFFF);
    border: none;
    border-radius: var(--radius-control, 8px);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 120ms ease, transform 100ms ease;
    box-shadow: none;
  }

  .empty-hero-rec-btn:hover {
    background: var(--accent-hover, #4B4FEB);
    transform: translateY(-1px);
  }

  .empty-hero-rec-btn:active {
    transform: translateY(0);
  }

  .empty-hero-rec-btn svg {
    width: 16px;
    height: 16px;
  }

  .empty-record-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 38px;
    max-width: 100%;
    padding: 0 12px;
    border-radius: var(--radius-control, 8px);
    box-sizing: border-box;
    color: var(--text-primary, #E5E7EB);
    background: var(--bg-control, #1F232B);
    border: 1px solid var(--border-color, #242830);
    font-size: 13px;
    font-weight: 600;
  }

  .empty-record-status button {
    height: 26px;
    padding: 0 10px;
    border: 0;
    border-radius: 6px;
    background: var(--accent-primary, #5B5FEF);
    color: var(--accent-foreground, #FFFFFF);
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }

  .empty-rec-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent-primary, #5B5FEF);
    animation: empty-record-pulse 1.4s ease-in-out infinite;
  }

  .empty-rec-timer {
    min-width: 44px;
    font-family: var(--font-mono, monospace);
    font-variant-numeric: tabular-nums;
    color: var(--text-secondary, #9CA3AF);
  }

  .empty-spinner {
    width: 13px;
    height: 13px;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    color: var(--accent-primary, #5B5FEF);
    animation: empty-record-spin 800ms linear infinite;
  }

  .empty-record-status.success {
    color: var(--success-color, #2EBE78);
    background: var(--success-bg, rgba(46, 190, 120, 0.08));
    border-color: var(--success-border, rgba(46, 190, 120, 0.18));
  }

  .empty-record-status.error {
    color: var(--danger-color, #EF4444);
    background: var(--danger-bg, rgba(239, 68, 68, 0.08));
    border-color: var(--danger-border, rgba(239, 68, 68, 0.18));
  }

  .empty-record-status.error button {
    border: 1px solid currentColor;
    background: transparent;
    color: inherit;
  }

  .empty-error-text {
    min-width: 0;
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @keyframes empty-record-pulse {
    50% {
      opacity: 0.45;
      transform: scale(0.85);
    }
  }

  @keyframes empty-record-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .empty-rec-dot,
    .empty-spinner {
      animation: none;
    }
  }

  .hero-kbd {
    background: rgba(255, 255, 255, 0.2);
    color: var(--accent-foreground, #FFFFFF);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    padding: 1px 6px;
    margin-left: 2px;
  }

  .guide-steps {
    display: flex;
    flex-direction: column;
    gap: 10px;
    text-align: left;
    width: 100%;
    margin-top: 4px;
  }

  .step-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--bg-control, #1F232B);
    border: 1px solid var(--border-subtle, #1D2027);
    border-radius: var(--radius-md, 8px);
    padding: 10px 14px;
  }

  .step-num {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--accent-primary, #5B5FEF);
    color: var(--accent-foreground, #FFFFFF);
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .step-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .step-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary, #E5E7EB);
  }

  .step-desc {
    font-size: 12px;
    color: var(--text-secondary, #9CA3AF);
  }

  kbd {
    font-family: var(--font-mono, monospace);
    font-size: 11px;
    font-weight: 600;
    background: var(--bg-surface, #191C23);
    border: 1px solid var(--border-color, #242830);
    color: var(--text-primary, #E5E7EB);
    border-radius: 4px;
    padding: 1px 5px;
  }
</style>
