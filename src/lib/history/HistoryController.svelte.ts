import type { HistoryItem } from '../types/history';
import { parseHistoryJson, serializeHistory } from './storage';

const HISTORY_STORAGE_KEY = 'dicta_history';

interface HistoryControllerOptions {
  onNotice: (message: string) => void;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function createHistoryId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class HistoryController {
  items = $state<HistoryItem[]>([]);
  selectedId = $state<string | null>(null);
  lastDeletedItems = $state<HistoryItem[] | null>(null);

  readonly #onNotice: (message: string) => void;

  constructor({ onNotice }: HistoryControllerOptions) {
    this.#onNotice = onNotice;
  }

  get canUndo(): boolean {
    return Boolean(this.lastDeletedItems?.length);
  }

  load(): void {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!stored) return;
      this.items = parseHistoryJson(stored);
    } catch (error) {
      console.error('[Dicta] Failed to load history:', error);
      this.items = [];
    }
  }

  add(text: string, durationSec: number, rawText = text): void {
    const now = new Date();
    const item: HistoryItem = {
      id: createHistoryId(),
      timestamp: now.toISOString(),
      timeStr: now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      dateGroup: 'today',
      duration: Math.max(0, durationSec),
      processedText: text,
      rawText,
      wordCount: wordCount(text),
    };

    this.items = [item, ...this.items];
    this.selectedId = item.id;
    this.#persist();
  }

  delete(id: string): void {
    const item = this.items.find((candidate) => candidate.id === id);
    if (!item) return;

    this.lastDeletedItems = [item];
    this.items = this.items.filter((candidate) => candidate.id !== id);
    if (this.selectedId === id) {
      this.selectedId = this.items[0]?.id ?? null;
    }
    this.#persist();
    this.#onNotice('Запись удалена');
  }

  update(
    id: string,
    field: 'rawText' | 'processedText',
    updatedText: string,
  ): void {
    this.items = this.items.map((item) => {
      if (item.id !== id) return item;
      const processedText =
        field === 'processedText' ? updatedText : item.processedText;
      return {
        ...item,
        processedText,
        rawText: field === 'rawText' ? updatedText : item.rawText,
        wordCount: wordCount(processedText),
      };
    });
    this.#persist();
    this.#onNotice('Текст обновлён');
  }

  clear(): void {
    if (this.items.length === 0) return;
    this.lastDeletedItems = [...this.items];
    this.items = [];
    this.selectedId = null;
    this.#persist();
    this.#onNotice('История очищена');
  }

  undo(): void {
    if (!this.lastDeletedItems?.length) return;

    const restored = this.lastDeletedItems;
    this.items = [...restored, ...this.items];
    this.selectedId = restored[0]?.id ?? this.selectedId;
    this.lastDeletedItems = null;
    this.#persist();
    this.#onNotice(
      restored.length === 1 ? 'Запись восстановлена' : 'История восстановлена',
    );
  }

  #persist(): void {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, serializeHistory(this.items));
    } catch (error) {
      console.error('[Dicta] Failed to persist history:', error);
      this.#onNotice('Не удалось сохранить историю');
    }
  }
}
