import { invoke } from '@tauri-apps/api/core';

export type ProviderCheckState =
  | 'idle'
  | 'checking'
  | 'valid'
  | 'invalid_key'
  | 'network_error'
  | 'rate_limit'
  | 'provider_unavailable'
  | 'error'
  | 'unverified';

export interface ProviderStatusInfo {
  state: ProviderCheckState;
  lastChecked?: string;
  errorMsg?: string;
}

export function getProviderStatusBadge(provider: string, keyVal: string, statusInfo?: ProviderStatusInfo) {
  if (!keyVal || !keyVal.trim()) {
    return { label: 'Не подключён', statusClass: 'disconnected', state: 'disconnected' };
  }
  const stInfo = statusInfo || { state: 'idle' };
  const st = stInfo.state;
  if (st === 'checking') return { label: 'Проверяется…', statusClass: 'checking', state: 'checking' };
  if (st === 'invalid_key') return { label: 'Ошибка подключения', statusClass: 'invalid', state: 'invalid_key', detail: stInfo.errorMsg || 'Недействительный API-ключ' };
  if (st === 'rate_limit') return { label: 'Ошибка подключения', statusClass: 'invalid', state: 'rate_limit', detail: stInfo.errorMsg || 'Превышен лимит запросов (429)' };
  if (st === 'provider_unavailable') return { label: 'Ошибка подключения', statusClass: 'invalid', state: 'provider_unavailable', detail: stInfo.errorMsg || 'Сервис временно недоступен (50x)' };
  if (st === 'network_error') return { label: 'Ошибка подключения', statusClass: 'invalid', state: 'network_error', detail: stInfo.errorMsg || 'Не удалось связаться с сервером' };
  if (st === 'error') return { label: 'Ошибка подключения', statusClass: 'invalid', state: 'error', detail: stInfo.errorMsg || 'Ошибка проверки' };
  if (st === 'valid') return { label: 'Подключён', statusClass: 'valid', state: 'valid', lastChecked: stInfo.lastChecked };

  return { label: 'Не проверен', statusClass: 'unverified', state: 'unverified' };
}

export async function checkProviderKey(provider: string, key: string): Promise<ProviderStatusInfo> {
  if (!key || key.trim().length < 4) {
    return {
      state: 'invalid_key',
      errorMsg: 'Укажите действительный API-ключ'
    };
  }

  const tauriInternals = typeof window !== 'undefined' ? window.__TAURI_INTERNALS__ : undefined;
  if (tauriInternals?.invoke) {
    try {
      const ok = await invoke<boolean>('check_provider_api_key', { provider, apiKey: key.trim() });
      if (ok) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return { state: 'valid', lastChecked: time };
      } else {
        return { state: 'invalid_key', errorMsg: 'Недействительный API-ключ' };
      }
    } catch (err: unknown) {
      const str = String(err || '');
      const lower = str.toLowerCase();

      let state: ProviderCheckState = 'invalid_key';
      let msg = str;

      if (str.includes('401') || str.includes('403') || lower.includes('unauthorized') || lower.includes('forbidden') || lower.includes('invalid')) {
        state = 'invalid_key';
        msg = 'Недействительный API-ключ (ошибка 401/403)';
      } else if (str.includes('429') || lower.includes('rate') || lower.includes('limit')) {
        state = 'rate_limit';
        msg = 'Превышен лимит запросов API (ошибка 429)';
      } else if (str.includes('500') || str.includes('502') || str.includes('503') || str.includes('504') || lower.includes('unavailable')) {
        state = 'provider_unavailable';
        msg = 'Сервис провайдера временно недоступен (50x)';
      } else if (lower.includes('ошибка подключения') || lower.includes('network') || lower.includes('connect') || lower.includes('timeout') || lower.includes('dns') || lower.includes('send')) {
        state = 'network_error';
        msg = 'Ошибка сети: не удалось связаться с сервером';
      }

      return { state, errorMsg: msg };
    }
  }

  return {
    state: 'unverified',
    errorMsg: 'Проверка API-ключа доступна только в настольном приложении'
  };
}
