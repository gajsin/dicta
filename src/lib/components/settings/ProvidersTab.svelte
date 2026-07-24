<script lang="ts">
  import type { ProviderStatusInfo } from '../../utils/apiKeyVerifier';
  import ProviderCard from './subcomponents/ProviderCard.svelte';
  import { PROVIDER_CONFIGS } from '../../constants/providers';

  interface Props {
    localApiKeys: Record<string, string>;
    showKeyMap: Record<string, boolean>;
    keyCheckStatus: Record<string, ProviderStatusInfo>;
    getProviderStatusBadge: (provider: string) => {
      label: string;
      statusClass: string;
      state: string;
      lastChecked?: string;
      detail?: string;
    };
    localSttProvider?: string;
    localLlmProvider?: string;
    onCheckKey: (provider: string) => Promise<void>;
    onClearKey: (provider: string) => Promise<void>;
    onToggleKeyMask: (provider: string) => void;
    onSaveKey: (provider: string, val: string) => Promise<void>;
  }

  let {
    localApiKeys = {},
    showKeyMap = {},
    keyCheckStatus = {},
    getProviderStatusBadge,
    localSttProvider = '',
    localLlmProvider = '',
    onCheckKey,
    onClearKey,
    onToggleKeyMask,
    onSaveKey,
  }: Props = $props();

  // Track inline disclosure panels state per provider (connecting/editing)
  let activeDisclosure = $state<Record<string, boolean>>({});

  // Draft inputs for inline disclosure panels before saving
  let draftInputs = $state<Record<string, string>>({});

  // Track open overflow menu per provider [•••]
  let openOverflowId = $state<string | null>(null);

  // Track inline deletion confirmation dialog per provider
  let confirmDeleteId = $state<string | null>(null);

  // Notice banner state after deletion or action
  let noticeMsg = $state<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);
  let savingProviderId = $state<string | null>(null);

  const toggleDisclosure = (providerId: string) => {
    if (!activeDisclosure[providerId]) {
      draftInputs[providerId] = localApiKeys[providerId] || '';
      activeDisclosure[providerId] = true;
    } else {
      activeDisclosure[providerId] = false;
    }
  };

  const toggleOverflowMenu = (provId: string, event: MouseEvent) => {
    event.stopPropagation();
    openOverflowId = openOverflowId === provId ? null : provId;
  };

  const handleGlobalClick = () => {
    openOverflowId = null;
  };

  const handleGlobalKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      openOverflowId = null;
      confirmDeleteId = null;
    }
  };

  const handleSaveAndCheck = async (providerId: string) => {
    const rawVal = draftInputs[providerId] !== undefined ? draftInputs[providerId] : (localApiKeys[providerId] || '');
    const val = rawVal.trim();
    if (!val || savingProviderId) return;

    savingProviderId = providerId;
    try {
      await onSaveKey(providerId, val);
      activeDisclosure[providerId] = false;
    } catch (error) {
      noticeMsg = {
        text: String(error || 'Не удалось сохранить API-ключ'),
        type: 'error',
      };
    } finally {
      savingProviderId = null;
    }
  };

  const handleConfirmDelete = async (providerId: string) => {
    const provName = PROVIDER_CONFIGS.find(p => p.id === providerId)?.name || providerId;
    savingProviderId = providerId;
    try {
      await onClearKey(providerId);
      confirmDeleteId = null;
      openOverflowId = null;
      activeDisclosure[providerId] = false;
      draftInputs[providerId] = '';
      noticeMsg = {
        text: `Ключ ${provName} удалён из settings.json`,
        type: 'info'
      };
      setTimeout(() => {
        noticeMsg = null;
      }, 4000);
    } catch (error) {
      noticeMsg = {
        text: String(error || 'Не удалось удалить API-ключ'),
        type: 'error',
      };
    } finally {
      savingProviderId = null;
    }
  };

  const getActiveUsageText = (provId: string) => {
    const isStt = provId === localSttProvider;
    const isLlm = provId === localLlmProvider;
    if (isStt && isLlm) {
      return 'Используется для: распознавания речи и редактирования текста';
    }
    if (isStt) {
      return 'Используется для: распознавания речи';
    }
    if (isLlm) {
      return 'Используется для: редактирования текста';
    }
    return null;
  };
</script>

<svelte:window onclick={handleGlobalClick} onkeydown={handleGlobalKeydown} />

<div class="providers-tab-root">
  <div class="tab-header">
    <h2>Провайдеры и API-ключи</h2>
    <p>API-ключи хранятся локально в %APPDATA%\Dicta\settings.json.</p>
  </div>

  {#if noticeMsg}
    <div class="notice-banner {noticeMsg.type}" role="status">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>{noticeMsg.text}</span>
    </div>
  {/if}

  <!-- Single Unified Surface Card with 12px radius, neutral background, thin border, and subtle dividers -->
  <div class="providers-surface" role="list" aria-label="Список ИИ-провайдеров">
    {#each PROVIDER_CONFIGS as prov, idx (prov.id)}
      {@const keyVal = localApiKeys[prov.id] || ''}
      {@const badge = getProviderStatusBadge(prov.id)}
      {@const isChecking = keyCheckStatus[prov.id]?.state === 'checking' || savingProviderId === prov.id}
      {@const usageText = getActiveUsageText(prov.id)}
      {@const isDisclosureOpen = Boolean(activeDisclosure[prov.id])}
      {@const isConfirmingDelete = confirmDeleteId === prov.id}
      {@const draftInput = draftInputs[prov.id] ?? keyVal}
      {@const showMask = Boolean(showKeyMap[prov.id])}

      <div class="provider-row-wrapper" class:is-last={idx === PROVIDER_CONFIGS.length - 1}>
        <ProviderCard
          {prov}
          {keyVal}
          {badge}
          {isChecking}
          {usageText}
          {isDisclosureOpen}
          {isConfirmingDelete}
          {openOverflowId}
          {showMask}
          {draftInput}
          onCheckKey={() => onCheckKey(prov.id)}
          onToggleDisclosure={() => toggleDisclosure(prov.id)}
          onToggleOverflow={(e) => toggleOverflowMenu(prov.id, e)}
          onPromptDelete={() => { openOverflowId = null; confirmDeleteId = prov.id; }}
          onConfirmDelete={() => handleConfirmDelete(prov.id)}
          onCancelDelete={() => { confirmDeleteId = null; }}
          onToggleMask={() => onToggleKeyMask(prov.id)}
          onDraftInput={(val) => { draftInputs[prov.id] = val; }}
          onSaveAndCheck={() => handleSaveAndCheck(prov.id)}
          onCancelDisclosure={() => { activeDisclosure[prov.id] = false; }}
        />
      </div>
    {/each}
  </div>
</div>

<style>
  .providers-tab-root {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 700px;
    margin: 0 auto;
    padding-bottom: 24px;
  }

  .tab-header {
    margin-bottom: 22px;
  }

  .tab-header h2 {
    font-size: 18px;
    font-weight: 700;
    line-height: 24px;
    color: var(--text-primary, #E5E7EB);
    margin: 0 0 3px 0;
    letter-spacing: -0.015em;
  }

  .tab-header p {
    font-size: 13px;
    color: var(--text-secondary, #9CA3AF);
    margin: 0;
    line-height: 18px;
  }

  /* Notice Banner */
  .notice-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: var(--radius-md, 8px);
    font-size: 12.5px;
    background: var(--accent-light, rgba(91, 95, 239, 0.09));
    color: var(--accent-primary, #5B5FEF);
    border: 1px solid var(--accent-border, rgba(91, 95, 239, 0.2));
    margin-bottom: 16px;
  }

  .notice-banner svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  /* Single Shared Surface Container */
  .providers-surface {
    background: var(--bg-surface, #191C23);
    border: 1px solid var(--border-color, #242830);
    border-radius: 12px;
    box-shadow: none;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .provider-row-wrapper {
    border-bottom: 1px solid var(--border-subtle, #1D2027);
  }

  .provider-row-wrapper.is-last {
    border-bottom: none;
  }
</style>
