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
  type: 'income' | 'expense';
}

export interface FeaturedTransaction {
  id:string;
  description: string;
  category: string;
  date: string;
}

export interface HistoryLog {
  id: string;
  description: string;
  timestamp: string;
}

export interface BudgetState {
  moneySources: MoneySource[];
  transactions: Transaction[];
  featuredTransactions: FeaturedTransaction[];
  history: HistoryLog[];
}
