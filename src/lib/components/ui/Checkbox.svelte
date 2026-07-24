<script lang="ts">
  interface Props {
    checked?: boolean;
    disabled?: boolean;
    ariaLabel?: string;
    onchange?: (checked: boolean) => void;
  }

  let {
    checked = false,
    disabled = false,
    ariaLabel = 'Флажок выбора',
    onchange
  }: Props = $props();

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    const next = !checked;
    onchange?.(next);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const next = !checked;
      onchange?.(next);
    }
  };
</script>

<button
  type="button"
  class="ui-checkbox"
  class:checked
  class:disabled
  {disabled}
  aria-checked={checked}
  aria-label={ariaLabel}
  role="checkbox"
  tabindex={disabled ? -1 : 0}
  onclick={handleClick}
  onkeydown={handleKeyDown}
>
  {#if checked}
    <svg viewBox="0 0 14 14" fill="none" class="check-svg" aria-hidden="true">
      <path
        d="M2.5 7.2L5.4 10.1L11.5 3.9"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  {/if}
</button>

<style>
  .ui-checkbox {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 6px;
    background: var(--bg-control, var(--secondary-bg, #1F232B));
    border: 1.5px solid var(--border-strong, #2E333F);
    color: var(--accent-foreground, #FFFFFF);
    cursor: pointer;
    padding: 0;
    margin: 0;
    outline: none;
    transition: background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease, transform 100ms ease;
    user-select: none;
    flex-shrink: 0;
    box-sizing: border-box;
  }

  .ui-checkbox:hover:not(.disabled) {
    border-color: var(--accent-primary, #5B5FEF);
    background: var(--hover-surface, rgba(255, 255, 255, 0.05));
  }

  .ui-checkbox:active:not(.disabled) {
    transform: scale(0.92);
  }

  .ui-checkbox:focus-visible {
    outline: 2px solid var(--focus-ring, var(--border-focus, #5B5FEF));
    outline-offset: 2px;
  }

  .ui-checkbox.checked {
    background: var(--accent-primary, var(--accent-color, #5B5FEF));
    border-color: var(--accent-primary, var(--accent-color, #5B5FEF));
    color: var(--accent-foreground, #FFFFFF);
  }

  .ui-checkbox.disabled {
    opacity: 0.45;
    cursor: not-allowed;
    pointer-events: none;
  }

  .check-svg {
    width: 12px;
    height: 12px;
  }
</style>
