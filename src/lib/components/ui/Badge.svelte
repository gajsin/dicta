<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'secondary';
    dot?: boolean;
    class?: string;
    children?: Snippet;
  }

  let {
    variant = 'default',
    dot = false,
    class: className = '',
    children
  }: Props = $props();
</script>

<span class="ui-badge variant-{variant} {className}">
  {#if dot}
    <span class="badge-dot"></span>
  {/if}
  {#if children}{@render children()}{/if}
</span>

<style>
  .ui-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 8px;
    border-radius: var(--radius-xs, 4px);
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 500;
    line-height: 16px;
    white-space: nowrap;
    user-select: none;
    box-sizing: border-box;
  }

  .badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }

  .variant-default {
    background: var(--badge-bg, var(--bg-control, #EDEEF2));
    color: var(--text-secondary, #6E737D);
    border: 1px solid var(--border-subtle, transparent);
  }

  .variant-secondary {
    background: var(--bg-control, var(--secondary-bg, #F0F1F4));
    color: var(--text-primary, #15171A);
    border: 1px solid var(--border-color, #E2E4E8);
  }

  .variant-accent {
    background: var(--accent-soft, rgba(91, 95, 239, 0.12));
    color: var(--accent-text, var(--accent-primary, #5B5FEF));
    border: 1px solid var(--accent-border, rgba(91, 95, 239, 0.22));
    font-weight: 600;
  }

  .variant-success {
    background: var(--success-bg, rgba(36, 161, 100, 0.1));
    color: var(--success-color, #24A164);
    border: 1px solid var(--success-border, transparent);
  }

  .variant-warning {
    background: var(--warning-bg, rgba(217, 119, 6, 0.1));
    color: var(--warning-color, #D97706);
    border: 1px solid var(--warning-border, transparent);
  }

  .variant-danger {
    background: var(--danger-bg, rgba(229, 72, 77, 0.1));
    color: var(--danger-color, #E5484D);
    border: 1px solid var(--danger-border, transparent);
  }
</style>
