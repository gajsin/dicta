import type { HistoryItem } from '../types/history.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseItem(value: unknown): HistoryItem | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== 'string' ||
    !value.id ||
    typeof value.timestamp !== 'string' ||
    Number.isNaN(Date.parse(value.timestamp)) ||
    typeof value.processedText !== 'string' ||
    typeof value.duration !== 'number' ||
    !Number.isFinite(value.duration)
  ) {
    return null;
  }

  const item: HistoryItem = {
    id: value.id,
    timestamp: value.timestamp,
    duration: Math.max(0, value.duration),
    processedText: value.processedText,
    rawText:
      typeof value.rawText === 'string' ? value.rawText : value.processedText,
  };
  if (typeof value.wordCount === 'number' && Number.isFinite(value.wordCount)) {
    item.wordCount = Math.max(0, value.wordCount);
  }
  if (typeof value.timeStr === 'string') item.timeStr = value.timeStr;
  if (typeof value.targetApp === 'string') item.targetApp = value.targetApp;
  if (typeof value.isPinned === 'boolean') item.isPinned = value.isPinned;
  return item;
}

export function parseHistoryJson(raw: string): HistoryItem[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map(parseItem)
    .filter((item): item is HistoryItem => item !== null);
}

export function serializeHistory(items: HistoryItem[]): string {
  return JSON.stringify(items);
}
