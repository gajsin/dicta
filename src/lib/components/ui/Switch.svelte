<script lang="ts">
  interface Props {
    checked?: boolean;
    disabled?: boolean;
    ariaLabel?: string;
    title?: string;
    class?: string;
    onchange?: (checked: boolean) => void;
  }

  let {
    checked = $bindable(false),
    disabled = false,
    ariaLabel = '',
    title = '',
    class: className = '',
    onchange
  }: Props = $props();

  const toggle = () => {
    if (disabled) return;
    checked = !checked;
    if (onchange) onchange(checked);
  };
</script>

<button
  type="button"
  role="switch"
  aria-checked={checked}
  aria-label={ariaLabel || title}
  {title}
  {disabled}
  class="ui-switch {className}"
  class:checked
  onclick={toggle}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  }}
>
  <span class="switch-thumb"></span>
</button>

<style>
  .ui-switch {
    position: relative;
    display: inline-flex;
    align-items: center;
    width: 36px;
    height: 20px;
    min-height: 20px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    user-select: none;
    outline: none;
    box-sizing: border-box;
  }

  .ui-switch:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .switch-thumb {
    position: absolute;
    top: 0;
    left: 0;
    width: 36px;
    height: 20px;
    background: var(--bg-control, #1F232B);
    border: 1px solid var(--border-color, #242830);
    box-sizing: border-box;
    border-radius: var(--radius-full, 9999px);
    transition: background 160ms ease, border-color 160ms ease;
  }

  .switch-thumb::after {
    content: '';
    position: absolute;
    top: 1px;
    left: 1px;
    width: 16px;
    height: 16px;
    background: #FFFFFF;
    border-radius: 50%;
    transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  }

  .ui-switch:hover:not(:disabled) .switch-thumb {
    border-color: var(--border-strong, #2E333F);
    background: var(--hover-surface, #252A34);
  }

  .checked .switch-thumb {
    background: var(--accent-primary, #5B5FEF);
    border-color: transparent;
  }

  .checked:hover:not(:disabled) .switch-thumb {
    background: var(--accent-hover, #4B4FEB);
    border-color: transparent;
  }

  .checked .switch-thumb::after {
    transform: translateX(16px);
  }

  .ui-switch:focus-visible .switch-thumb {
    outline: 2px solid var(--focus-ring, var(--border-focus, #5B5FEF));
    outline-offset: 2px;
  }
</style>
