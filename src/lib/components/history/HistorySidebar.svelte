<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { HistoryItem } from '../../types/history';
  import HistoryListItem from './subcomponents/HistoryListItem.svelte';

  interface Props {
    historyList: HistoryItem[];
    selectedId: string | null;
    searchQuery: string;
    saveHistory: boolean;
    groupedItems: Array<{ label: string; items: HistoryItem[] }>;
    copiedId: string | null;
    onSelectId: (id: string) => void;
    onSearchQueryChange: (q: string) => void;
    onPromptDelete: (id: string) => void;
    onCopyText: (text: string, id: string) => void;
    onOpenClearModal: () => void;
    onOpenPrivacySettings: () => void;
    getItemTitle: (item: HistoryItem) => string;
    formatTime: (timeStr?: string, timestamp?: string) => string;
    formatRecordCount: (count: number) => string;
  }

  let {
    historyList = [],
    selectedId = null,
    searchQuery = '',
    saveHistory = true,
    groupedItems = [],
    copiedId = null,
    onSelectId,
    onSearchQueryChange,
    onPromptDelete,
    onCopyText,
    onOpenClearModal,
    onOpenPrivacySettings,
    getItemTitle,
    formatTime,
    formatRecordCount,
  }: Props = $props();

  let showFooterMenu = $state(false);

  const countWords = (text: string): number => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const isPreviewDuplicate = (item: HistoryItem): boolean => {
    const text = (item.processedText || item.rawText || '').trim();
    if (!text) return true;
    const title = getItemTitle(item).trim();
    const normTitle = title.replace(/…$/, '').trim().toLowerCase();
    const normText = text.toLowerCase();

    // Duplicate only if text is short and matches title without extra content
    return normText.length <= normTitle.length + 3 || normText === normTitle;
  };

  const handleWindowClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (showFooterMenu && target && !target.closest('.sidebar-footer-menu-container')) {
      showFooterMenu = false;
    }
  };
</script>

<svelte:window onclick={handleWindowClick} />

<aside class="history-sidebar">
  <!-- Search Header -->
  <div class="sidebar-search-header">
    <div class="search-input-wrapper">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input
        type="text"
        placeholder="Поиск по истории…"
        value={searchQuery}
        oninput={(e) => onSearchQueryChange(e.currentTarget.value)}
        class="sidebar-search-input"
        aria-label="Поиск по истории"
      />
      {#if searchQuery}
        <button class="clear-search-btn" onclick={() => onSearchQueryChange('')} title="Сбросить поиск">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      {/if}
    </div>
  </div>

  <!-- Scrollable List -->
  <div class="history-list-scroll" tabindex="-1">
    {#if saveHistory === false}
      <div class="notice-card">
        <div class="notice-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <span class="notice-title">История отключена</span>
        <span class="notice-desc">Записи не сохраняются на диске по вашей настройке приватности</span>
        {#if onOpenPrivacySettings}
          <button class="enable-history-btn" onclick={onOpenPrivacySettings}>
            Включить сохранение
          </button>
        {/if}
      </div>
    {:else if searchQuery && groupedItems.length === 0}
      <!-- Search Empty State -->
      <div class="search-empty-card">
        <div class="search-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
        </div>
        <span class="search-empty-title">Ничего не найдено</span>
        <span class="search-empty-desc">По запросу «{searchQuery}» совпадений не обнаружено</span>
        <button class="reset-search-btn" onclick={() => onSearchQueryChange('')}>
          Сбросить поиск
        </button>
      </div>
    {:else if groupedItems.length === 0}
      <!-- Overall Empty State -->
      <div class="sidebar-empty-state">
        <div class="empty-icon-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"></path>
          </svg>
        </div>
        <span class="empty-title">Список пуст</span>
        <span class="empty-sub">Записи появятся после первой диктовки</span>
      </div>
    {:else}
      {#each groupedItems as group (group.label)}
        <div class="date-group-section">
          <div class="date-group-header">{group.label}</div>
          <div class="date-group-list">
            {#each group.items as item (item.id)}
              <HistoryListItem
                {item}
                {selectedId}
                {copiedId}
                {onSelectId}
                {onPromptDelete}
                {onCopyText}
                {getItemTitle}
                {formatTime}
              />
            {/each}
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Integrated Footer Statistics & Quick Clear Trash Action -->
  <div class="history-sidebar-footer">
    <div class="footer-stat">
      <span class="count-label">{formatRecordCount(historyList?.length || 0)}</span>
    </div>
    {#if (historyList?.length || 0) > 0}
      <button
        type="button"
        class="footer-trash-btn"
        onclick={onOpenClearModal}
        title="Очистить всю историю"
        aria-label="Очистить всю историю"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    {/if}
  </div>
</aside>

<style>
  .history-sidebar {
    width: 274px;
    min-width: 274px;
    max-width: 274px;
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-sidebar, #14161B);
    border-right: 1px solid var(--border-color, #242830);
    flex-shrink: 0;
    user-select: none;
    box-sizing: border-box;
  }

  .sidebar-search-header {
    flex-shrink: 0;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border-color, #242830);
    background: var(--bg-sidebar, #14161B);
    box-sizing: border-box;
  }

  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: var(--input-bg, #1F232B);
    border: 1px solid var(--border-color, #242830);
    border-radius: var(--radius-control, 8px);
    padding: 0 10px;
    height: 36px;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    box-sizing: border-box;
  }

  .sidebar-search-input:focus {
    outline: none;
  }

  .search-input-wrapper:has(.sidebar-search-input:focus-visible) {
    border-color: var(--focus-ring, #5B5FEF);
    outline: 2px solid var(--focus-ring, #5B5FEF);
    outline-offset: -1px;
  }

  .search-icon {
    width: 16px;
    height: 16px;
    color: var(--text-secondary, #9CA3AF);
    margin-right: 8px;
    flex-shrink: 0;
    opacity: 0.85;
  }

  .sidebar-search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 13px;
    color: var(--text-primary, #E5E7EB);
    outline: none;
    padding: 0;
    min-width: 0;
  }

  .clear-search-btn {
    border: none;
    background: transparent;
    color: var(--text-secondary, #9CA3AF);
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: color 100ms ease;
  }

  .clear-search-btn svg {
    width: 13px;
    height: 13px;
  }

  .clear-search-btn:hover {
    color: var(--text-primary, #E5E7EB);
  }

  /* Scrollable List Container strictly bounded between search header & footer */
  .history-list-scroll {
    flex: 1 1 0%;
    min-height: 0;
    overflow-y: auto;
    padding: 0 0 20px 0;
    box-sizing: border-box;
  }

  .sidebar-empty-state,
  .search-empty-card,
  .notice-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
    text-align: center;
    gap: 8px;
  }

  .empty-icon-circle,
  .search-empty-icon,
  .notice-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--bg-control, #1F232B);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary, #9CA3AF);
    margin-bottom: 4px;
  }

  .empty-icon-circle svg,
  .search-empty-icon svg,
  .notice-icon svg {
    width: 18px;
    height: 18px;
  }

  .empty-title,
  .search-empty-title,
  .notice-title {
    font-size: var(--text-base, 13px);
    font-weight: 600;
    color: var(--text-primary, #E5E7EB);
  }

  .empty-sub,
  .search-empty-desc,
  .notice-desc {
    font-size: var(--text-xs, 11px);
    color: var(--text-secondary, #9CA3AF);
    line-height: 1.4;
    max-width: 220px;
  }

  .reset-search-btn,
  .enable-history-btn {
    margin-top: 6px;
    font-size: var(--text-xs, 11px);
    font-weight: 600;
    color: var(--accent-primary, #5B5FEF);
    background: var(--accent-soft, rgba(91, 95, 239, 0.09));
    border: 1px solid var(--accent-border, rgba(91, 95, 239, 0.2));
    padding: 5px 12px;
    border-radius: var(--radius-sm, 6px);
    cursor: pointer;
    transition: all 120ms ease;
  }

  .reset-search-btn:hover,
  .enable-history-btn:hover {
    background: var(--accent-primary, #5B5FEF);
    color: var(--accent-foreground, #FFFFFF);
  }

  .date-group-section {
    margin-bottom: 0;
  }

  .date-group-header {
    position: sticky;
    top: 0;
    z-index: 2;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-tertiary, #717784);
    padding: 8px 12px 4px 12px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    background: var(--bg-sidebar, #14161B);
  }

  .date-group-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 0;
  }

  /* Fixed Sidebar Footer */
  .history-sidebar-footer {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 44px;
    min-height: 44px;
    padding: 0 12px;
    border-top: 1px solid var(--border-color, #242830);
    background: var(--bg-sidebar, #14161B);
    box-sizing: border-box;
  }

  .count-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary, #9CA3AF);
  }

  .footer-trash-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid transparent;
    background: transparent;
    border-radius: var(--radius-sm, 6px);
    color: var(--text-secondary, #9CA3AF);
    cursor: pointer;
    transition: background 100ms ease, color 100ms ease;
  }

  .footer-trash-btn:hover {
    background: var(--danger-bg, rgba(239, 68, 68, 0.12));
    color: var(--danger-color, #EF4444);
  }

  .footer-trash-btn:focus-visible {
    outline: 2px solid var(--focus-ring, #5B5FEF);
    outline-offset: -1px;
  }

  .footer-trash-btn svg {
    width: 15px;
    height: 15px;
  }
</style>
