import { 
  FilePlus, 
  FileMinus, 
  History, 
  Wrench, 
  CircleDollarSign, 
  Download, 
  Heart,
  type LucideIcon
} from 'lucide-react';

/**
 * Category suggestion options for transaction forms.
 * Used in combobox/select components for category selection.
 */
export const CATEGORY_SUGGESTIONS = [
  { value: 'food', label: 'Food & Groceries' },
  { value: 'transport', label: 'Transport' },
  { value: 'housing', label: 'Housing' },
  { value: 'salary', label: 'Salary' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'health', label: 'Health' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'personal care', label: 'Personal Care' },
  { value: 'investment', label: 'Investment' },
  { value: 'other', label: 'Other' },
] as const;

export type CategoryValue = typeof CATEGORY_SUGGESTIONS[number]['value'];

/**
 * History icon configuration for transaction history display.
 * Maps action keywords to icons and colors.
 */
export interface HistoryIconConfig {
  icon: LucideIcon;
  color: string;
}

export const HISTORY_ICON_MAP: Record<string, HistoryIconConfig> = {
  'created': { icon: FilePlus, color: 'text-green-500' },
  'updated': { icon: Wrench, color: 'text-blue-500' },
  'deleted': { icon: FileMinus, color: 'text-red-500' },
  'transaction': { icon: CircleDollarSign, color: 'text-yellow-500' },
  'adjusted': { icon: History, color: 'text-purple-500' },
  'added featured': { icon: Heart, color: 'text-pink-500' },
  'removed featured': { icon: Heart, color: 'text-gray-500' },
  'data imported': { icon: Download, color: 'text-indigo-500' },
  'changed budget': { icon: History, color: 'text-orange-500' },
};

/**
 * Default icon for history entries that don't match any keyword.
 */
export const DEFAULT_HISTORY_ICON: HistoryIconConfig = {
  icon: History,
  color: 'text-muted-foreground',
};

/**
 * Get the appropriate icon configuration for a history log entry.
 */
export function getHistoryIconConfig(description: string): HistoryIconConfig {
  const lowerCaseDesc = description.toLowerCase();
  for (const key in HISTORY_ICON_MAP) {
    if (lowerCaseDesc.startsWith(key)) {
      return HISTORY_ICON_MAP[key];
    }
  }
  return DEFAULT_HISTORY_ICON;
}

/**
 * Local storage key for persisting budget state.
 */
export const STORAGE_KEY = 'budgetFlowState';

/**
 * Transaction types for the application.
 */
export const TRANSACTION_TYPES = ['income', 'expense'] as const;
export type TransactionType = typeof TRANSACTION_TYPES[number];

/**
 * Data import strategies.
 */
export const IMPORT_STRATEGIES = ['REPLACE', 'NEXT_MONTH'] as const;
export type ImportStrategy = typeof IMPORT_STRATEGIES[number];
