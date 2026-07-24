export interface ErrorInfo {
  message: string;
  actionType: 'retry' | 'settings' | 'close';
}

export function getNormalizedErrorInfo(error: unknown): ErrorInfo {
  let raw = '';

  if (typeof error === 'string') {
    raw = error.toLowerCase();
  } else if (error instanceof Error) {
    raw = error.message?.toLowerCase() ?? '';
  } else if (error && typeof error === 'object') {
    const errorRecord = error as Record<string, unknown>;
    raw = String(errorRecord.message || errorRecord.error || JSON.stringify(error)).toLowerCase();
  }

  if (!raw) {
    return {
      message: 'Не удалось выполнить диктовку. Попробуйте записать ещё раз.',
      actionType: 'retry',
    };
  }

  if (raw.includes('notallowed') || raw.includes('permission') || raw.includes('доступ к микрофону запрещён')) {
    return {
      message: 'Доступ к микрофону запрещён. Разрешите доступ в настройках системы.',
      actionType: 'settings',
    };
  }

  if (raw.includes('notfound') || raw.includes('device') || raw.includes('микрофон не найден')) {
    return {
      message: 'Микрофон не найден. Проверьте подключение в настройках.',
      actionType: 'settings',
    };
  }

  if (raw.includes('notreadable') || raw.includes('busy') || raw.includes('микрофон занят')) {
    return {
      message: 'Микрофон занят другим приложением. Закройте его и повторите попытку.',
      actionType: 'close',
    };
  }

  if (
    raw.includes('401') ||
    raw.includes('403') ||
    raw.includes('unauthorized') ||
    raw.includes('добавьте api-ключ') ||
    raw.includes('invalid api key') ||
    raw.includes('неавториз')
  ) {
    return {
      message: 'Неверный API-ключ',
      actionType: 'settings',
    };
  }

  if (
    raw.includes('сеть') ||
    raw.includes('тайм-аут') ||
    raw.includes('таймаут') ||
    raw.includes('timeout') ||
    raw.includes('connection') ||
    raw.includes('fetch') ||
    raw.includes('network') ||
    raw.includes('failed to fetch')
  ) {
    return {
      message: 'Нет связи с сервером. Проверьте интернет-соединение.',
      actionType: 'retry',
    };
  }

  if (
    raw.includes('500') ||
    raw.includes('502') ||
    raw.includes('503') ||
    raw.includes('504') ||
    raw.includes('unavailable') ||
    raw.includes('провайдер недоступен')
  ) {
    return {
      message: 'Сервер провайдера временно недоступен.',
      actionType: 'retry',
    };
  }

  if (
    raw.includes('максимальная длительность') ||
    raw.includes('слишком длинная') ||
    raw.includes('10 мин')
  ) {
    return {
      message: 'Запись слишком длинная (максимум 10 минут).',
      actionType: 'retry',
    };
  }

  if (
    raw.includes('пуст') ||
    raw.includes('empty') ||
    raw.includes('слишком короткая') ||
    raw.includes('0 байт') ||
    raw.includes('не содержит звука')
  ) {
    return {
      message: 'Речь не обнаружена.',
      actionType: 'retry',
    };
  }

  if (raw.includes('clipboard') || raw.includes('буфер обмена')) {
    return {
      message: 'Текст сохранён, но произошла ошибка копирования в буфер.',
      actionType: 'retry',
    };
  }

  if (raw.includes('запись не была начата') || raw.includes('recording not started')) {
    return {
      message: 'Запись уже была завершена.',
      actionType: 'close',
    };
  }

  // Fallback nicely formatted message
  const userMessage =
    typeof error === 'string' && error.trim().length > 0
      ? error.trim()
      : error instanceof Error && error.message
      ? error.message
      : 'Не удалось выполнить диктовку. Попробуйте записать ещё раз.';

  return {
    message: userMessage,
    actionType: 'retry',
  };
}

export function normalizeErrorMessage(error: unknown): string {
  return getNormalizedErrorInfo(error).message;
}
