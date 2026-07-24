<script lang="ts">
  import { fade } from 'svelte/transition';
  import Button from '../../ui/Button.svelte';
  import SettingsRow from '../../ui/SettingsRow.svelte';
  import { DEFAULT_HOTKEY, formatHotkey } from '../../../settings/hotkey';

  interface Props {
    localHotkey: string;
    isCapturingHotkey: boolean;
    hotkeyErrorMsg?: string;
    onStartCapturingHotkey: () => void;
    onCancelCapturingHotkey: () => void;
    onResetHotkey: () => void;
  }

  let {
    localHotkey = 'F9',
    isCapturingHotkey = false,
    hotkeyErrorMsg = '',
    onStartCapturingHotkey,
    onCancelCapturingHotkey,
    onResetHotkey,
  }: Props = $props();

  const hotkeyKeys = $derived(formatHotkey(localHotkey));
</script>

<SettingsRow
  title="Горячая клавиша диктовки"
  description="Глобальное сочетание клавиш для старта и завершения голосового ввода"
  alignTop={!!hotkeyErrorMsg}
>
  <div class="hotkey-control-block">
    <div class="hotkey-row">
      <button
        type="button"
        class="hotkey-control"
        class:capturing={isCapturingHotkey}
        class:has-error={!!hotkeyErrorMsg}
        onclick={onStartCapturingHotkey}
        aria-label={isCapturingHotkey ? 'Нажмите новое сочетание' : `Изменить горячую клавишу (текущая ${localHotkey})`}
      >
        {#if isCapturingHotkey}
          <span class="capturing-label">Нажмите новую клавишу или сочетание</span>
        {:else}
          <div class="keycaps-wrap">
            {#each hotkeyKeys as key, i (i)}
              {#if i > 0}<span class="key-plus">+</span>{/if}
              <span class="keycap-text">{key}</span>
            {/each}
          </div>
          <span class="hotkey-rebind-tag">Изменить</span>
        {/if}
      </button>

      {#if isCapturingHotkey}
        <Button
          variant="ghost"
          size="compact"
          onclick={onCancelCapturingHotkey}
          ariaLabel="Отменить изменение горячей клавиши"
        >
          Отмена
        </Button>
      {:else if localHotkey !== DEFAULT_HOTKEY}
        <Button
          variant="ghost"
          size="compact"
          onclick={onResetHotkey}
          title="Сбросить сочетание на F9 по умолчанию"
          ariaLabel="Сбросить на F9 по умолчанию"
        >
          Сбросить
        </Button>
      {/if}
    </div>

    {#if hotkeyErrorMsg}
      <div class="hotkey-error-bar" transition:fade={{ duration: 100 }}>
        <svg viewBox="0 0 24 24" class="error-icon" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{hotkeyErrorMsg}</span>
      </div>
    {/if}
  </div>
</SettingsRow>

<style>
  .hotkey-control-block {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    width: min(100%, 330px);
  }

  .hotkey-row {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    width: 100%;
  }

  .hotkey-control {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    height: 36px;
    padding: 0 12px;
    border-radius: var(--radius-control, 8px);
    background: var(--bg-control, #1F232B);
    border: 1px solid var(--border-color, #242830);
    color: var(--text-primary, #E5E7EB);
    cursor: pointer;
    outline: none;
    transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
    box-shadow: none;
    flex: 1 1 240px;
    min-width: 0;
    box-sizing: border-box;
  }

  .hotkey-control:hover {
    border-color: var(--border-strong, #2E333F);
    background: var(--hover-surface, #252A34);
  }

  .hotkey-control:focus-visible {
    outline: none;
    border-color: var(--accent-primary, #5B5FEF);
    box-shadow: 0 0 0 1px var(--accent-primary, #5B5FEF);
  }

  .hotkey-control.capturing {
    border-color: var(--accent-primary, #5B5FEF);
    background: var(--accent-soft, rgba(91, 95, 239, 0.10));
    outline: none;
    justify-content: center;
    text-align: center;
    animation: capturePulse 1.5s infinite ease-in-out;
  }

  .hotkey-control.has-error {
    border-color: var(--danger-color, #E5484D);
    background: var(--danger-bg, rgba(229, 72, 77, 0.08));
  }

  @keyframes capturePulse {
    0%, 100% { border-color: var(--accent-primary, #5B5FEF); opacity: 1; }
    50% { border-color: var(--accent-hover, #4B4FEB); opacity: 0.85; }
  }

  .capturing-label {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--accent-text, var(--accent-primary, #FFA533));
    text-align: center;
    width: 100%;
  }

  .keycaps-wrap {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .key-plus {
    font-size: 11px;
    color: var(--text-secondary, #9CA3AF);
    font-weight: 500;
  }

  .keycap-text {
    font-family: var(--font-mono, monospace);
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    color: var(--text-primary, #E5E7EB);
    background: var(--bg-surface, #FFFFFF);
    padding: 3px 7px;
    border-radius: 5px;
    border: 1px solid var(--border-color, #242830);
    box-shadow: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .hotkey-rebind-tag {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary, #9CA3AF);
    transition: color 120ms ease;
  }

  .hotkey-control:hover .hotkey-rebind-tag {
    color: var(--text-primary, #E5E7EB);
  }

  .hotkey-error-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--danger-color, #E5484D);
    background: var(--danger-bg, rgba(229, 72, 77, 0.08));
    padding: 4px 8px;
    border-radius: 6px;
  }

  .hotkey-error-bar svg {
    width: 14px;
    height: 14px;
    stroke: currentColor;
    fill: none;
    stroke-width: 2;
    flex-shrink: 0;
  }
</style>
