<script lang="ts">
  import './TranscriptDetail.workspace.css';
  import './TranscriptDetail.document.css';
  import { fade } from 'svelte/transition';
  import { getRecordingStatus } from '../../recording/status';
  import type { HistoryItem } from '../../types/history';
  import type { WidgetState } from '../../types/widget';

  interface Props {
    selectedItem: HistoryItem | null;
    textMode: 'processed' | 'raw' | 'diff';
    isEditing: boolean;
    editText: string;
    copiedId: string | null;
    isLoading?: boolean;
    hasError?: boolean;
    // Recording state & actions
    recordingState?: WidgetState;
    hotkey?: string;
    audioLevel?: number;
    timerSeconds?: number;
    statusMessage?: string;
    onStartRecording?: () => void;
    onStopRecording?: () => void;
    onCancelRecording?: () => void;
    onRetry?: () => void;
    // Formatters & Handlers
    formatDateFull: (item?: HistoryItem | null) => string;
    countWords: (text: string) => number;
    onTextModeChange: (mode: 'processed' | 'raw' | 'diff') => void;
    onStartEdit: () => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onEditTextChange: (val: string) => void;
    onCopyText: (text: string, id: string) => void;
    onPromptDelete: (id: string) => void;
  }

  let {
    selectedItem = null,
    textMode = 'processed',
    isEditing = false,
    editText = '',
    copiedId = null,
    isLoading = false,
    hasError = false,
    recordingState = 'idle',
    hotkey = 'F9',
    audioLevel = 0,
    timerSeconds = 0,
    statusMessage = '',
    onStartRecording = () => {},
    onStopRecording = () => {},
    onCancelRecording = () => {},
    onRetry = () => {},
    formatDateFull,
    countWords,
    onTextModeChange,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onEditTextChange,
    onCopyText,
    onPromptDelete,
  }: Props = $props();

  let showUnsavedPrompt = $state(false);

  const handleCancelClick = () => {
    const originalText = textMode === 'raw'
      ? (selectedItem?.rawText || selectedItem?.processedText || '')
      : (selectedItem?.processedText || '');

    if (editText.trim() !== originalText.trim()) {
      showUnsavedPrompt = true;
    } else {
      onCancelEdit();
    }
  };

  const confirmCancelEdits = () => {
    showUnsavedPrompt = false;
    onCancelEdit();
  };

  const currentDisplayWords = $derived.by(() => {
    if (isEditing) return countWords(editText);
    if (!selectedItem) return 0;
    if (textMode === 'raw') return countWords(selectedItem.rawText || selectedItem.processedText || '');
    return selectedItem.wordCount || countWords(selectedItem.processedText || '');
  });

  const formatTimer = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  import { computeTextDiff } from '../../utils/diff';
  import { formatWordCount } from '../../utils/formatters';
  import DiffViewer from './subcomponents/DiffViewer.svelte';
  import TranscriptEmptyGuide from './subcomponents/TranscriptEmptyGuide.svelte';
  import TranscriptSkeleton from './subcomponents/TranscriptSkeleton.svelte';
  import TranscriptEditor from './subcomponents/TranscriptEditor.svelte';

  const comparison = $derived.by(() => {
    return computeTextDiff(selectedItem?.rawText, selectedItem?.processedText);
  });
  const recordingStatus = $derived(
    getRecordingStatus(recordingState, statusMessage),
  );
</script>

<div class="transcript-detail-scope">
<main class="history-detail-workspace">
  {#if isLoading}
    <TranscriptSkeleton />
  {:else if hasError}
    <div class="detail-error-state">
      <div class="error-icon-circle">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h3>Ошибка загрузки записи</h3>
      <p>Не удалось прочитать содержимое данной диктовки.</p>
    </div>
  {:else if selectedItem}
    <div class="detail-document-container">
      <!-- 1. Top Row: Segmented Switcher & Primary Record CTA -->
      <div class="document-top-segmented-row">
        <div class="segmented-control" role="tablist" aria-label="Версии текста">
          <button
            class="segment-btn"
            class:active={textMode === 'processed'}
            onclick={() => onTextModeChange('processed')}
            role="tab"
            aria-selected={textMode === 'processed'}
          >
            <svg class="segment-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
            </svg>
            <span>Улучшенный</span>
          </button>
          <button
            class="segment-btn"
            class:active={textMode === 'raw'}
            onclick={() => onTextModeChange('raw')}
            role="tab"
            aria-selected={textMode === 'raw'}
          >
            <svg class="segment-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <span>Исходный</span>
          </button>
          <button
            class="segment-btn"
            class:active={textMode === 'diff'}
            onclick={() => onTextModeChange('diff')}
            role="tab"
            aria-selected={textMode === 'diff'}
          >
            <svg class="segment-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span>Сравнить</span>
          </button>
        </div>

        <!-- Primary Recording CTA or Live Status -->
        <div class="workspace-record-cta-container">
          {#if recordingStatus.kind === 'idle' || recordingStatus.kind === 'cancelled'}
            <button
              type="button"
              class="primary-record-btn"
              onclick={onStartRecording}
              title="Начать запись ({hotkey})"
              transition:fade={{ duration: 150 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
              </svg>
              <span>Начать запись</span>
              <kbd class="btn-kbd">{hotkey}</kbd>
            </button>
          {:else if recordingStatus.kind === 'listening'}
            <div class="active-recording-pill" transition:fade={{ duration: 150 }} role="region" aria-label="Активная запись">
              <span class="rec-dot pulsing" aria-hidden="true"></span>
              <span class="rec-status">{recordingStatus.label}…</span>
              <span class="rec-timer" aria-live="off">{formatTimer(timerSeconds)}</span>
              <button
                type="button"
                class="rec-done-btn"
                onclick={onStopRecording}
                title="Завершить запись ({hotkey})"
                aria-label="Завершить запись"
              >
                Готово
              </button>
            </div>
          {:else if recordingStatus.kind === 'processing'}
            <div class="active-processing-pill" transition:fade={{ duration: 150 }}>
              <svg viewBox="0 0 24 24" class="spin-svg">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="38 14"></circle>
              </svg>
              <span>{recordingStatus.label}</span>
            </div>
          {:else if recordingStatus.kind === 'success'}
            <div class="active-result-pill success" transition:fade={{ duration: 150 }} role="status">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 6 9 17l-5-5"></path>
              </svg>
              <span>{recordingStatus.label}</span>
            </div>
          {:else if recordingStatus.kind === 'error'}
            <div class="active-result-pill error" transition:fade={{ duration: 150 }} role="alert">
              <span class="result-alert-icon" aria-hidden="true">!</span>
              <span class="result-error-text" title={recordingStatus.label}>{recordingStatus.label}</span>
              <button type="button" class="result-retry-btn" onclick={onRetry}>Повторить</button>
            </div>
          {/if}
        </div>
      </div>

      <!-- 2. Header of Selected Record: Metadata & Document Actions on ONE line -->
      <div class="document-meta-actions-bar">
        <div class="document-metadata-row">
          <span class="meta-item date-time">{formatDateFull(selectedItem)}</span>
          <span class="meta-dot">•</span>
          <span class="meta-item duration tnum">{selectedItem.duration ?? 0} сек</span>
          <span class="meta-dot">•</span>
          <span class="meta-item word-count tnum">{formatWordCount(currentDisplayWords)}</span>
          {#if selectedItem.targetApp}
            <span class="meta-dot">•</span>
            <span class="meta-badge app-badge">{selectedItem.targetApp}</span>
          {/if}
        </div>

        <div class="document-actions">
          {#if isEditing}
            <button class="doc-btn primary-save" onclick={onSaveEdit}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Сохранить</span>
            </button>
            <button class="doc-btn secondary-cancel" onclick={handleCancelClick}>
              <span>Отмена</span>
            </button>
          {:else}
            <!-- Secondary Action: Copy -->
            <button
              class="doc-btn secondary-btn"
              class:copied={copiedId === selectedItem.id}
              onclick={() => onCopyText(textMode === 'raw' ? (selectedItem.rawText || selectedItem.processedText) : selectedItem.processedText, selectedItem.id)}
              title="Скопировать текст в буфер обмена"
            >
              {#if copiedId === selectedItem.id}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Скопировано!</span>
              {:else}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                <span>Копировать</span>
              {/if}
            </button>

            <!-- Edit Action -->
            <button class="doc-btn secondary-btn" onclick={onStartEdit} title="Редактировать этот текст">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              <span>Редактировать</span>
            </button>

            <!-- Direct Trash Icon Button Action -->
            <button
              class="doc-btn icon-only trash-action"
              onclick={() => onPromptDelete(selectedItem.id)}
              title="Удалить запись"
              aria-label="Удалить запись"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          {/if}
        </div>
      </div>

      <!-- 3. Document Content Area -->
      <div class="document-card-surface" class:editing-active={isEditing} class:diff-active={textMode === 'diff'}>
        {#if isEditing}
          <TranscriptEditor
            value={editText}
            oninput={(val) => onEditTextChange(val)}
            onSave={onSaveEdit}
            onCancel={handleCancelClick}
          />
        {:else if textMode === 'diff'}
          <DiffViewer {comparison} />
        {:else}
          <article class="document-readable-article">
            <p class="document-paragraph">
              {textMode === 'processed' ? selectedItem.processedText : (selectedItem.rawText || selectedItem.processedText)}
            </p>
          </article>
        {/if}
      </div>
    </div>
  {:else}
    <TranscriptEmptyGuide
      {hotkey}
      {recordingState}
      {statusMessage}
      {timerSeconds}
      {onStartRecording}
      {onStopRecording}
      {onRetry}
    />
  {/if}
</main>

<!-- Unsaved Changes Prompt Modal -->
{#if showUnsavedPrompt}
  <div class="modal-backdrop" role="dialog" aria-modal="true">
    <div class="modal-card">
      <h3 class="modal-title">Сбросить несохранённые изменения?</h3>
      <p class="modal-desc">Вы изменили текст диктовки. При отмене ваши правки будут потеряны.</p>
      <div class="modal-actions">
        <button class="modal-btn secondary" onclick={() => { showUnsavedPrompt = false; }}>Продолжить редактирование</button>
        <button class="modal-btn danger" onclick={confirmCancelEdits}>Сбросить изменения</button>
      </div>
    </div>
  </div>
{/if}
</div>
