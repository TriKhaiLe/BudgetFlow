import type { HistoryLog } from '@/lib/types';

/**
 * Creates a new history log entry with a unique ID and timestamp.
 */
export function createHistoryEntry(description: string): HistoryLog {
  return {
    id: crypto.randomUUID(),
    description,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Appends a history entry to an existing history array.
 */
export function appendHistory(history: HistoryLog[], description: string): HistoryLog[] {
  return [...history, createHistoryEntry(description)];
}
