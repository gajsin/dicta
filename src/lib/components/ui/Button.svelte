<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
    size?: 'default' | 'compact';
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    title?: string;
    ariaLabel?: string;
    class?: string;
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
  }

  let {
    variant = 'secondary',
    size = 'default',
    disabled = false,
    type = 'button',
    title,
    ariaLabel,
    class: className = '',
    onclick,
    children
  }: Props = $props();
</script>

<button
  {type}
  class="ui-button variant-{variant} size-{size} {className}"
  {disabled}
  {title}
  aria-label={ariaLabel || title}
  {onclick}
>
  {#if children}{@render children()}{/if}
</button>

<style>
  .ui-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: 1px solid transparent;
    border-radius: var(--radius-control, 8px);
    font-family: var(--font-sans);
    font-weight: 500;
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    transition: background 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease;
    outline: none;
    min-width: 32px;
    box-sizing: border-box;
  }

  .ui-button:focus {
    outline: none;
  }

  .ui-button:focus-visible {
    outline: none;
    border-color: var(--accent-primary, var(--focus-ring, #5B5FEF));
    box-shadow: 0 0 0 1px var(--accent-primary, var(--focus-ring, #5B5FEF));
  }

  .ui-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* Sizes */
  .size-default {
    height: var(--control-height, 36px);
    padding: 0 14px;
    font-size: 13px;
    line-height: 20px;
  }

  .size-compact {
    height: var(--control-height-sm, 32px);
    padding: 0 10px;
    font-size: 12px;
    line-height: 18px;
  }

  /* Variants */
  .variant-primary {
    background: var(--accent-color, #5B5FEF);
    color: #FFFFFF;
    border-color: transparent;
    font-weight: 600;
  }

  .variant-primary:hover {
    background: var(--accent-hover, #4B4FEB);
  }

  .variant-primary:active {
    background: var(--accent-pressed, #4E52DF);
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
    background: var(--active-bg, rgba(255, 255, 255, 0.08));
  }

  .variant-ghost {
    background: transparent;
    border-color: transparent;
    color: var(--text-secondary, #9CA3AF);
  }

  .variant-ghost:hover {
    background: var(--hover-surface, var(--hover-bg, rgba(255, 255, 255, 0.05)));
    color: var(--text-primary, #E5E7EB);
  }

  .variant-ghost:active {
    background: var(--active-bg, rgba(255, 255, 255, 0.08));
  }

  .variant-destructive {
    background: var(--danger-color, #E5484D);
    color: #FFFFFF;
    border-color: transparent;
    font-weight: 600;
  }

  .variant-destructive:hover {
    background: #D43B40;
  }
</style>
