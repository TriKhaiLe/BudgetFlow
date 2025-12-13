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
  history: [],
  currentMonth: startOfMonth(new Date()).toISOString(),
};

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
 * Handles importing data with different strategies.
 */
export function handleImportData(
  state: BudgetState,
  payload: { state: BudgetState; strategy: 'REPLACE' | 'NEXT_MONTH' }
): BudgetState {
  const { state: importedState, strategy } = payload;

  if (strategy === 'REPLACE') {
    return {
      ...importedState,
      history: [
        ...(importedState.history || []),
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
      moneySources: importedState.moneySources.map((ms) => ({
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
  // Ensure currentMonth exists
  if (!parsedState.currentMonth) {
    parsedState.currentMonth = startOfMonth(new Date()).toISOString();
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
  }
  if (!parsedState.history) {
    parsedState.history = [];
  }

  return parsedState;
}
