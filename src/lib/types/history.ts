export interface HistoryItem {
  id: string;
  timestamp: string; // ISO date string
  dateGroup?: 'today' | 'yesterday' | 'this_week' | 'earlier';
  timeStr?: string; // e.g. "16:37"
  duration: number; // in seconds
  processedText: string;
  rawText?: string;
  wordCount?: number;
  targetApp?: string;
  isPinned?: boolean;
}
