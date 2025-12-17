import type { BudgetState } from '@/lib/types';
import { startOfMonth } from 'date-fns';
import { format } from 'date-fns';
import { appendHistory, createHistoryEntry } from './history-helpers';

/**
 * Initial state for the budget context.
 */
export const initialBudgetState: BudgetState = {
  moneySources: [],
  transactions: [],
  featuredTransactions: [],
  transactionTemplates: [],
  history: [],
  currentMonth: startOfMonth(new Date()).toISOString(),
  monthDescription: '',
};

/**
 * Handles updating the month description.
 */
export function handleUpdateMonthDescription(
  state: BudgetState,
  description: string
): BudgetState {
  return {
    ...state,
    monthDescription: description,
  };
}

/**
 * Handles setting the current budget month.
 */
export function handleSetCurrentMonth(
  state: BudgetState,
  date: Date
): BudgetState {
  return {
    ...state,
    currentMonth: date.toISOString(),
    history: appendHistory(
      state.history,
      `Changed budget month to ${format(date, 'MMMM yyyy')}`
    ),
  };
}

/**
 * Handles starting a new month by using current balances as budgets.
 * Logs detailed balance information to history and moves to next month.
 */
export function handleStartNewMonth(state: BudgetState): BudgetState {
  const currentDate = new Date(state.currentMonth);
  const nextMonth = new Date(currentDate);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  // Log current balances to history
  const balanceLog = state.moneySources.map(ms => 
    `${ms.name}: ${ms.balance.toLocaleString('vi-VN')} VND`
  ).join(', ');
  
  const historyMessage = `Started new month (${format(nextMonth, 'MMMM yyyy')}). Previous balances: ${balanceLog}`;

  return {
    ...state,
    currentMonth: startOfMonth(nextMonth).toISOString(),
    moneySources: state.moneySources.map((ms) => ({
      ...ms,
      budget: ms.balance, // Use current balance as next month's budget
      spent: 0, // Reset spending
    })),
    transactions: [], // Clear all transactions
    featuredTransactions: [], // Clear featured transactions
    monthDescription: '', // Clear month description for the new month
    history: [createHistoryEntry(historyMessage)], // Start fresh history with current balances logged
  };
}

/**
 * Handles importing data with different strategies.
 */
export function handleImportData(
  state: BudgetState,
  payload: { state: BudgetState; strategy: 'REPLACE' | 'NEXT_MONTH' }
): BudgetState {
  const { state: importedState, strategy } = payload;

  // Always migrate the imported state to ensure all required fields exist
  const migratedImportedState = migrateState(importedState);

  if (strategy === 'REPLACE') {
    return {
      ...migratedImportedState,
      history: [
        ...(migratedImportedState.history || []),
        createHistoryEntry('Data imported and replaced.'),
      ],
    };
  }

  if (strategy === 'NEXT_MONTH') {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return {
      ...initialBudgetState,
      currentMonth: startOfMonth(nextMonth).toISOString(),
      moneySources: migratedImportedState.moneySources.map((ms) => ({
        ...ms,
        budget: ms.balance,
        spent: 0,
      })),
      history: [
        createHistoryEntry(
          'Data imported for next month. Budgets set from previous balances, spending reset.'
        ),
      ],
    };
  }

  return state;
}

/**
 * Performs backward compatibility migrations on loaded state.
 */
export function migrateState(parsedState: BudgetState): BudgetState {
  const warnings: string[] = [];
  
  // Ensure currentMonth exists
  if (!parsedState.currentMonth) {
    parsedState.currentMonth = startOfMonth(new Date()).toISOString();
    warnings.push('Missing currentMonth, defaulted to current month');
  }

  // Migrate transaction types (backward compatibility)
  if (parsedState.transactions) {
    parsedState.transactions = parsedState.transactions.map((t: any) => ({
      ...t,
      type: t.type || (t.amount > 0 ? 'income' : 'expense'),
      amount: Math.abs(t.amount),
    }));
  }

  // Ensure arrays exist
  if (!parsedState.featuredTransactions) {
    parsedState.featuredTransactions = [];
    warnings.push('Missing featuredTransactions');
  }
  if (!parsedState.transactionTemplates) {
    parsedState.transactionTemplates = [];
    warnings.push('Missing transactionTemplates');
  }
  if (!parsedState.history) {
    parsedState.history = [];
    warnings.push('Missing history');
  }

  // Ensure monthDescription exists
  if (parsedState.monthDescription === undefined) {
    parsedState.monthDescription = '';
  }

  // Log warnings if this is a legacy file
  if (warnings.length > 0 && typeof window !== 'undefined') {
    console.warn('Legacy file detected. Migration applied:', warnings);
  }

  // Remove metadata from state (it's only for export reference)
  if (parsedState.metadata) {
    delete parsedState.metadata;
  }

  return parsedState;
}
