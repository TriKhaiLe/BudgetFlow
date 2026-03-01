export interface MoneySource {
  id: string;
  name: string;
  budget: number;
  spent: number;
  balance: number;
  lastBalanceUpdate?: string;
}

/**
 * A template for quickly creating budget log entries.
 * Stores preset delta values per money source.
 */
export interface BudgetLogTemplate {
  id: string;
  name: string;
  description: string;
  /** Preset delta changes per money source (key = moneySourceId) */
  changes: Record<string, number>;
}

export interface HistoryLog {
  id: string;
  description: string;
  timestamp: string;
}

/**
 * A budget log entry tracks a budget change across money sources.
 * The first entry (isInitial=true) captures absolute starting budget values.
 * Subsequent entries capture delta changes.
 */
export interface BudgetLogEntry {
  id: string;
  description: string;
  /** Budget change per money source. Key is moneySourceId, value is the change amount (or absolute value for initial). */
  changes: Record<string, number>;
  /** Whether this is the initial budget snapshot (absolute values, not deltas) */
  isInitial: boolean;
  createdAt: string;
}

export interface BudgetMetadata {
  exportDate: string;
  month: number;
  year: number;
  monthLabel: string;
  version: string;
}

export interface BudgetState {
  moneySources: MoneySource[];
  templates: BudgetLogTemplate[];
  history: HistoryLog[];
  budgetLog: BudgetLogEntry[];
  /** Per-money-source lock: when locked, budget log entries won't affect current balance */
  budgetLogBalanceLocks?: Record<string, boolean>;
  currentMonth: string;
  monthDescription?: string; // Optional description/notes for the current month
  metadata?: BudgetMetadata; // Optional for backward compatibility
}
