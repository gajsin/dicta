<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { SelectOption } from './types';


  interface Props {
    value: string;
    options: SelectOption[];
    placeholder?: string;
    ariaLabel?: string;
    disabled?: boolean;
    onChange?: (val: string) => void;
  }

  let {
    value = $bindable(''),
    options = [],
    placeholder = 'Выберите',
    ariaLabel = 'Выбор',
    disabled = false,
    onChange = () => {}
  }: Props = $props();

  let open = $state(false);
  let openUpwards = $state(false);
  let root: HTMLDivElement | undefined;
  let menuContainer = $state<HTMLDivElement | undefined>(undefined);

  let highlightedIndex = $state(-1);

  const selectedOption = () => options.find((option) => option.value === value);

  const close = () => {
    open = false;
    highlightedIndex = -1;
  };

  const toggleOpen = () => {
    if (disabled) return;
    if (!open && root) {
      const rect = root.getBoundingClientRect();
      const distFromBottom = window.innerHeight - rect.bottom;
      openUpwards = distFromBottom < 230 && rect.top > 230;
      const currentIdx = options.findIndex(o => o.value === value);
      highlightedIndex = currentIdx >= 0 ? currentIdx : 0;
    }
    open = !open;
  };

  const choose = (option: SelectOption) => {
    if (option.disabled) return;
    value = option.value;
    onChange(option.value);
    close();
  };

  const scrollHighlightedIntoView = (idx: number) => {
    if (!menuContainer) return;
    const items = menuContainer.querySelectorAll<HTMLButtonElement>('.select-option');
    if (items[idx]) {
      items[idx].scrollIntoView({ block: 'nearest' });
    }
  };

  const handleButtonKeydown = (event: KeyboardEvent) => {
    if (disabled) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        toggleOpen();
      } else if (options.length > 0) {
        let nextIdx = (highlightedIndex + 1) % options.length;
        let attempts = 0;
        while (options[nextIdx]?.disabled && attempts < options.length) {
          nextIdx = (nextIdx + 1) % options.length;
          attempts++;
        }
        highlightedIndex = nextIdx;
        scrollHighlightedIntoView(highlightedIndex);
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        toggleOpen();
      } else if (options.length > 0) {
        let prevIdx = (highlightedIndex - 1 + options.length) % options.length;
        let attempts = 0;
        while (options[prevIdx]?.disabled && attempts < options.length) {
          prevIdx = (prevIdx - 1 + options.length) % options.length;
          attempts++;
        }
        highlightedIndex = prevIdx;
        scrollHighlightedIntoView(highlightedIndex);
      }
      return;
    }

    if (event.key === 'Home' && open && options.length > 0) {
      event.preventDefault();
      highlightedIndex = 0;
      scrollHighlightedIntoView(0);
      return;
    }

    if (event.key === 'End' && open && options.length > 0) {
      event.preventDefault();
      highlightedIndex = options.length - 1;
      scrollHighlightedIntoView(options.length - 1);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open && highlightedIndex >= 0 && options[highlightedIndex] && !options[highlightedIndex].disabled) {
        choose(options[highlightedIndex]);
      } else {
        toggleOpen();
      }
    }
  };

  $effect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (root && !root.contains(event.target as Node)) {
        close();
      }
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('keydown', handleKeydown, true);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('keydown', handleKeydown, true);
    };
  });
</script>

<div class="ui-select" bind:this={root}>
  <button
    type="button"
    class="select-trigger"
    class:open
    class:disabled
    disabled={disabled}
    aria-label={ariaLabel}
    aria-haspopup="listbox"
    aria-expanded={open}
    title={selectedOption()?.label || placeholder}
    onclick={toggleOpen}
    onkeydown={handleButtonKeydown}
  >
    <span class="selected-text">
      <span class="selected-label" title={selectedOption()?.label || placeholder}>{selectedOption()?.label || placeholder}</span>
      {#if selectedOption()?.detail}
        <span class="selected-detail">{selectedOption()?.detail}</span>
      {/if}
    </span>
    <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  </button>

  {#if open}
    <div
      bind:this={menuContainer}
      class="select-menu"
      class:open-upwards={openUpwards}
      role="listbox"
      tabindex="-1"
      aria-label={ariaLabel}
      transition:fly={{ y: openUpwards ? -4 : 4, duration: 120 }}
    >
      {#if options.length === 0}
        <div class="select-empty">Список пуст</div>
      {:else}
        {#each options as option, index (option.value + '-' + index)}
          <button
            type="button"
            class="select-option"
            class:active={option.value === value}
            class:highlighted={index === highlightedIndex}
            class:disabled={option.disabled}
            disabled={option.disabled}
            title={option.disabledReason || option.detail || option.label}
            role="option"
            aria-selected={option.value === value}
            onclick={() => choose(option)}
            onmouseenter={() => { if (!option.disabled) highlightedIndex = index; }}
          >
            <div class="option-content">
              <span class="option-main" title={option.label}>{option.label}</span>
              {#if option.disabledReason || option.detail}
                <span class="option-detail">{option.disabledReason || option.detail}</span>
              {/if}
            </div>
            {#if option.value === value}
              <svg class="check-icon" viewBox="0 0 24 24" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            {/if}
          </button>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .ui-select {
    position: relative;
    width: 100%;
    min-width: 0;
  }

  .select-trigger {
    width: 100%;
    min-width: 0;
    height: 40px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 14px;
    align-items: center;
    gap: 10px;
    padding: 4px 12px;
    border: 1px solid var(--border-color, #242830);
    border-radius: var(--radius-control, 8px);
    background: var(--input-bg, var(--bg-control, #1F232B));
    color: var(--text-primary, #E5E7EB);
    font-family: var(--font-sans);
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    outline: none;
    transition: border-color 0.12s ease, background-color 0.12s ease, box-shadow 0.12s ease;
  }

  .select-trigger:hover:not(.disabled),
  .select-trigger.open {
    border-color: var(--border-strong, #2E333F);
    background: var(--hover-surface, #252A34);
  }

  .select-trigger:focus {
    outline: none;
    box-shadow: none;
  }

  .select-trigger:focus-visible {
    outline: none;
    border-color: var(--border-focus, #5B5FEF);
    box-shadow: 0 0 0 1px var(--border-focus, #5B5FEF);
  }

  .select-trigger.disabled {
    opacity: 0.55;
    cursor: not-allowed;
    background: var(--input-bg, var(--bg-control, #1F232B));
    color: var(--text-disabled, #4B505D);
  }

  .selected-text {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1px;
    overflow: hidden;
    min-width: 0;
    padding-right: 4px;
  }

  .selected-label,
  .selected-detail,
  .option-main,
  .option-detail {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .selected-label,
  .option-main {
    color: var(--text-primary, #E5E7EB);
    font-weight: 550;
    font-size: 13px;
    line-height: 1.2;
  }

  .selected-detail,
  .option-detail {
    color: var(--text-secondary, #9CA3AF);
    font-size: 11.5px;
    font-weight: 400;
    line-height: 1.2;
  }

  .chevron {
    width: 14px;
    height: 14px;
    color: var(--text-secondary, #9CA3AF);
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: transform 0.2s, color 0.2s;
    flex-shrink: 0;
  }

  .select-trigger.open .chevron {
    transform: rotate(180deg);
    color: var(--focus-ring, var(--border-focus, #5B5FEF));
  }

  .select-menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    width: max-content;
    min-width: 100%;
    max-width: 480px;
    z-index: 300;
    max-height: 230px;
    overflow-y: auto;
    padding: 4px;
    border: 1px solid var(--border-color, #E2E4E8);
    border-radius: var(--radius-card, 12px);
    background: var(--bg-surface, #FFFFFF);
    box-shadow: var(--shadow-popover, 0 10px 28px rgba(0, 0, 0, 0.16));
  }

  .select-menu.open-upwards {
    top: auto;
    bottom: calc(100% + 4px);
  }

  .select-empty {
    padding: 10px;
    font-size: 12px;
    color: var(--text-secondary, #6E737D);
    text-align: center;
  }

  .select-option {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 10px;
    border: 0;
    border-radius: var(--radius-sm, 6px);
    background: transparent;
    font-family: var(--font-sans);
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    outline: none;
    transition: background-color 0.1s, color 0.1s;
  }

  .option-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  .select-option:hover,
  .select-option.highlighted {
    background: var(--hover-bg, rgba(0, 0, 0, 0.05));
  }

  .select-option.active {
    background: var(--accent-soft, rgba(91, 95, 239, 0.12));
    border-left: 2px solid var(--accent-primary, #5B5FEF);
  }

  .select-option.active .option-main {
    color: var(--text-primary, #15171A);
    font-weight: 600;
  }

  .select-option.active .option-detail {
    color: var(--text-secondary, #6E737D);
  }

  .check-icon {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
    color: var(--accent-primary, #5B5FEF);
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .select-option.disabled {
    cursor: not-allowed;
    opacity: 0.5;
    color: var(--text-disabled, #4B505C);
  }
</style>
