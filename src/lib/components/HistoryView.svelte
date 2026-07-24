<script lang="ts">
  import { fade } from 'svelte/transition';
  import HistorySidebar from './history/HistorySidebar.svelte';
  import TranscriptDetail from './history/TranscriptDetail.svelte';
  import ClearHistoryModal from './history/ClearHistoryModal.svelte';

  import type { HistoryItem } from '../types/history';
  export type { HistoryItem };

  import type { WidgetState } from '../types/widget';

  interface Props {
    historyList?: HistoryItem[];
    selectedId?: string | null;
    searchQuery?: string;
    saveHistory?: boolean;
    isLoading?: boolean;
    hasError?: boolean;
    // Recording props
    recordingState?: WidgetState;
    hotkey?: string;
    audioLevel?: number;
    timerSeconds?: number;
    statusMessage?: string;
    onStartRecording?: () => void;
    onStopRecording?: () => void;
    onCancelRecording?: () => void;
    onRetry?: () => void;
    // Handlers
    onDelete?: (id: string) => void;
    onUpdateItem?: (id: string, field: 'rawText' | 'processedText', updatedText: string) => void;
    onCopyText?: (text: string) => void;
    onClearHistory?: () => void;
    onOpenPrivacySettings?: () => void;
  }

  let {
    historyList = [],
    selectedId = $bindable(null),
    searchQuery = $bindable(''),
    saveHistory = true,
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
    onDelete = () => {},
    onUpdateItem = () => {},
    onCopyText = () => {},
    onClearHistory = () => {},
    onOpenPrivacySettings = () => {}
  }: Props = $props();

  let textMode = $state<'processed' | 'raw' | 'diff'>('processed');
  let copiedId = $state<string | null>(null);

  // Inline text editing state
  let isEditing = $state(false);
  let editText = $state('');

  // Modal & confirmation states
  let showClearModal = $state(false);
  let pendingSwitchId = $state<string | null>(null);

  // Filter items by search query
  const filteredList = $derived.by(() => {
    const list = historyList || [];
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return list;

    return list.filter(item =>
      (item.processedText && item.processedText.toLowerCase().includes(q)) ||
      (item.rawText && item.rawText.toLowerCase().includes(q))
    );
  });

  // Keep the detail pane synchronized with the visible search results.
  $effect(() => {
    if (filteredList.length === 0) return;
    if (!selectedId || !filteredList.some((item) => item.id === selectedId)) {
      selectedId = filteredList[0].id;
    }
  });

  // Group items by date category
  const groupedItems = $derived.by(() => {
    const groups: { label: string; items: HistoryItem[] }[] = [
      { label: 'Сегодня', items: [] },
      { label: 'Вчера', items: [] },
      { label: 'На этой неделе', items: [] },
      { label: 'Ранее', items: [] }
    ];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);

    for (const item of filteredList) {
      const itemTime = new Date(item.timestamp).getTime();

      if (itemTime >= todayStart) {
        groups[0].items.push(item);
      } else if (itemTime >= yesterdayStart.getTime()) {
        groups[1].items.push(item);
      } else if (itemTime >= weekStart.getTime()) {
        groups[2].items.push(item);
      } else {
        groups[3].items.push(item);
      }
    }

    return groups.filter(g => g.items.length > 0);
  });

  const selectedItem = $derived(filteredList.find(i => i.id === selectedId) || null);

  const getItemTitle = (item: HistoryItem): string => {
    const t = (item.processedText || item.rawText || '').trim();
    if (!t) return 'Пустая запись';
    const firstSentence = t.split(/[.!?]/)[0].trim();
    if (firstSentence.length <= 32) return firstSentence;
    return firstSentence.substring(0, 30) + '…';
  };

  const formatTime = (_timeStr?: string, timestamp?: string): string => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateFull = (item?: HistoryItem | null): string => {
    if (!item) return '';
    const d = new Date(item.timestamp);
    if (Number.isNaN(d.getTime())) return '';
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const timeStr = formatTime(undefined, item.timestamp);
    const dayName = d >= todayStart
      ? 'Сегодня'
      : d >= yesterdayStart
      ? 'Вчера'
      : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    return `${dayName}, ${timeStr}`;
  };

  const countWords = (text: string): number => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const formatRecordCount = (count: number): string => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return `${count} запись`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${count} записи`;
    return `${count} записей`;
  };

  const handleCopy = (text: string, id?: string) => {
    onCopyText(text);
    if (id) {
      copiedId = id;
      setTimeout(() => { copiedId = null; }, 1800);
    }
  };

  const handleSelectIdWithCheck = (newId: string) => {
    if (newId === selectedId) return;
    if (isEditing) {
      const originalText = textMode === 'raw'
        ? (selectedItem?.rawText || selectedItem?.processedText || '')
        : (selectedItem?.processedText || '');

      if (editText.trim() !== originalText.trim()) {
        pendingSwitchId = newId;
        return;
      }
    }
    isEditing = false;
    selectedId = newId;
  };

  const confirmSwitchItem = () => {
    if (pendingSwitchId) {
      isEditing = false;
      selectedId = pendingSwitchId;
      pendingSwitchId = null;
    }
  };

  const startEdit = () => {
    if (!selectedItem) return;
    editText = textMode === 'raw' ? (selectedItem.rawText || selectedItem.processedText || '') : selectedItem.processedText;
    isEditing = true;
  };

  const saveEdit = () => {
    if (selectedItem) {
      const field = textMode === 'raw' ? 'rawText' : 'processedText';
      onUpdateItem(selectedItem.id, field, editText);
    }
    isEditing = false;
  };

  const deleteSingle = (id: string) => {
    onDelete(id);
    if (selectedId === id) {
      isEditing = false;
    }
  };

  // Keyboard Navigation: Up & Down Arrows
  const handleKeyDown = (e: KeyboardEvent) => {
    if (isEditing || showClearModal || pendingSwitchId) return;
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;

    const allVisible = filteredList;
    if (allVisible.length === 0) return;

    const currentIdx = allVisible.findIndex(i => i.id === selectedId);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = Math.min(allVisible.length - 1, currentIdx + 1);
      selectedId = allVisible[nextIdx].id;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = Math.max(0, currentIdx - 1);
      selectedId = allVisible[prevIdx].id;
    }
  };

</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="history-view-workspace" in:fade={{ duration: 150 }}>
  <!-- LEFT SIDEBAR: Master List Pane -->
  <HistorySidebar
    {historyList}
    {selectedId}
    {searchQuery}
    {saveHistory}
    {groupedItems}
    {copiedId}
    onSelectId={handleSelectIdWithCheck}
    onSearchQueryChange={(q) => { searchQuery = q; }}
    onPromptDelete={deleteSingle}
    onCopyText={handleCopy}
    onOpenClearModal={() => { showClearModal = true; }}
    onOpenPrivacySettings={onOpenPrivacySettings}
    {getItemTitle}
    {formatTime}
    {formatRecordCount}
  />

  <!-- RIGHT AREA: Dictation Document Workspace Pane -->
  <TranscriptDetail
    {selectedItem}
    {textMode}
    {isEditing}
    {editText}
    {copiedId}
    {isLoading}
    {hasError}
    {recordingState}
    {hotkey}
    {audioLevel}
    {timerSeconds}
    {statusMessage}
    {onStartRecording}
    {onStopRecording}
    {onCancelRecording}
    {onRetry}
    {formatDateFull}
    {countWords}
    onTextModeChange={(mode) => { textMode = mode; }}
    onStartEdit={startEdit}
    onSaveEdit={saveEdit}
    onCancelEdit={() => { isEditing = false; }}
    onEditTextChange={(val) => { editText = val; }}
    onCopyText={handleCopy}
    onPromptDelete={deleteSingle}
  />
</div>

{#if showClearModal}
  <ClearHistoryModal
    itemCount={historyList.length}
    onClose={() => { showClearModal = false; }}
    onConfirmClear={() => {
      onClearHistory();
      showClearModal = false;
    }}
  />
{/if}

<!-- Unsaved Edits Switch Item Intercept Modal -->
{#if pendingSwitchId}
  <div class="modal-backdrop" transition:fade={{ duration: 100 }} role="dialog" aria-modal="true">
    <div class="modal-card">
      <h3 class="modal-title">Несохранённые изменения</h3>
      <p class="modal-desc">У вас есть несохранённые правки в текущей записи. Переключить запись без сохранения?</p>
      <div class="modal-actions">
        <button class="modal-btn secondary" onclick={() => { pendingSwitchId = null; }}>Остаться</button>
        <button class="modal-btn danger-filled" onclick={confirmSwitchItem}>Сбросить и перейти</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .history-view-workspace {
    display: flex;
    flex: 1;
    height: 100%;
    width: 100%;
    background: var(--bg-app, #0F1115);
    overflow: hidden;
  }

  .modal-backdrop {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-card {
    background: var(--bg-surface, #191C23);
    border: 1px solid var(--border-color, #242830);
    border-radius: var(--radius-card, 12px);
    box-shadow: var(--shadow-popover, 0 10px 28px rgba(0, 0, 0, 0.60));
    padding: 24px;
    max-width: 400px;
    width: 90%;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .modal-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary, #E5E7EB);
  }

  .modal-desc {
    font-size: 12px;
    color: var(--text-secondary, #9CA3AF);
    margin: 0;
    line-height: 1.4;
  }

  .modal-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
  }

  .modal-btn {
    padding: 8px 16px;
    border-radius: var(--radius-md, 8px);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid var(--border-color, #242830);
    background: var(--bg-control, #1F232B);
    color: var(--text-primary, #E5E7EB);
    transition: all 100ms ease;
  }

  .modal-btn.secondary:hover {
    background: var(--hover-surface, #252A34);
    border-color: var(--border-strong, #2E333F);
  }

  .modal-btn.danger-filled {
    background: var(--danger-color, #EF4444);
    color: #FFFFFF;
    border-color: transparent;
  }

  .modal-btn.danger-filled:hover {
    background: #DC2626;
  }
</style>
