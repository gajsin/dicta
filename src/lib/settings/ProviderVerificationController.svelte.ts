import type { ProviderStatusInfo } from '../utils/apiKeyVerifier';
import {
  checkProviderKey,
  getProviderStatusBadge,
} from '../utils/apiKeyVerifier';
import {
  createDefaultProviderApiKeys,
  isProviderId,
  PROVIDER_IDS,
  type ProviderApiKeys,
  type ProviderId,
} from './model';

interface ProviderVerificationOptions {
  persist: () => Promise<void>;
  deleteKey: (provider: ProviderId) => Promise<void>;
}

function createStatuses(
  keys: ProviderApiKeys,
  verifiedProviders: ProviderId[],
): Record<ProviderId, ProviderStatusInfo> {
  return Object.fromEntries(
    PROVIDER_IDS.map((provider) => [
      provider,
      {
        state: verifiedProviders.includes(provider)
          ? 'valid'
          : keys[provider].trim()
            ? 'unverified'
            : 'idle',
      },
    ]),
  ) as Record<ProviderId, ProviderStatusInfo>;
}

export class ProviderVerificationController {
  keys = $state<ProviderApiKeys>(createDefaultProviderApiKeys());
  verifiedProviders = $state<ProviderId[]>([]);
  statuses = $state<Record<ProviderId, ProviderStatusInfo>>(
    createStatuses(this.keys, this.verifiedProviders),
  );

  readonly #persist: () => Promise<void>;
  readonly #deleteKey: (provider: ProviderId) => Promise<void>;

  constructor({ persist, deleteKey }: ProviderVerificationOptions) {
    this.#persist = persist;
    this.#deleteKey = deleteKey;
  }

  hydrate(keys: ProviderApiKeys, verifiedProviders: ProviderId[]): void {
    const normalizedVerified = verifiedProviders.filter(
      (provider) => keys[provider].trim(),
    );
    const keysChanged = PROVIDER_IDS.some(
      (provider) => this.keys[provider] !== keys[provider],
    );
    const verificationChanged =
      normalizedVerified.length !== this.verifiedProviders.length ||
      normalizedVerified.some(
        (provider) => !this.verifiedProviders.includes(provider),
      );
    if (!keysChanged && !verificationChanged) return;

    this.keys = { ...keys };
    this.verifiedProviders = [...normalizedVerified];
    this.statuses = createStatuses(this.keys, this.verifiedProviders);
  }

  badge(provider: ProviderId) {
    return getProviderStatusBadge(
      provider,
      this.keys[provider],
      this.statuses[provider],
    );
  }

  async verify(providerValue: string): Promise<void> {
    if (!isProviderId(providerValue)) return;
    const provider = providerValue;
    const key = this.keys[provider].trim();
    if (!key) return;

    const previousVerified = [...this.verifiedProviders];
    this.statuses[provider] = { state: 'checking' };
    try {
      const result = await checkProviderKey(provider, key);
      if (result.state === 'valid' || result.state === 'invalid_key') {
        this.setVerified(provider, result.state === 'valid');
        await this.#persist();
      }
      this.statuses[provider] = result;
    } catch (error) {
      this.verifiedProviders = previousVerified;
      this.statuses[provider] = {
        state: 'error',
        errorMsg:
          error instanceof Error ? error.message : 'Неизвестная ошибка сети',
      };
    }
  }

  async save(providerValue: string, value: string): Promise<void> {
    if (!isProviderId(providerValue)) return;
    const provider = providerValue;
    const previousKeys = { ...this.keys };
    const previousStatus = this.statuses[provider];
    const previousVerified = [...this.verifiedProviders];

    this.keys = { ...this.keys, [provider]: value.trim() };
    this.setVerified(provider, false);
    this.statuses[provider] = {
      state: this.keys[provider] ? 'unverified' : 'idle',
    };
    try {
      await this.#persist();
      await this.verify(provider);
    } catch (error) {
      this.keys = previousKeys;
      this.verifiedProviders = previousVerified;
      this.statuses[provider] = previousStatus;
      throw error;
    }
  }

  async clear(providerValue: string): Promise<void> {
    if (!isProviderId(providerValue)) return;
    const provider = providerValue;
    const previousKeys = { ...this.keys };
    const previousStatus = this.statuses[provider];
    const previousVerified = [...this.verifiedProviders];

    this.keys = { ...this.keys, [provider]: '' };
    this.setVerified(provider, false);
    this.statuses[provider] = { state: 'idle' };
    try {
      await this.#deleteKey(provider);
      await this.#persist();
    } catch (error) {
      this.keys = previousKeys;
      this.verifiedProviders = previousVerified;
      this.statuses[provider] = {
        ...previousStatus,
        state: 'error',
        errorMsg: String(error || 'Не удалось удалить API-ключ'),
      };
      throw error;
    }
  }

  private setVerified(provider: ProviderId, verified: boolean): void {
    this.verifiedProviders = verified
      ? [...new Set([...this.verifiedProviders, provider])]
      : this.verifiedProviders.filter((current) => current !== provider);
  }
}
