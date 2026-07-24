<script lang="ts">
  import type { ComparisonAnalysis } from '../../../utils/diff';

  interface Props {
    comparison: ComparisonAnalysis;
  }

  let { comparison }: Props = $props();
</script>

<div class="diff-workspace">
  <!-- 3. Calm Status Row (Height 32px, Radius 8px, Weak neutral surface, Icon 14px, Text 12px, No shadow) -->
  {#if comparison.state === 'identical'}
    <div class="compare-status-row notice">
      <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 8v4m0 4h.01"></path>
      </svg>
      <span class="status-text">Тексты совпадают — ИИ не потребовалось вносить изменения.</span>
    </div>
  {:else if comparison.state === 'punctuation_only'}
    <div class="compare-status-row info">
      <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
      <span class="status-text">Изменена только пунктуация и регистр символов.</span>
    </div>
  {:else if comparison.state === 'substantially_rewritten'}
    <div class="compare-status-row warning">
      <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
      <span class="status-text">Текст был существенно перефразирован ИИ для улучшения стиля.</span>
    </div>
  {/if}

  <!-- 1 & 2. Flexible 1fr Grid Area with 2 Equal Height Columns & Subtle Divider -->
  <div class="diff-two-columns">
    <!-- Column 1: Source Raw Text -->
    <div class="diff-column source-column">
      <div class="diff-column-header">
        <div class="header-title-group">
          <span class="column-title">Исходный текст</span>
          <span class="column-badge voice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            </svg>
            <span>ГОЛОС</span>
          </span>
        </div>
      </div>
      <div class="diff-column-body">
        {#if comparison.state === 'missing_raw'}
          <div class="diff-missing-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            <span>Исходная аудиозапись не сохранилась</span>
          </div>
        {:else}
          <p class="diff-text-paragraph">
            {#each comparison.rawTokens as token}
              {#if token.status === 'removed'}
                <span class="diff-word-removed" title="Заменено при обработке">{token.text}</span>{' '}
              {:else}
                <span>{token.text}</span>{' '}
              {/if}
            {/each}
          </p>
        {/if}
      </div>
    </div>

    <!-- Column 2: Enhanced Processed Text -->
    <div class="diff-column enhanced-column">
      <div class="diff-column-header">
        <div class="header-title-group">
          <span class="column-title">Улучшенный текст</span>
          <span class="column-badge ai">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
            </svg>
            <span>ИИ</span>
          </span>
        </div>
      </div>
      <div class="diff-column-body">
        {#if comparison.state === 'missing_processed'}
          <div class="diff-missing-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            <span>Улучшенная версия отсутствует</span>
          </div>
        {:else}
          <p class="diff-text-paragraph">
            {#each comparison.processedTokens as token}
              {#if token.status === 'added'}
                <span class="diff-word-added" title="Улучшено ИИ">{token.text}</span>{' '}
              {:else}
                <span>{token.text}</span>{' '}
              {/if}
            {/each}
          </p>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .diff-workspace {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    flex: 1;
    gap: 14px;
  }

  /* Requirement 3: Calm status-row (Height 32px, Radius 8px, Weak neutral surface, Icon 14px, Text 12px, No shadow) */
  .compare-status-row {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 32px;
    min-height: 32px;
    padding: 0 12px;
    border-radius: 8px;
    background: var(--bg-control, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
    box-shadow: none;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .status-icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: var(--text-secondary, #9CA3AF);
  }

  .status-text {
    font-size: 12px;
    line-height: 1;
    font-weight: 400;
    color: var(--text-secondary, #9CA3AF);
  }

  .compare-status-row.notice .status-icon {
    color: var(--text-tertiary, #717784);
  }

  .compare-status-row.info .status-icon {
    color: var(--accent-primary, #5B5FEF);
  }

  .compare-status-row.warning .status-icon {
    color: var(--warning-color, #F59E0B);
  }

  /* Requirement 1 & 2: Height Utilization & Weak Column Surfaces without Heavy Outlines */
  .diff-two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    width: 100%;
    flex: 1;
    min-height: 0;
    align-items: stretch;
  }

  @media (max-width: 640px) {
    .diff-two-columns {
      grid-template-columns: 1fr;
    }
  }

  /* Weak background surface, thin subtle border, no heavy card frames */
  .diff-column {
    background: var(--bg-control, rgba(255, 255, 255, 0.015));
    border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.05));
    border-radius: var(--radius-md, 8px);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    min-height: 0;
    box-sizing: border-box;
  }

  /* Requirement 4: Header line (Title and Badge gathered in one inline group) */
  .diff-column-header {
    display: flex;
    align-items: center;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
    flex-shrink: 0;
  }

  .header-title-group {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .column-title {
    font-size: 13px;
    font-weight: 550;
    color: var(--text-primary, #E5E7EB);
    line-height: 1.2;
  }

  /* Unified Badge Component: Same height 20px, radius 6px, padding 2px 8px, 11px icon */
  .column-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 20px;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 10.5px;
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    box-sizing: border-box;
  }

  .column-badge svg {
    width: 11px;
    height: 11px;
    flex-shrink: 0;
  }

  .column-badge.voice {
    background: var(--bg-surface, rgba(255, 255, 255, 0.06));
    color: var(--text-secondary, #9CA3AF);
    border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  }

  .column-badge.ai {
    background: var(--accent-soft, rgba(91, 95, 239, 0.12));
    color: var(--accent-primary, #5B5FEF);
    border: 1px solid var(--accent-border, rgba(91, 95, 239, 0.2));
  }

  /* Requirement 2: Scroll container for text body */
  .diff-column-body {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding-right: 4px;
  }

  /* Requirement 5: Typography (14px, line-height 22px, same font-weight 400 for both) */
  .diff-text-paragraph {
    font-size: 14px;
    line-height: 22px;
    font-weight: 400;
    color: var(--text-primary, #E5E7EB);
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: var(--font-sans);
  }

  .diff-word-removed {
    background: var(--danger-bg, rgba(229, 72, 77, 0.12));
    color: var(--danger-color, #E5484D);
    padding: 1px 4px;
    border-radius: 3px;
    text-decoration: line-through;
    opacity: 0.88;
    font-weight: 400;
  }

  .diff-word-added {
    background: var(--success-bg, rgba(36, 161, 100, 0.12));
    color: var(--success-color, #2EBE78);
    padding: 1px 4px;
    border-radius: 3px;
    font-weight: 400;
  }

  .diff-missing-state {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-tertiary, #717784);
    padding: 12px 0;
    font-style: italic;
  }

  .diff-missing-state svg {
    width: 14px;
    height: 14px;
  }
</style>
