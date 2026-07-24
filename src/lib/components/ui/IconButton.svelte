<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'ghost' | 'secondary' | 'primary' | 'destructive';
    size?: 'default' | 'compact';
    active?: boolean;
    disabled?: boolean;
    title?: string;
    ariaLabel?: string;
    class?: string;
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
  }

  let {
    variant = 'ghost',
    size = 'compact',
    active = false,
    disabled = false,
    title,
    ariaLabel,
    class: className = '',
    onclick,
    children
  }: Props = $props();
</script>

<button
  type="button"
  class="ui-icon-button variant-{variant} size-{size} {className}"
  class:active
  {disabled}
  {title}
  aria-label={ariaLabel || title}
  {onclick}
>
  {#if children}{@render children()}{/if}
</button>

<style>
  .ui-icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: var(--radius-sm, 6px);
    background: transparent;
    color: var(--text-secondary, #9CA3AF);
    cursor: pointer;
    user-select: none;
    transition: background 100ms ease, border-color 100ms ease, color 100ms ease;
    outline: none;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .ui-icon-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* Standard Sizes */
  .size-compact {
    width: 32px;
    height: 32px;
  }

  .size-default {
    width: 36px;
    height: 36px;
  }

  :global(.ui-icon-button svg) {
    width: 16px;
    height: 16px;
  }

  /* Variants */
  .variant-ghost:hover {
    background: var(--hover-bg, rgba(255, 255, 255, 0.05));
    color: var(--text-primary, #E5E7EB);
  }

  .variant-ghost:active {
    background: var(--active-bg, rgba(255, 255, 255, 0.08));
  }

  .variant-secondary {
    background: var(--bg-control, #1F232B);
    border-color: var(--border-color, #242830);
    color: var(--text-primary, #E5E7EB);
  }

  .variant-secondary:hover {
    background: var(--hover-surface, #252A34);
    border-color: var(--border-strong, #2E333F);
  }

  .variant-secondary:active {
    background: var(--active-bg, #292E3A);
  }

  .variant-primary {
    background: var(--accent-primary, #5B5FEF);
    color: var(--accent-foreground, #FFFFFF);
  }

  .variant-primary:hover {
    background: var(--accent-hover, #4B4FEB);
  }

  .variant-destructive:hover {
    background: var(--danger-bg, rgba(239, 68, 68, 0.12));
    color: var(--danger-color, #EF4444);
  }

  .ui-icon-button:focus {
    outline: none;
  }

  .ui-icon-button:focus-visible {
    outline: none;
    border-color: var(--accent-primary, var(--focus-ring, #5B5FEF));
    box-shadow: 0 0 0 1px var(--accent-primary, var(--focus-ring, #5B5FEF));
  }

  .active {
    background: var(--hover-surface, #252A34) !important;
    color: var(--text-primary, #E5E7EB) !important;
    border-color: transparent !important;
  }
</style>
