<script lang="ts">
  interface Props {
    mode?: 'raw' | 'minimal' | 'balanced' | 'business';
    modeKey?: 'raw' | 'minimal' | 'balanced' | 'business';
    title: string;
    description: string;
    isSelected: boolean;
    isRecommended?: boolean;
    onSelect: () => void;
  }

  let {
    title,
    description,
    isSelected,
    isRecommended = false,
    onSelect
  }: Props = $props();
</script>

<div
  class="mode-card"
  class:selected={isSelected}
  onclick={onSelect}
  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
  role="radio"
  aria-checked={isSelected}
  tabindex="0"
>
  <div class="card-header">
    <span class="mode-card-title">{title}</span>
    {#if isRecommended}
      <span class="recommended-badge">Рекомендуется</span>
    {/if}
  </div>
  <p class="mode-card-desc">{description}</p>
  <div class="radio-indicator" class:checked={isSelected} aria-hidden="true">
    {#if isSelected}
      <div class="radio-dot"></div>
    {/if}
  </div>
</div>

<style>
  .mode-card {
    min-height: 88px;
    background: var(--bg-surface, #FFFFFF);
    border: 1px solid var(--border-color, #E2E4E8);
    border-radius: 10px;
    padding: 14px;
    cursor: pointer;
    transition: background-color 120ms ease, border-color 120ms ease;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 4px;
    position: relative;
    outline: none;
    user-select: none;
    box-shadow: none;
    box-sizing: border-box;
    width: 100%;
  }

  .mode-card:hover {
    border-color: var(--border-strong, #D1D5DB);
    background: var(--hover-surface, var(--hover-bg, rgba(0, 0, 0, 0.025)));
  }

  .mode-card:active {
    background: var(--active-bg, rgba(0, 0, 0, 0.04));
  }

  .mode-card:focus {
    outline: none;
    box-shadow: none;
  }

  .mode-card:focus-visible {
    outline: 2px solid var(--focus-ring, var(--border-focus, #5B5FEF));
    outline-offset: 2px;
    border-radius: 10px;
  }

  .mode-card.selected {
    background: var(--accent-soft, rgba(91, 95, 239, 0.06));
    border: 1px solid var(--accent-border, rgba(91, 95, 239, 0.22));
    box-shadow: none;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-right: 28px;
    min-width: 0;
    height: 20px;
    margin-bottom: 2px;
  }

  .mode-card-title {
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    color: var(--text-primary, #15171A);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.01em;
    min-width: 0;
    flex-shrink: 1;
  }

  .recommended-badge {
    height: 18px;
    padding: 0 6px;
    font-size: 10.5px;
    font-weight: 600;
    line-height: 18px;
    color: var(--accent-text, var(--accent-primary, #FFA533));
    background: var(--accent-soft, rgba(91, 95, 239, 0.12));
    border: 1px solid var(--accent-border, rgba(91, 95, 239, 0.22));
    border-radius: 4px;
    white-space: nowrap;
    flex-shrink: 0;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
  }

  .radio-indicator {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1.5px solid var(--border-strong, #8B909A);
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 120ms ease, border-color 120ms ease;
    flex-shrink: 0;
    box-sizing: border-box;
  }

  .radio-indicator.checked {
    border-color: var(--accent-primary, var(--accent-color, #5B5FEF));
    background: var(--accent-primary, var(--accent-color, #5B5FEF));
  }

  .radio-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent-foreground, #FFFFFF);
  }

  .mode-card-desc {
    font-size: 12.5px;
    line-height: 18px;
    color: var(--text-secondary, #6E737D);
    margin: 0;
    padding-right: 28px;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
