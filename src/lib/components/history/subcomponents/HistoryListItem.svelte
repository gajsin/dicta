<script lang="ts">
  import type { HistoryItem } from '../../../types/history';
  import { formatWordCount } from '../../../utils/formatters';

  interface Props {
    item: HistoryItem;
    selectedId: string | null;
    copiedId: string | null;
    onSelectId: (id: string) => void;
    onPromptDelete: (id: string) => void;
    onCopyText: (text: string, id: string) => void;
    getItemTitle: (item: HistoryItem) => string;
    formatTime: (timeStr?: string, timestamp?: string) => string;
  }

  let {
    item,
    selectedId = null,
    copiedId = null,
    onSelectId,
    onPromptDelete,
    onCopyText,
    getItemTitle,
    formatTime,
  }: Props = $props();

  const countWords = (text: string): number => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };
</script>

<div
  class="history-row"
  class:selected={item.id === selectedId}
  onclick={() => onSelectId(item.id)}
  role="button"
  tabindex="0"
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectId(item.id);
    }
  }}
>
  {#if item.id === selectedId}
    <div class="selected-accent-line"></div>
  {/if}

  <div class="row-content-group">
    <div class="row-top-line">
      <span class="row-title" title={getItemTitle(item)}>{getItemTitle(item)}</span>
      <span class="row-right-time">{formatTime(item.timeStr, item.timestamp)}</span>
    </div>
    <div class="row-middle-line">
      <span class="row-preview-text">{item.processedText || item.rawText || ''}</span>
    </div>
    <div class="row-bottom-line">
      <span class="row-preview-meta">{item.duration ?? 0}с • {formatWordCount(countWords(item.processedText || item.rawText || ''))}</span>
    </div>
  </div>

  <!-- Hover Quick Actions -->
  <div class="row-hover-actions">
    <button
      class="row-action-btn"
      title="Скопировать текст"
      onclick={(e) => { e.stopPropagation(); onCopyText(item.processedText || item.rawText || '', item.id); }}
    >
      {#if copiedId === item.id}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="20 6 9 17 4 12"></polyline></svg>
      {:else}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      {/if}
    </button>
    <button
      class="row-action-btn danger"
      title="Удалить запись"
      onclick={(e) => { e.stopPropagation(); onPromptDelete(item.id); }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
    </button>
  </div>
</div>

<style>
  .history-row {
    position: relative;
    display: flex;
    align-items: center;
    padding: 6px 12px;
    min-height: 62px;
    height: 62px;
    max-height: 62px;
    border-radius: 0;
    cursor: pointer;
    transition: background 100ms ease;
    outline: none;
    border: none;
    border-bottom: 1px solid var(--border-subtle, #1D2027);
    background: transparent;
    user-select: none;
    box-shadow: none;
    box-sizing: border-box;
  }

  .history-row:hover {
    background: var(--hover-bg, rgba(255, 255, 255, 0.04));
  }

  .history-row:focus-visible {
    outline: 2px solid var(--focus-ring, #5B5FEF);
    outline-offset: -2px;
    z-index: 3;
  }

  /* Selected State: Low Opacity Soft Accent Fill, High Contrast Title, 2px Left Indicator, No Shadow/Full Border */
  .history-row.selected {
    background: var(--accent-soft, rgba(91, 95, 239, 0.06));
    border-bottom-color: var(--border-subtle, #1D2027);
    box-shadow: none;
  }

  .selected-accent-line {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--accent-primary, #5B5FEF);
  }

  .row-content-group {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 2px;
    overflow: hidden;
  }

  .row-top-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .row-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary, #E5E7EB);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    letter-spacing: -0.01em;
  }

  .history-row.selected .row-title {
    font-weight: 600;
    color: var(--text-primary, #E5E7EB);
  }

  .row-right-time {
    font-size: 12px;
    color: var(--text-secondary, #9CA3AF);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  .row-middle-line {
    display: flex;
    align-items: center;
  }

  .row-preview-text {
    font-size: 12px;
    line-height: 16px;
    color: var(--text-secondary, #9CA3AF);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .row-bottom-line {
    display: flex;
    align-items: center;
  }

  .row-preview-meta {
    font-size: 12px;
    line-height: 16px;
    color: var(--text-tertiary, #717784);
    font-variant-numeric: tabular-nums;
  }

  .row-hover-actions {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    display: none;
    align-items: center;
    gap: 2px;
    background: var(--bg-control, #1F232B);
    padding: 2px;
    border-radius: var(--radius-sm, 6px);
    box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.35));
    border: 1px solid var(--border-color, #242830);
    z-index: 5;
  }

  .history-row:hover .row-hover-actions {
    display: flex;
  }

  .row-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    border-radius: 4px;
    color: var(--text-secondary, #9CA3AF);
    cursor: pointer;
    transition: all 100ms ease;
  }

  .row-action-btn svg {
    width: 13px;
    height: 13px;
  }

  .row-action-btn:hover {
    background: var(--hover-surface, #252A34);
    color: var(--text-primary, #E5E7EB);
  }

  .row-action-btn.danger:hover {
    background: var(--danger-bg, rgba(239, 68, 68, 0.12));
    color: var(--danger-color, #EF4444);
  }

  .row-action-btn:focus-visible {
    outline: 2px solid var(--focus-ring, #5B5FEF);
    outline-offset: -1px;
  }
</style>
