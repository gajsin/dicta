<script lang="ts">
  import DictaLogo from './DictaLogo.svelte';
  import IconButton from './ui/IconButton.svelte';
  import WindowControls from './ui/WindowControls.svelte';

  interface Props {
    currentView?: 'history' | 'settings' | 'about';
    onNavigateView?: (view: 'history' | 'settings' | 'about') => void;
  }

  let {
    currentView = 'history',
    onNavigateView = () => {}
  }: Props = $props();
</script>

<header class="app-toolbar" data-tauri-drag-region>
  <!-- Left: Brand Logo & Navigation Breadcrumb -->
  <div class="toolbar-left" data-tauri-drag-region>
    <div
      class="brand-pill"
      onclick={() => onNavigateView('history')}
      role="button"
      tabindex="0"
      title="Dicta — На главную"
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigateView('history'); }}
    >
      <DictaLogo size={18} class="brand-logo" />
      <span class="brand-name">Dicta</span>
    </div>
  </div>

  <!-- Center: Drag Region -->
  <div class="toolbar-center" data-tauri-drag-region></div>

  <!-- Right: Settings and Window Frame Controls -->
  <div class="toolbar-right">
    <IconButton
      variant="ghost"
      size="compact"
      active={currentView === 'settings'}
      onclick={() => onNavigateView(currentView === 'settings' ? 'history' : 'settings')}
      title={currentView === 'settings' ? 'Вернуться в историю' : 'Настройки'}
      ariaLabel="Настройки"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    </IconButton>

    <!-- Windows Frame Controls -->
    <WindowControls />
  </div>
</header>

<style>
  .app-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--topbar-height, 44px);
    padding: 0 6px 0 12px;
    background: var(--bg-panel, var(--bg-sidebar, var(--secondary-bg, #FFFFFF)));
    border-bottom: 1px solid var(--border-color, #E2E4E8);
    flex-shrink: 0;
    user-select: none;
    position: relative;
    z-index: 100;
    gap: 12px;
  }

  /* Left Section */
  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    height: 100%;
  }

  .brand-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 6px;
    border-radius: var(--radius-sm, 6px);
    cursor: pointer;
    transition: background 100ms ease;
    outline: none;
    -webkit-app-region: no-drag;
  }

  .brand-pill:hover {
    background: var(--hover-bg, rgba(0, 0, 0, 0.04));
  }

  .brand-pill:focus-visible {
    outline: 2px solid var(--border-focus, #5B5FEF);
  }

  .brand-name {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--text-primary, #15171A);
  }

  /* Center Section */
  .toolbar-center {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    max-width: 620px;
    justify-content: center;
    -webkit-app-region: no-drag;
    height: 100%;
  }

  /* Right Section */
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    height: 100%;
    -webkit-app-region: no-drag;
  }


</style>
