<script lang="ts">
  import './ProviderCard.base.css';
  import './ProviderCard.disclosure.css';
  import Button from '../../ui/Button.svelte';

  export interface ProviderConfig {
    id: string;
    name: string;
    description: string;
    capabilities: string;
    placeholder: string;
    formatHelp: string;
  }

  export interface BadgeInfo {
    label: string;
    statusClass: string;
    state: string;
    lastChecked?: string;
    detail?: string;
  }

  interface Props {
    prov: ProviderConfig;
    keyVal: string;
    badge: BadgeInfo;
    isChecking: boolean;
    usageText: string | null;
    isDisclosureOpen: boolean;
    isConfirmingDelete: boolean;
    openOverflowId: string | null;
    showMask: boolean;
    draftInput: string;
    onCheckKey: () => void;
    onToggleDisclosure: () => void;
    onToggleOverflow: (e: MouseEvent) => void;
    onPromptDelete: () => void;
    onConfirmDelete: () => void;
    onCancelDelete: () => void;
    onToggleMask: () => void;
    onDraftInput: (val: string) => void;
    onSaveAndCheck: () => void;
    onCancelDisclosure: () => void;
  }

  let {
    prov,
    keyVal = '',
    badge,
    isChecking = false,
    usageText = null,
    isDisclosureOpen = false,
    isConfirmingDelete = false,
    openOverflowId = null,
    showMask = false,
    draftInput = '',
    onCheckKey,
    onToggleDisclosure,
    onToggleOverflow,
    onPromptDelete,
    onConfirmDelete,
    onCancelDelete,
    onToggleMask,
    onDraftInput,
    onSaveAndCheck,
    onCancelDisclosure,
  }: Props = $props();

  const hasKey = $derived(keyVal.trim().length > 0);

  // Compact masked key representation in one single 12px mono string (e.g. ••••••••a1b2)
  const getMaskedKeyPreview = (key: string) => {
    if (!key || key.trim().length === 0) return '';
    const trimmed = key.trim();
    if (trimmed.length <= 4) return '••••' + trimmed;
    const lastFour = trimmed.slice(-4);
    return '••••••••' + lastFour;
  };
</script>

<div class="provider-row" role="listitem">
  <!-- Main Provider Row Content with Fixed 5-column Grid -->
  <div class="provider-main-row">
    <!-- Column 1: Information Block (Title, 2-line Description, Purpose) -->
    <div class="provider-info-group">
      <span class="provider-title">{prov.name}</span>
      <span class="provider-desc">{prov.description}</span>
      <span class="provider-purpose">
        {usageText ? usageText : prov.capabilities}
      </span>
    </div>

    <!-- Column 2: Status Badge Column (~130px, 24px height capsule badge, calm surfaces, icon + text) -->
    <div class="col-status">
      <div class="status-badge {badge.statusClass}">
        {#if badge.state === 'checking'}
          <svg class="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path>
          </svg>
          <span>Проверка…</span>
        {:else if badge.state === 'valid'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>Подключён</span>
        {:else if badge.state === 'unverified'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>Требуется проверка</span>
        {:else if badge.statusClass === 'invalid'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <span>{badge.label}</span>
        {:else}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9"></circle>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <span>Не подключён</span>
        {/if}
      </div>
    </div>

    <!-- Column 3: Key Mask Column (~100px, 12px Monospace block with visible suffix) -->
    <div class="col-key">
      {#if hasKey}
        <span class="masked-key-text" title="Маскированный API-ключ">{getMaskedKeyPreview(keyVal)}</span>
      {:else}
        <span class="key-empty-slot"></span>
      {/if}
    </div>

    <!-- Column 4: Action Button Column (~100px, Secondary 'Проверить' or Primary local 'Подключить', height 36px) -->
    <div class="col-action">
      {#if hasKey}
        <button
          type="button"
          class="btn-row secondary"
          onclick={onCheckKey}
          disabled={isChecking}
          title="Проверить работу ключа"
        >
          {isChecking ? 'Проверяется…' : 'Проверить'}
        </button>
      {:else}
        <button
          type="button"
          class="btn-row primary-local"
          onclick={onToggleDisclosure}
          title="Ввести API-ключ и подключить провайдера"
        >
          Подключить
        </button>
      {/if}
    </div>

    <!-- Column 5: Context Menu Column (32x32px Tertiary Icon Button) -->
    <div class="col-menu">
      {#if hasKey}
        <div class="menu-relative-wrap">
          <button
            type="button"
            class="btn-icon-menu"
            class:active={openOverflowId === prov.id}
            onclick={onToggleOverflow}
            aria-label="Дополнительные действия"
            aria-haspopup="true"
            aria-expanded={openOverflowId === prov.id}
            title="Дополнительные действия"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="5" r="1.5"></circle>
              <circle cx="12" cy="12" r="1.5"></circle>
              <circle cx="12" cy="19" r="1.5"></circle>
            </svg>
          </button>

          {#if openOverflowId === prov.id}
            <div class="overflow-menu-dropdown" role="menu">
              <button
                type="button"
                class="menu-dropdown-item"
                role="menuitem"
                onclick={onToggleDisclosure}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>Заменить ключ</span>
              </button>

              <button
                type="button"
                class="menu-dropdown-item danger"
                role="menuitem"
                onclick={onPromptDelete}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>Удалить подключение</span>
              </button>
            </div>
          {/if}
        </div>
      {:else}
        <div class="menu-empty-slot"></div>
      {/if}
    </div>
  </div>

  <!-- Error details bar if validation failed -->
  {#if badge.statusClass === 'invalid' && badge.detail && !isDisclosureOpen}
    <div class="error-detail-bar" role="alert">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
      <span>{badge.detail}</span>
    </div>
  {/if}

  <!-- Inline Disclosure Panel (Connect / Edit Key) -->
  {#if isDisclosureOpen}
    <div class="inline-disclosure-panel">
      <div class="disclosure-header">
        <span class="disclosure-title">{hasKey ? 'Замена API-ключа' : `Подключение к ${prov.name}`}</span>
        <span class="format-helper-text">{prov.formatHelp}</span>
      </div>

      <div class="input-with-mask-row">
        <input
          type={showMask ? 'text' : 'password'}
          placeholder={`Введите API-ключ (${prov.placeholder})`}
          value={draftInput}
          oninput={(e) => onDraftInput(e.currentTarget.value)}
          class="disclosure-key-input"
          autocomplete="off"
          spellcheck="false"
        />

        <button
          type="button"
          class="btn-toggle-mask"
          onclick={onToggleMask}
          title={showMask ? 'Скрыть символы' : 'Показать символы'}
        >
          {#if showMask}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
            <span>Скрыть</span>
          {:else}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>Показать</span>
          {/if}
        </button>
      </div>

      <div class="disclosure-actions-row">
        <Button
          variant="primary"
          size="default"
          disabled={!draftInput.trim() || isChecking}
          onclick={onSaveAndCheck}
          ariaLabel="Сохранить и проверить API-ключ"
        >
          {isChecking ? 'Сохраняется…' : 'Сохранить и проверить'}
        </Button>

        <Button
          variant="ghost"
          size="default"
          onclick={onCancelDisclosure}
          ariaLabel="Отмена"
        >
          Отмена
        </Button>
      </div>
    </div>
  {/if}

  <!-- Confirm Delete Inline Overlay -->
  {#if isConfirmingDelete}
    <div class="inline-confirm-overlay" role="dialog" aria-label="Подтверждение удаления">
      <div class="confirm-dialog-content">
        <div class="confirm-text-group">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          <div>
            <strong>Удалить API-ключ {prov.name}?</strong>
            <p>Ключ будет удалён из локального settings.json. Если сервис активен в настройках, он переключится на другой доступный ключ.</p>
          </div>
        </div>

        <div class="confirm-actions">
          <button
            type="button"
            class="btn-row danger-confirm"
            onclick={onConfirmDelete}
          >
            Да, удалить
          </button>
          <button
            type="button"
            class="btn-row ghost"
            onclick={onCancelDelete}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
