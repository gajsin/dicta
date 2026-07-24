<script lang="ts">
  export type SettingsTab = 'general' | 'processing' | 'providers' | 'personalization';

  interface Props {
    activeTab: SettingsTab;
    onSelectTab: (tab: SettingsTab) => void;
    onClose: () => void;
  }

  let { activeTab, onSelectTab, onClose }: Props = $props();
</script>

<aside class="settings-sidebar">

  <nav class="settings-nav">
    <button
      class="nav-item"
      class:active={activeTab === 'general'}
      onclick={() => onSelectTab('general')}
      title="Основные настройки"
    >
      <div class="nav-icon-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <line x1="21" y1="4" x2="14" y2="4"></line>
          <line x1="10" y1="4" x2="3" y2="4"></line>
          <line x1="21" y1="12" x2="12" y2="12"></line>
          <line x1="8" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="20" x2="16" y2="20"></line>
          <line x1="12" y1="20" x2="3" y2="20"></line>
          <line x1="14" y1="2" x2="14" y2="6"></line>
          <line x1="8" y1="10" x2="8" y2="14"></line>
          <line x1="16" y1="18" x2="16" y2="22"></line>
        </svg>
      </div>
      <span class="nav-label">Основные</span>
    </button>

    <button
      class="nav-item"
      class:active={activeTab === 'processing'}
      onclick={() => onSelectTab('processing')}
      title="Обработка текста"
    >
      <div class="nav-icon-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <line x1="10" y1="9" x2="8" y2="9"></line>
        </svg>
      </div>
      <span class="nav-label">Обработка текста</span>
    </button>

    <button
      class="nav-item"
      class:active={activeTab === 'providers'}
      onclick={() => onSelectTab('providers')}
      title="Провайдеры и ключи"
    >
      <div class="nav-icon-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path>
          <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>
        </svg>
      </div>
      <span class="nav-label">Провайдеры и ключи</span>
    </button>

    <button
      class="nav-item"
      class:active={activeTab === 'personalization'}
      onclick={() => onSelectTab('personalization')}
      title="Персонализация"
    >
      <div class="nav-icon-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
          <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
        </svg>
      </div>
      <span class="nav-label">Персонализация</span>
    </button>
  </nav>

  <div class="sidebar-footer">
    <button class="back-to-main-btn" onclick={onClose} title="Вернуться в историю">
      <div class="nav-icon-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </div>
      <span class="nav-label">Вернуться в историю</span>
    </button>
  </div>
</aside>

<style>
  .settings-sidebar {
    width: 220px;
    background: var(--bg-sidebar, #14161B);
    border-right: 1px solid var(--border-color, #242830);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    user-select: none;
  }

  .settings-nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    flex: 1;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 38px;
    padding: 0 12px;
    border-radius: var(--radius-control, 8px);
    border: none;
    background: transparent;
    color: var(--text-secondary, #9CA3AF);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: background-color 120ms ease, color 120ms ease;
    outline: none;
    position: relative;
    box-shadow: none;
  }

  .nav-icon-box {
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .nav-icon-box svg {
    width: 17px;
    height: 17px;
    flex-shrink: 0;
    stroke-width: 1.8;
  }

  .nav-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .nav-item:hover {
    background: var(--hover-surface, var(--hover-bg, rgba(255, 255, 255, 0.05)));
    color: var(--text-primary, #E5E7EB);
  }

  .nav-item:focus {
    outline: none;
  }

  .nav-item:focus-visible {
    outline: 2px solid var(--focus-ring, var(--border-focus, #5B5FEF));
    outline-offset: -2px;
  }

  /* Single unified active state across all settings tabs */
  .nav-item.active {
    background: var(--accent-soft, rgba(91, 95, 239, 0.10));
    color: var(--text-primary, #E5E7EB);
    font-weight: 600;
    border-radius: var(--radius-control, 8px);
    border: none;
    box-shadow: none;
  }

  .nav-item.active .nav-icon-box svg {
    color: var(--accent-primary, #5B5FEF);
  }

  .sidebar-footer {
    padding: 12px;
    border-top: 1px solid var(--border-subtle, #1D2027);
  }

  /* Tertiary navigation item for back to history */
  .back-to-main-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 38px;
    padding: 0 12px;
    border-radius: var(--radius-control, 8px);
    border: none;
    background: transparent;
    color: var(--text-secondary, #9CA3AF);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 120ms ease, color 120ms ease;
    outline: none;
  }

  .back-to-main-btn:hover {
    background: var(--hover-surface, var(--hover-bg, rgba(255, 255, 255, 0.05)));
    color: var(--text-primary, #E5E7EB);
  }

  .back-to-main-btn:focus {
    outline: none;
  }

  .back-to-main-btn:focus-visible {
    outline: 2px solid var(--focus-ring, var(--border-focus, #5B5FEF));
    outline-offset: -2px;
  }
</style>
