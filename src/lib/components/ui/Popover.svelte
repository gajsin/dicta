<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fly } from 'svelte/transition';

  interface Props {
    open?: boolean;
    align?: 'left' | 'right' | 'center';
    onClose?: () => void;
    trigger?: Snippet;
    children?: Snippet;
  }

  let {
    open = $bindable(false),
    align = 'left',
    onClose = () => {},
    trigger,
    children
  }: Props = $props();

  let rootRef = $state<HTMLDivElement | null>(null);

  const toggle = () => {
    open = !open;
    if (!open) onClose();
  };

  const close = () => {
    open = false;
    onClose();
  };

  $effect(() => {
    if (!open) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (rootRef && !rootRef.contains(e.target as Node)) {
        close();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  });
</script>

<div class="ui-popover-root" bind:this={rootRef}>
  {#if trigger}
    <div
      class="popover-trigger-wrapper"
      onclick={toggle}
      role="button"
      tabindex="0"
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggle(); }}
    >
      {@render trigger()}
    </div>
  {/if}

  {#if open}
    <div
      class="ui-popover-card align-{align}"
      role="dialog"
      transition:fly={{ y: 4, duration: 120 }}
    >
      {#if children}{@render children()}{/if}
    </div>
  {/if}
</div>

<style>
  .ui-popover-root {
    position: relative;
    display: inline-block;
  }

  .popover-trigger-wrapper {
    display: inline-flex;
    outline: none;
  }

  .ui-popover-card {
    position: absolute;
    top: calc(100% + 6px);
    z-index: 500;
    min-width: 180px;
    padding: 12px;
    background: var(--bg-surface, #FFFFFF);
    border: 1px solid var(--border-color, #E2E4E8);
    border-radius: var(--radius-card, 12px);
    box-shadow: var(--shadow-popover, 0 10px 28px rgba(0, 0, 0, 0.16));
  }

  .align-left {
    left: 0;
  }

  .align-right {
    right: 0;
  }

  .align-center {
    left: 50%;
    transform: translateX(-50%);
  }
</style>
