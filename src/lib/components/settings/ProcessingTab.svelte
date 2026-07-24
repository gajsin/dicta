<script lang="ts">
  import type { SelectOption } from '../ui/types';
  import ModeCard from './subcomponents/ModeCard.svelte';
  import ProcessingAdvancedControls from './subcomponents/ProcessingAdvancedControls.svelte';

  interface Props {
    localEnhanceMode: 'raw' | 'minimal' | 'balanced' | 'business';
    localSttProvider: string;
    localSttModel: string;
    localLlmProvider: string;
    localLlmModel: string;
    sttProviderOptions: SelectOption[];
    sttModelOptions: SelectOption[];
    llmProviderOptions: SelectOption[];
    llmModelOptions: SelectOption[];
    localApiKeys?: Record<string, string>;
    saveStatus?: 'idle' | 'saved' | 'error';
    onEnhanceModeChange: (mode: 'raw' | 'minimal' | 'balanced' | 'business') => void;
    onSttProviderChange: (provider: string) => void;
    onSttModelChange: (model: string) => void;
    onLlmProviderChange: (provider: string) => void;
    onLlmModelChange: (model: string) => void;
    onGoToProviders?: () => void;
  }

  let {
    localEnhanceMode = 'balanced',
    localSttProvider = 'groq',
    localSttModel = 'whisper-large-v3-turbo',
    localLlmProvider = 'groq',
    localLlmModel = 'openai/gpt-oss-120b',
    sttProviderOptions = [],
    sttModelOptions = [],
    llmProviderOptions = [],
    llmModelOptions = [],
    localApiKeys = {},
    saveStatus = 'idle',
    onEnhanceModeChange,
    onSttProviderChange,
    onSttModelChange,
    onLlmProviderChange,
    onLlmModelChange,
    onGoToProviders = () => {},
  }: Props = $props();

  const getProviderName = (prov: string) => {
    const found = sttProviderOptions.find(o => o.value === prov) || llmProviderOptions.find(o => o.value === prov);
    return found ? found.label : prov;
  };

  const isSttKeyMissing = $derived<boolean>(
    Boolean(!localApiKeys[localSttProvider] || localApiKeys[localSttProvider].trim().length === 0)
  );

  const isLlmKeyMissing = $derived<boolean>(
    Boolean(!localApiKeys[localLlmProvider] || localApiKeys[localLlmProvider].trim().length === 0)
  );

  const isSttModelOutdated = $derived<boolean>(
    sttModelOptions.length > 0 && !sttModelOptions.some(m => m.value === localSttModel)
  );

  const isLlmModelOutdated = $derived<boolean>(
    llmModelOptions.length > 0 && !llmModelOptions.some(m => m.value === localLlmModel)
  );
</script>

<div class="processing-tab-root">
  <div class="tab-header">
    <div class="header-title-row">
      <h2>Обработка текста</h2>
      {#if saveStatus === 'saved'}
        <span class="status-badge saved">✓ Изменение сохранено</span>
      {:else if saveStatus === 'error'}
        <span class="status-badge error">✕ Ошибка сохранения</span>
      {/if}
    </div>
    <p>Уровень обработки речи и модели нейросетей</p>
  </div>

  <div class="mode-cards-grid" role="radiogroup" aria-label="Режимы обработки речи">
    <ModeCard
      mode="raw"
      title="Без обработки"
      description="Записывает устную речь точно «как есть», без любых изменений."
      isSelected={localEnhanceMode === 'raw'}
      onSelect={() => onEnhanceModeChange('raw')}
    />
    <ModeCard
      mode="minimal"
      title="Лёгкая правка"
      description="Исправляет пунктуацию, опечатки и повторы слов."
      isSelected={localEnhanceMode === 'minimal'}
      onSelect={() => onEnhanceModeChange('minimal')}
    />
    <ModeCard
      mode="balanced"
      title="Сбалансированный"
      description="Естественный, связный и грамотный текст."
      isRecommended={true}
      isSelected={localEnhanceMode === 'balanced'}
      onSelect={() => onEnhanceModeChange('balanced')}
    />
    <ModeCard
      mode="business"
      title="Деловой стиль"
      description="Строгий тон для деловых писем и отчётов."
      isSelected={localEnhanceMode === 'business'}
      onSelect={() => onEnhanceModeChange('business')}
    />
  </div>

  <!-- Technical Model Configurations Always Visible -->
  <ProcessingAdvancedControls
    {localSttProvider}
    {localSttModel}
    {localLlmProvider}
    {localLlmModel}
    {sttProviderOptions}
    {sttModelOptions}
    {llmProviderOptions}
    {llmModelOptions}
    {isSttKeyMissing}
    {isLlmKeyMissing}
    {isSttModelOutdated}
    {isLlmModelOutdated}
    {localEnhanceMode}
    {getProviderName}
    {onSttProviderChange}
    {onSttModelChange}
    {onLlmProviderChange}
    {onLlmModelChange}
    {onGoToProviders}
  />
</div>

<style>
  .processing-tab-root {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 700px;
    margin: 0;
  }

  .tab-header {
    margin-bottom: 12px;
  }

  .tab-header h2 {
    font-size: 20px;
    font-weight: 600;
    line-height: 28px;
    color: var(--text-primary, #15171A);
    margin: 0 0 3px 0;
    letter-spacing: -0.01em;
  }

  .tab-header p {
    font-size: 13px;
    color: var(--text-secondary, #6E737D);
    margin: 0;
    line-height: 18px;
  }

  .header-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .status-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
    white-space: nowrap;
  }

  .status-badge.saved {
    background: rgba(36, 161, 100, 0.12);
    color: var(--success-color, #24A164);
  }

  .status-badge.error {
    background: rgba(229, 72, 77, 0.12);
    color: var(--error-color, #E5484D);
  }

  .mode-cards-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    width: 100%;
    max-width: 700px;
  }

  @media (max-width: 640px) {
    .mode-cards-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
