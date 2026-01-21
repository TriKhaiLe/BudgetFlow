export interface MoneySource {
  id: string;
  name: string;
  budget: number;
  spent: number;
  balance: number;
  lastBalanceUpdate?: string;
}

/**
 * Snapshot of budget and balance before and after a transaction.
 */
export interface TransactionSnapshot {
  budgetBefore: number;
  budgetAfter: number;
  balanceBefore: number;
  balanceAfter: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  moneySourceId: string;
  type: 'income' | 'withdraw' | 'transfer';
  /** Target money source ID for transfer transactions */
  targetMoneySourceId?: string;
  /** Whether this transaction affected the balance (optional for backward compatibility) */
  affectBalance?: boolean;
  /** Snapshot of budget/balance before and after (optional for backward compatibility) */
  snapshot?: TransactionSnapshot;
}

export interface FeaturedTransaction {
  id:string;
  description: string;
  category: string;
  amount: number;
  date: string;
}

export interface TransactionTemplate {
  id: string;
  name: string;
  description: string;
  amount: number;
  category: string;
  moneySourceId: string;
  type: 'income' | 'withdraw' | 'transfer';
  /** Target money source ID for transfer transactions */
  targetMoneySourceId?: string;
  affectBalance: boolean;
}

export interface HistoryLog {
  id: string;
  description: string;
  timestamp: string;
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
  transactions: Transaction[];
  featuredTransactions: FeaturedTransaction[];
  transactionTemplates: TransactionTemplate[];
  history: HistoryLog[];
  currentMonth: string;
  monthDescription?: string; // Optional description/notes for the current month
  metadata?: BudgetMetadata; // Optional for backward compatibility
}
