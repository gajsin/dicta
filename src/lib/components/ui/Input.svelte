<script lang="ts">
  interface Props {
    value?: string;
    type?: 'text' | 'password' | 'search';
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    size?: 'default' | 'compact';
    ariaLabel?: string;
    class?: string;
    oninput?: (e: Event & { currentTarget: HTMLInputElement }) => void;
    onchange?: (e: Event & { currentTarget: HTMLInputElement }) => void;
    onkeydown?: (e: KeyboardEvent) => void;
  }

  let {
    value = $bindable(''),
    type = 'text',
    placeholder = '',
    disabled = false,
    readonly = false,
    size = 'default',
    ariaLabel = '',
    class: className = '',
    oninput,
    onchange,
    onkeydown
  }: Props = $props();
</script>

<div class="ui-input-wrapper size-{size} {className}">
  <input
    {type}
    bind:value
    {placeholder}
    {disabled}
    {readonly}
    aria-label={ariaLabel || placeholder}
    class="ui-input"
    {oninput}
    {onchange}
    {onkeydown}
  />
  {#if value && !disabled && !readonly}
    <button
      type="button"
      class="clear-btn"
      tabindex="-1"
      onclick={() => { value = ''; }}
      title="Очистить"
    >
      ✕
    </button>
  {/if}
</div>

<style>
  .ui-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
  }

  .ui-input {
    width: 100%;
    border: 1px solid var(--border-color, #E2E4E8);
    border-radius: var(--radius-control, 8px);
    background: var(--input-bg, #FFFFFF);
    color: var(--text-primary, #15171A);
    font-family: var(--font-sans);
    font-size: 13px;
    padding: 0 30px 0 12px;
    outline: none;
    transition: border-color 120ms ease, box-shadow 120ms ease, background 120ms ease;
    box-sizing: border-box;
  }

  .size-default .ui-input {
    height: var(--control-height, 36px);
  }

  .size-compact .ui-input {
    height: var(--control-height-sm, 32px);
    font-size: 12px;
  }

  .ui-input::placeholder {
    color: var(--text-tertiary, #9DA2AC);
    opacity: 1;
  }

  .ui-input:hover:not(:disabled) {
    border-color: var(--border-strong, #D1D5DB);
  }

  .ui-input:focus-visible {
    border-color: var(--border-focus, #5B5FEF);
    outline: none;
    box-shadow: 0 0 0 1px var(--border-focus, #5B5FEF);
  }

  .ui-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    color: var(--text-disabled, #4B505C);
  }

  .clear-btn {
    position: absolute;
    right: 8px;
    border: none;
    background: transparent;
    color: var(--text-tertiary, #9DA2AC);
    font-size: 11px;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .clear-btn:hover {
    color: var(--text-primary);
  }
</style>
