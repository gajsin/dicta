import type { WidgetState } from '../types/widget.js';

export type RecordingStatusKind =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'success'
  | 'error'
  | 'cancelled';

export interface RecordingStatus {
  kind: RecordingStatusKind;
  label: string;
}

const LISTENING_STATES = new Set<WidgetState>(['listening', 'recording']);
const SUCCESS_STATES = new Set<WidgetState>(['copied', 'done', 'inserting']);
const ERROR_STATES = new Set<WidgetState>([
  'error',
  'no_speech',
  'mic_unavailable',
]);
const REFINING_STATES = new Set<WidgetState>(['refining', 'enhancing']);
const FINISHING_STATES = new Set<WidgetState>(['finishing', 'stopping']);
const PROCESSING_STATES = new Set<WidgetState>([
  ...FINISHING_STATES,
  'transcribing',
  'recognizing',
  'processing',
  ...REFINING_STATES,
]);

export function getRecordingStatus(
  state: WidgetState,
  message: string,
): RecordingStatus {
  if (state === 'idle') {
    return { kind: 'idle', label: 'Начать запись' };
  }
  if (LISTENING_STATES.has(state)) {
    return { kind: 'listening', label: 'Слушаю' };
  }
  if (SUCCESS_STATES.has(state)) {
    return { kind: 'success', label: 'Скопировано' };
  }
  if (ERROR_STATES.has(state)) {
    return { kind: 'error', label: message || 'Произошла ошибка' };
  }
  if (state === 'cancelled') {
    return { kind: 'cancelled', label: message || 'Запись отменена' };
  }
  if (PROCESSING_STATES.has(state)) {
    const fallback = REFINING_STATES.has(state)
      ? 'Улучшаю текст…'
      : FINISHING_STATES.has(state)
        ? 'Завершаю…'
        : 'Распознаю…';
    return { kind: 'processing', label: message || fallback };
  }

  return { kind: 'idle', label: 'Начать запись' };
}
