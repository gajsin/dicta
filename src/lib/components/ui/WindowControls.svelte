<script lang="ts">
  import { getCurrentWindow } from '@tauri-apps/api/window';

  const windowInstance = (() => {
    try {
      return getCurrentWindow();
    } catch {
      return null;
    }
  })();

  const handleMinimize = () => { windowInstance?.minimize(); };
  const handleMaximize = async () => {
    if (await windowInstance?.isMaximized()) {
      windowInstance?.unmaximize();
    } else {
      windowInstance?.maximize();
    }
  };
  const handleClose = () => { windowInstance?.hide(); };
</script>

<div class="win-controls">
  <button type="button" class="win-btn close" onclick={handleClose} title="Закрыть в трей" aria-label="Закрыть окно в трей">
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4l8 8M12 4l-8 8"></path></svg>
  </button>
</div>

<style>
  .win-controls {
    display: flex;
    align-items: center;
    height: 100%;
  }

  .win-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm, 6px);
    color: var(--text-secondary, #9CA3AF);
    cursor: pointer;
    transition: background 120ms ease, color 120ms ease;
    outline: none;
    box-sizing: border-box;
  }

  .win-btn svg {
    width: 16px;
    height: 16px;
  }

  .win-btn:hover {
    background: var(--hover-bg, rgba(255, 255, 255, 0.05));
    color: var(--text-primary, #E5E7EB);
  }

  .win-btn:active {
    background: var(--active-bg, rgba(255, 255, 255, 0.08));
  }

  .win-btn.close:hover {
    background: var(--danger-color, #EF4444);
    color: #FFFFFF;
  }

  .win-btn.close:active {
    background: #DC2626;
    color: #FFFFFF;
  }

  .win-btn:focus {
    outline: none;
  }

  .win-btn:focus-visible {
    outline: 2px solid var(--focus-ring, #5B5FEF);
    outline-offset: 1px;
  }
</style>
