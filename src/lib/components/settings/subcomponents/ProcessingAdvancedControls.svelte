<script lang="ts">
  import CompactSelect from '../../CompactSelect.svelte';
  import type { SelectOption } from '../../ui/types';

  interface Props {
    localSttProvider: string;
    localSttModel: string;
    localLlmProvider: string;
    localLlmModel: string;
    sttProviderOptions: SelectOption[];
    sttModelOptions: SelectOption[];
    llmProviderOptions: SelectOption[];
    llmModelOptions: SelectOption[];
    isSttKeyMissing: boolean;
    isLlmKeyMissing: boolean;
    isSttModelOutdated: boolean;
    isLlmModelOutdated: boolean;
    localEnhanceMode: 'raw' | 'minimal' | 'balanced' | 'business';
    getProviderName: (prov: string) => string;
    onSttProviderChange: (provider: string) => void;
    onSttModelChange: (model: string) => void;
    onLlmProviderChange: (provider: string) => void;
    onLlmModelChange: (model: string) => void;
    onGoToProviders?: () => void;
  }

  let {
    localSttProvider,
    localSttModel,
    localLlmProvider,
    localLlmModel,
    sttProviderOptions,
    sttModelOptions,
    llmProviderOptions,
    llmModelOptions,
    isSttKeyMissing,
    isLlmKeyMissing,
    isSttModelOutdated,
    isLlmModelOutdated,
    localEnhanceMode,
    getProviderName,
    onSttProviderChange,
    onSttModelChange,
    onLlmProviderChange,
    onLlmModelChange,
    onGoToProviders = () => {},
  }: Props = $props();
</script>

<div class="tech-config-container">
  <!-- Logical Block 1: Speech Recognition (STT) -->
  <div class="tech-block">
    <div class="block-header">
      <span class="block-title">Распознавание речи</span>
      <span class="tech-badge" title="Speech-to-Text (STT)">STT</span>
    </div>

    {#if isSttKeyMissing}
      <div class="provider-warning-banner">
        <div class="warning-text">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <span>Провайдер <strong>{getProviderName(localSttProvider)}</strong> не подключён (отсутствует API-ключ)</span>
        </div>
        <button type="button" class="goto-providers-btn" onclick={onGoToProviders}>Настроить ключ →</button>
      </div>
    {/if}

    {#if isSttModelOutdated}
      <div class="provider-warning-banner subtle">
        <span class="warning-text">⚠️ Выбранная модель <code>{localSttModel}</code> недоступна у провайдера {getProviderName(localSttProvider)}. Выберите другую модель.</span>
      </div>
    {/if}

    {#if sttModelOptions.length === 0}
      <div class="empty-models-notice">Нет доступных моделей для распознавания речи.</div>
    {:else}
      <div class="fields-row">
        <div class="field-col provider-col">
          <span class="field-label">Провайдер</span>
          <CompactSelect
            value={localSttProvider}
            options={sttProviderOptions}
            ariaLabel="Провайдер распознавания речи"
            onChange={onSttProviderChange}
          />
        </div>

        <div class="field-col model-col">
          <span class="field-label">Модель</span>
          <CompactSelect
            value={localSttModel}
            options={sttModelOptions}
            ariaLabel="Модель распознавания речи"
            onChange={onSttModelChange}
          />
        </div>
      </div>
    {/if}
  </div>

  <!-- Logical Block 2: Text Editing (LLM) -->
  <div class="tech-block divider-top">
    <div class="block-header">
      <span class="block-title">Редактирование текста</span>
      <span class="tech-badge" title="Large Language Model (LLM)">LLM</span>
    </div>

    {#if isLlmKeyMissing && localEnhanceMode !== 'raw'}
      <div class="provider-warning-banner">
        <div class="warning-text">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <span>Провайдер <strong>{getProviderName(localLlmProvider)}</strong> не подключён (отсутствует API-ключ)</span>
        </div>
        <button type="button" class="goto-providers-btn" onclick={onGoToProviders}>Настроить ключ →</button>
      </div>
    {/if}

    {#if isLlmModelOutdated}
      <div class="provider-warning-banner subtle">
        <span class="warning-text">⚠️ Выбранная модель <code>{localLlmModel}</code> недоступна у провайдера {getProviderName(localLlmProvider)}. Выберите другую модель.</span>
      </div>
    {/if}

    {#if llmModelOptions.length === 0}
      <div class="empty-models-notice">Нет доступных моделей для редактирования текста.</div>
    {:else}
      <div class="fields-row">
        <div class="field-col provider-col">
          <span class="field-label">Провайдер</span>
          <CompactSelect
            value={localLlmProvider}
            options={llmProviderOptions}
            ariaLabel="Провайдер редактирования текста"
            onChange={onLlmProviderChange}
          />
        </div>

        <div class="field-col model-col">
          <span class="field-label">Модель</span>
          <CompactSelect
            value={localLlmModel}
            options={llmModelOptions}
            ariaLabel="Модель редактирования текста"
            onChange={onLlmModelChange}
          />
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .tech-config-container {
    background: var(--bg-surface-secondary, var(--bg-subtle, rgba(0, 0, 0, 0.015)));
    border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
    border-radius: 12px;
    padding: 20px;
    margin-top: 24px;
    width: 100%;
    max-width: 700px;
    display: flex;
    flex-direction: column;
    box-shadow: none;
    box-sizing: border-box;
  }

  .tech-block {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .tech-block.divider-top {
    border-top: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.05));
    padding-top: 16px;
    margin-top: 16px;
  }

  .block-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .block-title {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--text-primary, #15171A);
    letter-spacing: -0.01em;
  }

  .tech-badge {
    height: 18px;
    padding: 0 6px;
    font-size: 10.5px;
    font-weight: 500;
    line-height: 18px;
    color: var(--text-secondary, #6E737D);
    background: var(--hover-bg, rgba(0, 0, 0, 0.04));
    border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.08));
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    box-sizing: border-box;
    white-space: nowrap;
  }

  .fields-row {
    display: grid;
    grid-template-columns: 4fr 6fr;
    gap: 12px;
    width: 100%;
  }

  .field-col {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .field-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary, #6E737D);
  }

  .provider-warning-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 10px;
    background: rgba(229, 72, 77, 0.08);
    border: 1px solid rgba(229, 72, 77, 0.2);
    border-radius: var(--radius-control, 8px);
    font-size: 11.5px;
  }

  .provider-warning-banner.subtle {
    background: rgba(247, 107, 21, 0.08);
    border-color: rgba(247, 107, 21, 0.2);
  }

  .warning-text {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-primary, #15171A);
  }

  .warning-text svg {
    width: 14px;
    height: 14px;
    color: var(--danger-color, #E5484D);
    flex-shrink: 0;
  }

  .goto-providers-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--accent-primary, var(--accent-color, #5B5FEF));
    white-space: nowrap;
    padding: 2px 4px;
  }

  .empty-models-notice {
    font-size: 11.5px;
    color: var(--text-secondary, #6E737D);
    font-style: italic;
  }
</style>
