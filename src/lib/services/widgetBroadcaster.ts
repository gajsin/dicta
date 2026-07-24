import { emit } from '@tauri-apps/api/event';
import type { WidgetState } from '../types/widget';

export interface WidgetPayload {
  state: WidgetState;
  message: string;
  timerSeconds: number;
  audioLevel: number;
  theme: string;
  hotkey: string;
  errorActionType?: 'retry' | 'settings' | 'close';
}

export function broadcastWidgetUpdate(
  windowLabel: string,
  isTauriRuntime: boolean,
  payload: WidgetPayload
): void {
  if (windowLabel === 'main' && isTauriRuntime) {
    emit('widget-update', payload).catch(console.error);
  }
}
