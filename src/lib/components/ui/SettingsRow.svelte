<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    description?: string;
    alignTop?: boolean;
    clickable?: boolean;
    disabled?: boolean;
    class?: string;
    onclick?: (e: MouseEvent | KeyboardEvent) => void;
    children?: Snippet;
  }

  let {
    title,
    description = '',
    alignTop = false,
    clickable = false,
    disabled = false,
    class: className = '',
    onclick,
    children
  }: Props = $props();

  const handleClick = (e: MouseEvent) => {
    if (disabled || !clickable || !onclick) return;
    // Don't duplicate click if user clicked directly on interactive child control (button, input, select)
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, [role="switch"], [role="listbox"]')) {
      return;
    }
    onclick(e);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (disabled || !clickable || !onclick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      const target = e.target as HTMLElement;
      if (target.closest('button, input, select, [role="switch"], [role="listbox"]')) {
        return;
      }
      e.preventDefault();
      onclick(e);
    }
  };
</script>

{#if clickable && !disabled}
  <div
    class="ui-settings-row {className}"
    class:align-top={alignTop}
    class:clickable={true}
    role="button"
    tabindex="0"
    onclick={handleClick}
    onkeydown={handleKeyDown}
  >
    <div class="row-info">
      <span class="row-title">{title}</span>
      {#if description}
        <span class="row-description">{description}</span>
      {/if}
    </div>

    <div
      class="row-control"
      role="presentation"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      {#if children}{@render children()}{/if}
    </div>
  </div>
{:else}
  <div
    class="ui-settings-row {className}"
    class:align-top={alignTop}
    class:disabled={disabled}
  >
    <div class="row-info">
      <span class="row-title">{title}</span>
      {#if description}
        <span class="row-description">{description}</span>
      {/if}
    </div>

    <div class="row-control">
      {#if children}{@render children()}{/if}
    </div>
  </div>
{/if}

<style>
  .ui-settings-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    min-height: 80px;
    padding: 18px 24px;
    box-sizing: border-box;
    border-bottom: 1px solid var(--border-subtle, #1D2027);
    transition: background-color 120ms ease;
    border-radius: 0;
  }

  .ui-settings-row:first-child {
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
  }

  .ui-settings-row:last-child {
    border-bottom: none;
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
  }

  .ui-settings-row.align-top {
    align-items: flex-start;
  }

  .ui-settings-row.clickable {
    cursor: pointer;
    user-select: none;
  }

  .ui-settings-row.clickable:hover {
    background: var(--hover-surface, var(--hover-bg, rgba(0, 0, 0, 0.02)));
  }

  .ui-settings-row.clickable:focus-visible {
    outline: 2px solid var(--focus-ring, var(--border-focus, #5B5FEF));
    outline-offset: -2px;
  }

  .ui-settings-row.disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .row-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    width: 368px;
    max-width: 380px;
    flex-shrink: 0;
  }

  .row-title {
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    color: var(--text-primary, #E5E7EB);
    letter-spacing: -0.005em;
  }

  .row-description {
    font-size: 12.5px;
    line-height: 18px;
    color: var(--text-secondary, #9CA3AF);
    max-width: 380px;
  }

  .row-control {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    width: 260px;
    flex-shrink: 0;
  }
</style>
