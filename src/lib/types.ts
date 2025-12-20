export interface MoneySource {
  id: string;
  name: string;
  budget: number;
  spent: number;
  balance: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  moneySourceId: string;
  type: 'income' | 'withdraw';
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
  type: 'income' | 'withdraw';
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
