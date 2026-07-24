<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import type { HistoryItem } from '../types/history';

  interface CommandPaletteProps {
    visible?: boolean;
    historyItems?: HistoryItem[];
    currentTheme?: string;
    currentMode?: string;
    onClose?: () => void;
    onSelectHistory?: (id: string) => void;
    onNavigateView?: (view: 'history' | 'settings' | 'about') => void;
    onSetMode?: (mode: 'raw' | 'minimal' | 'balanced' | 'business') => void;
    onToggleTheme?: () => void;
    onTriggerRecording?: () => void;
  }

  let {
    visible = false,
    historyItems = [],
    currentTheme = 'light',
    currentMode = 'balanced',
    onClose = () => {},
    onSelectHistory = () => {},
    onNavigateView = () => {},
    onSetMode = () => {},
    onToggleTheme = () => {},
    onTriggerRecording = () => {}
  }: CommandPaletteProps = $props();

  let query = $state('');
  let selectedIndex = $state(0);
  let inputRef = $state<HTMLInputElement | null>(null);

  interface CommandItem {
    id: string;
    category: 'actions' | 'history' | 'navigation' | 'modes';
    title: string;
    description?: string;
    shortcut?: string;
    icon: string;
    action: () => void;
  }

  const baseCommands = $derived.by<CommandItem[]>(() => {
    const list: CommandItem[] = [
      {
        id: 'cmd-record',
        category: 'actions',
        title: 'Начать диктовку',
        description: 'Запустить голосовой ввод',
        shortcut: 'F9',
        icon: 'mic',
        action: () => { onTriggerRecording(); onClose(); }
      },
      {
        id: 'cmd-nav-history',
        category: 'navigation',
        title: 'Перейти к истории',
        description: 'Просмотр всех голосовых записей',
        icon: 'history',
        action: () => { onNavigateView('history'); onClose(); }
      },
      {
        id: 'cmd-nav-settings',
        category: 'navigation',
        title: 'Открыть настройки',
        description: 'Микрофон, горячие клавиши и API',
        icon: 'settings',
        action: () => { onNavigateView('settings'); onClose(); }
      },
      {
        id: 'cmd-theme',
        category: 'actions',
        title: currentTheme === 'light' ? 'Переключить на Тёмную тему' : 'Переключить на Светлую тему',
        description: 'Сменить оформление интерфейса',
        icon: currentTheme === 'light' ? 'moon' : 'sun',
        action: () => { onToggleTheme(); onClose(); }
      },
      {
        id: 'cmd-mode-raw',
        category: 'modes',
        title: 'Режим: Как сказано',
        description: 'Сохранять дословную транскрипцию без LLM',
        icon: 'check',
        action: () => { onSetMode('raw'); onClose(); }
      },
      {
        id: 'cmd-mode-minimal',
        category: 'modes',
        title: 'Режим: Аккуратно',
        description: 'Исправлять только опечатки и пунктуацию',
        icon: 'check',
        action: () => { onSetMode('minimal'); onClose(); }
      },
      {
        id: 'cmd-mode-balanced',
        category: 'modes',
        title: 'Режим: Сбалансированно',
        description: 'Убирать повторы и слова-паразиты',
        icon: 'check',
        action: () => { onSetMode('balanced'); onClose(); }
      },
      {
        id: 'cmd-mode-business',
        category: 'modes',
        title: 'Режим: Профессионально',
        description: 'Преобразовывать в четкий деловой стиль',
        icon: 'check',
        action: () => { onSetMode('business'); onClose(); }
      }
    ];
    return list;
  });

  const filteredItems = $derived.by<CommandItem[]>(() => {
    const q = query.trim().toLowerCase();
    const historyCmds: CommandItem[] = historyItems.map(h => ({
      id: `history-${h.id}`,
      category: 'history',
      title: h.processedText,
      description: `${h.dateGroup === 'today' ? 'Сегодня' : 'Ранее'} · ${h.duration ?? 0}с`,
      icon: 'document',
      action: () => { onNavigateView('history'); onSelectHistory(h.id); onClose(); }
    }));

    const all = [...baseCommands, ...historyCmds];
    if (!q) return all.slice(0, 10);

    return all.filter(item =>
      item.title.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))
    ).slice(0, 12);
  });

  $effect(() => {
    if (visible) {
      query = '';
      selectedIndex = 0;
      setTimeout(() => inputRef?.focus(), 50);
    }
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!visible) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % Math.max(1, filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + filteredItems.length) % Math.max(1, filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filteredItems[selectedIndex];
      if (item) item.action();
    }
  };
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if visible}
  <div
    class="palette-backdrop"
    transition:fade={{ duration: 120 }}
    onclick={onClose}
    onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
    role="presentation"
  >
    <div
      class="palette-card"
      transition:scale={{ duration: 150, start: 0.96 }}
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <!-- Search input header -->
      <div class="palette-header">
        <svg class="palette-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          bind:this={inputRef}
          type="text"
          class="palette-input"
          placeholder="Поиск по командам и истории (Ctrl+K)…"
          bind:value={query}
        />
        <kbd class="palette-esc-badge">Esc</kbd>
      </div>

      <!-- Command list -->
      <div class="palette-results">
        {#if filteredItems.length === 0}
          <div class="palette-empty">Ничего не найдено</div>
        {:else}
          {#each filteredItems as item, idx (item.id)}
            <div
              class="palette-item"
              class:selected={idx === selectedIndex}
              onclick={item.action}
              onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') item.action(); }}
              onmouseenter={() => { selectedIndex = idx; }}
              role="option"
              aria-selected={idx === selectedIndex}
              tabindex="0"
            >
              <div class="item-icon-wrapper">
                {#if item.icon === 'mic'}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>
                {:else if item.icon === 'history'}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                {:else if item.icon === 'settings'}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                {:else if item.icon === 'sun'}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                {:else if item.icon === 'moon'}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                {:else}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                {/if}
              </div>

              <div class="item-text-group">
                <span class="item-title">{item.title}</span>
                {#if item.description}
                  <span class="item-desc">{item.description}</span>
                {/if}
              </div>

              {#if item.shortcut}
                <kbd class="item-shortcut">{item.shortcut}</kbd>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .palette-backdrop {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
    z-index: 999;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 14vh;
  }

  .palette-card {
    width: 580px;
    max-width: 90vw;
    background: var(--bg-surface, var(--surface-color, #FFFFFF));
    border: 1px solid var(--border-color, #E4E6EA);
    border-radius: 12px;
    box-shadow: var(--shadow-popover, var(--shadow-lg, 0 12px 32px rgba(0, 0, 0, 0.14)));
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .palette-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color, #E4E6EA);
    gap: 10px;
  }

  .palette-search-icon {
    width: 18px;
    height: 18px;
    color: var(--sec-text, #717680);
    flex-shrink: 0;
  }

  .palette-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 15px;
    color: var(--main-text, #15171A);
    outline: none;
  }

  .palette-esc-badge {
    font-size: 11px;
    color: var(--sec-text, #717680);
    background: var(--bg-control, var(--secondary-bg, #F0F1F3));
    border: 1px solid var(--border-color, #E4E6EA);
    border-radius: 4px;
    padding: 2px 6px;
  }

  .palette-results {
    max-height: 380px;
    overflow-y: auto;
    padding: 6px;
  }

  .palette-empty {
    padding: 24px;
    text-align: center;
    font-size: 13px;
    color: var(--sec-text, #717680);
  }

  .palette-item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border-radius: 8px;
    gap: 12px;
    cursor: pointer;
    user-select: none;
    transition: background 80ms ease;
  }

  .palette-item.selected {
    background: var(--bg-control, var(--hover-bg, rgba(0, 0, 0, 0.04)));
  }

  .item-icon-wrapper {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: var(--bg-control, var(--secondary-bg, #F0F1F3));
    border: 1px solid var(--border-subtle, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--sec-text, #717680);
    flex-shrink: 0;
  }

  .item-icon-wrapper svg {
    width: 15px;
    height: 15px;
  }

  .item-text-group {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }

  .item-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--main-text, #15171A);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-desc {
    font-size: 12px;
    color: var(--sec-text, #717680);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-shortcut {
    font-size: 11px;
    font-weight: 600;
    color: var(--sec-text, #717680);
    background: var(--bg-control, var(--secondary-bg, #F0F1F3));
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid var(--border-color, #E4E6EA);
  }
</style>
