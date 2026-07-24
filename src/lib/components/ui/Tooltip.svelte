<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade } from 'svelte/transition';

  interface Props {
    text: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    children?: Snippet;
  }

  let {
    text,
    position = 'top',
    delay = 200,
    children
  }: Props = $props();

  let visible = $state(false);
  let timeoutId: number | undefined;

  const show = () => {
    if (!text) return;
    timeoutId = window.setTimeout(() => { visible = true; }, delay);
  };

  const hide = () => {
    if (timeoutId) clearTimeout(timeoutId);
    visible = false;
  };
</script>

<div
  class="ui-tooltip-wrapper"
  role="group"
  onmouseenter={show}
  onmouseleave={hide}
  onfocusin={show}
  onfocusout={hide}
>
  {#if children}{@render children()}{/if}

  {#if visible && text}
    <div
      class="ui-tooltip-bubble position-{position}"
      role="tooltip"
      transition:fade={{ duration: 100 }}
    >
      {text}
    </div>
  {/if}
</div>

<style>
  .ui-tooltip-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .ui-tooltip-bubble {
    position: absolute;
    z-index: 1000;
    padding: 4px 8px;
    background: var(--bg-surface-raised, #18191C);
    color: var(--text-primary, #F4F4F5);
    border: 1px solid var(--border-color, #2A2D35);
    border-radius: var(--radius-xs, 4px);
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 500;
    line-height: 14px;
    white-space: nowrap;
    pointer-events: none;
    box-shadow: var(--shadow-md, 0 4px 14px rgba(0, 0, 0, 0.12));
  }

  .position-top {
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
  }

  .position-bottom {
    top: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
  }

  .position-left {
    right: calc(100% + 6px);
    top: 50%;
    transform: translateY(-50%);
  }

  .position-right {
    left: calc(100% + 6px);
    top: 50%;
    transform: translateY(-50%);
  }
</style>
