<script lang="ts">
  import ColorPicker from '../ui/ColorPicker.svelte';
  import {
    type ThemeMode,
    applyAccentColor,
  } from '../../utils/accentTheme';

  interface Props {
    currentThemeMode?: ThemeMode;
    accentColor?: string;
    accentOpacity?: number;
    onThemeModeChange?: (mode: ThemeMode) => void;
    onAccentColorChange?: (color: string, opacity: number) => void;
  }

  let {
    currentThemeMode = 'system',
    accentColor = '#5B5FEF',
    accentOpacity = 100,
    onThemeModeChange = () => {},
    onAccentColorChange = () => {},
  }: Props = $props();

  const handleAccentChange = (hex: string, opacity: number) => {
    applyAccentColor(hex, opacity);
    onAccentColorChange(hex.toUpperCase(), opacity);
  };

  const handleThemeSelect = (mode: ThemeMode) => {
    onThemeModeChange(mode);
  };
</script>

<div class="personalization-tab-root">
  <div class="tab-header">
    <h2>Персонализация</h2>
    <p>Настройка темы оформления и уникального акцентного цвета приложения</p>
  </div>

  <!-- Section 1: Theme Mode Selection -->
  <div class="settings-section-card">
    <div class="section-card-header">
      <span class="section-card-title">Тема оформления</span>
      <span class="section-card-subtitle">Выбор визуального стиля интерфейса</span>
    </div>

    <div class="theme-cards-grid" role="radiogroup" aria-label="Тема оформления">
      <!-- System Theme Mode -->
      <button
        type="button"
        class="theme-mode-card"
        class:selected={currentThemeMode === 'system'}
        onclick={() => handleThemeSelect('system')}
        role="radio"
        aria-checked={currentThemeMode === 'system'}
      >
        <div class="theme-card-left">
          <div class="theme-card-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <div class="theme-card-text">
            <span class="theme-card-label">Системная</span>
            <span class="theme-card-desc">Как в Windows</span>
          </div>
        </div>
        <div class="theme-radio-indicator" class:selected={currentThemeMode === 'system'}>
          {#if currentThemeMode === 'system'}
            <svg viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" fill="var(--accent-soft, rgba(91, 95, 239, 0.12))" stroke="var(--accent-primary, #5B5FEF)" stroke-width="1.5"/>
              <path d="M4.8 8.2L7 10.4L11.2 6.2" stroke="var(--accent-primary, #5B5FEF)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          {:else}
            <div class="radio-dot-unselected"></div>
          {/if}
        </div>
      </button>

      <!-- Light Theme Mode -->
      <button
        type="button"
        class="theme-mode-card"
        class:selected={currentThemeMode === 'light'}
        onclick={() => handleThemeSelect('light')}
        role="radio"
        aria-checked={currentThemeMode === 'light'}
      >
        <div class="theme-card-left">
          <div class="theme-card-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          </div>
          <div class="theme-card-text">
            <span class="theme-card-label">Светлая</span>
            <span class="theme-card-desc">Классический стиль</span>
          </div>
        </div>
        <div class="theme-radio-indicator" class:selected={currentThemeMode === 'light'}>
          {#if currentThemeMode === 'light'}
            <svg viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" fill="var(--accent-soft, rgba(91, 95, 239, 0.12))" stroke="var(--accent-primary, #5B5FEF)" stroke-width="1.5"/>
              <path d="M4.8 8.2L7 10.4L11.2 6.2" stroke="var(--accent-primary, #5B5FEF)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          {:else}
            <div class="radio-dot-unselected"></div>
          {/if}
        </div>
      </button>

      <!-- Dark Theme Mode -->
      <button
        type="button"
        class="theme-mode-card"
        class:selected={currentThemeMode === 'dark'}
        onclick={() => handleThemeSelect('dark')}
        role="radio"
        aria-checked={currentThemeMode === 'dark'}
      >
        <div class="theme-card-left">
          <div class="theme-card-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </div>
          <div class="theme-card-text">
            <span class="theme-card-label">Тёмная</span>
            <span class="theme-card-desc">Тёмные тона</span>
          </div>
        </div>
        <div class="theme-radio-indicator" class:selected={currentThemeMode === 'dark'}>
          {#if currentThemeMode === 'dark'}
            <svg viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" fill="var(--accent-soft, rgba(91, 95, 239, 0.12))" stroke="var(--accent-primary, #5B5FEF)" stroke-width="1.5"/>
              <path d="M4.8 8.2L7 10.4L11.2 6.2" stroke="var(--accent-primary, #5B5FEF)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          {:else}
            <div class="radio-dot-unselected"></div>
          {/if}
        </div>
      </button>
    </div>
  </div>

  <!-- Section 2: Accent Color Customizer -->
  <div class="settings-section-card">
    <div class="section-card-header">
      <span class="section-card-title">Акцентный цвет приложения</span>
      <span class="section-card-subtitle">Единый цвет для элементов управления</span>
    </div>

    <ColorPicker
      value={accentColor}
      opacity={accentOpacity}
      onchange={handleAccentChange}
    />
  </div>
</div>

<style>
  .personalization-tab-root {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 720px;
    margin: 0 auto;
    gap: 16px;
    padding-bottom: 24px;
  }

  .tab-header {
    margin-bottom: 0;
  }

  .tab-header h2 {
    font-size: 20px;
    font-weight: 600;
    line-height: 28px;
    color: var(--text-primary, #15171A);
    margin: 0 0 2px 0;
    letter-spacing: -0.01em;
  }

  .tab-header p {
    font-size: 13px;
    color: var(--text-secondary, #6E737D);
    margin: 0;
    line-height: 18px;
  }

  .settings-section-card {
    background: var(--bg-surface, #FFFFFF);
    border: 1px solid var(--border-color, #E2E4E8);
    border-radius: var(--radius-card, 12px);
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-sizing: border-box;
    box-shadow: none;
  }

  .section-card-header {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .section-card-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary, #15171A);
    line-height: 20px;
  }

  .section-card-subtitle {
    font-size: 12px;
    color: var(--text-secondary, #6E737D);
    line-height: 16px;
  }

  /* Theme Cards Grid */
  .theme-cards-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  @media (max-width: 580px) {
    .theme-cards-grid {
      grid-template-columns: 1fr;
    }
  }

  .theme-mode-card {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    height: 60px;
    padding: 12px 14px;
    border-radius: 10px;
    background: var(--bg-surface, #FFFFFF);
    border: 1px solid var(--border-color, #E2E4E8);
    cursor: pointer;
    text-align: left;
    transition: background 120ms ease, border-color 120ms ease, transform 100ms ease;
    outline: none;
    box-sizing: border-box;
    user-select: none;
    box-shadow: none;
  }

  .theme-mode-card:hover:not(.selected) {
    background: var(--hover-surface, rgba(0, 0, 0, 0.03));
    border-color: var(--border-strong, #C0C4CC);
  }

  .theme-mode-card:active {
    transform: scale(0.985);
  }

  .theme-mode-card.selected {
    background: var(--accent-soft, rgba(91, 95, 239, 0.08));
    border: 1px solid var(--accent-border, var(--accent-color, #5B5FEF));
  }

  .theme-mode-card:focus-visible {
    outline: 2px solid var(--text-primary, #15171A);
    outline-offset: 2px;
    border-radius: 10px;
  }

  .theme-card-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1;
  }

  .theme-card-icon-wrap {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: var(--hover-surface, rgba(0, 0, 0, 0.04));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--text-primary, #15171A);
  }

  .theme-card-icon-wrap svg {
    width: 16px;
    height: 16px;
  }

  .theme-radio-indicator {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-left: auto;
  }

  .theme-radio-indicator svg {
    width: 16px;
    height: 16px;
  }

  .radio-dot-unselected {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 1.5px solid var(--border-strong, #C0C4CC);
    background: transparent;
    box-sizing: border-box;
    transition: border-color 100ms ease;
  }

  .theme-mode-card:hover .radio-dot-unselected {
    border-color: var(--text-secondary, #6E737D);
  }

  .theme-card-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .theme-card-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary, #15171A);
    line-height: 18px;
  }

  .theme-card-desc {
    font-size: 12px;
    color: var(--text-secondary, #6E737D);
    line-height: 16px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
