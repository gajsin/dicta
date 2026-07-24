<script lang="ts">
  import { fade } from 'svelte/transition';

  interface Props {
    itemCount?: number;
    onClose: () => void;
    onConfirmClear: () => void;
  }

  let {
    itemCount = 0,
    onClose,
    onConfirmClear,
  }: Props = $props();
</script>

<div class="modal-backdrop" transition:fade={{ duration: 120 }} role="dialog" aria-modal="true">
  <div class="modal-card">
    <div class="modal-icon-badge">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
    </div>
    <h3 class="modal-title">Очистить всю историю?</h3>
    <p class="modal-desc">
      Это действие удалит {itemCount > 0 ? `${itemCount} сохранённых записей` : 'все сохранённые записи'} диктовок. Вы сможете отменить очистку сразу после этого.
    </p>
    <div class="modal-actions">
      <button class="modal-btn secondary" onclick={onClose}>Отмена</button>
      <button class="modal-btn danger-filled" onclick={onConfirmClear}>Очистить историю</button>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-card {
    background: var(--bg-surface, #FFFFFF);
    border: 1px solid var(--border-color, #E2E4E8);
    border-radius: var(--radius-card, 12px);
    box-shadow: var(--shadow-popover, var(--shadow-lg, 0 12px 32px rgba(0, 0, 0, 0.12)));
    padding: 24px;
    max-width: 400px;
    width: 90%;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .modal-icon-badge {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--danger-bg, rgba(229, 72, 77, 0.09));
    color: var(--danger-color, #E5484D);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-icon-badge svg {
    width: 20px;
    height: 20px;
  }

  .modal-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    color: var(--main-text, #15171A);
  }

  .modal-desc {
    font-size: var(--text-sm, 12px);
    color: var(--sec-text, #6E737D);
    margin: 0;
    line-height: 1.4;
  }

  .modal-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
  }

  .modal-btn {
    padding: 8px 16px;
    border-radius: var(--radius-md, 8px);
    font-size: var(--text-sm, 12px);
    font-weight: 600;
    cursor: pointer;
    border: 1px solid var(--border-color, #E2E4E8);
    background: var(--bg-control, var(--bg-surface, #FFFFFF));
    color: var(--main-text, #15171A);
    transition: all 100ms ease;
  }

  .modal-btn.secondary:hover {
    background: var(--hover-surface, var(--hover-bg, rgba(0, 0, 0, 0.04)));
  }

  .modal-btn.danger-filled {
    background: var(--danger-color, #E5484D);
    color: #FFFFFF;
    border-color: transparent;
  }

  .modal-btn.danger-filled:hover {
    background: #D43B40;
  }
</style>
