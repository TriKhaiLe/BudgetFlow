import type { BudgetState, MoneySource } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { appendHistory } from './history-helpers';

/**
 * Handles adding a new money source to the state.
 */
export function handleAddMoneySource(
  state: BudgetState,
  payload: Omit<MoneySource, 'id' | 'spent'>
): BudgetState {
  const newSource: MoneySource = {
    ...payload,
    id: crypto.randomUUID(),
    spent: payload.budget - payload.balance,
  };

  const hasInitialBudgetLog = state.budgetLog.some((entry) => entry.isInitial);
  const addSourceEntry = hasInitialBudgetLog
    ? {
        id: crypto.randomUUID(),
        description: `Add money source: ${newSource.name}`,
        changes: { [newSource.id]: payload.budget },
        isInitial: false,
        createdAt: new Date().toISOString(),
      }
    : null;

  return {
    ...state,
    moneySources: [...state.moneySources, newSource],
    budgetLog: addSourceEntry ? [...state.budgetLog, addSourceEntry] : state.budgetLog,
    history: appendHistory(state.history, `Created money source: ${newSource.name}`),
  };
}

/**
 * Handles updating an existing money source.
 */
export function handleUpdateMoneySource(
  state: BudgetState,
  payload: MoneySource
): BudgetState {
  return {
    ...state,
    moneySources: state.moneySources.map((ms) =>
      ms.id === payload.id ? payload : ms
    ),
    history: appendHistory(state.history, `Updated money source: ${payload.name}`),
  };
}

/**
 * Handles deleting a money source and its associated transactions.
 */
export function handleDeleteMoneySource(
  state: BudgetState,
  sourceId: string
): BudgetState {
  const sourceToDelete = state.moneySources.find((ms) => ms.id === sourceId);
  if (!sourceToDelete) return state;

  return {
    ...state,
    moneySources: state.moneySources.filter((ms) => ms.id !== sourceId),
    history: appendHistory(
      state.history,
      `Deleted money source: ${sourceToDelete.name}`
    ),
  };
}

/**
 * Handles adjusting the balance of a money source directly.
 */
export function handleAdjustBalance(
  state: BudgetState,
  payload: { moneySourceId: string; newBalance: number }
): BudgetState {
  const { moneySourceId, newBalance } = payload;
  const source = state.moneySources.find((ms) => ms.id === moneySourceId);
  if (!source) return state;

  const oldBalance = source.balance;
  const difference = newBalance - oldBalance;

  return {
    ...state,
    moneySources: state.moneySources.map((ms) =>
      ms.id === moneySourceId
        ? { ...ms, balance: newBalance, spent: ms.budget - newBalance, lastBalanceUpdate: new Date().toISOString() }
        : ms
    ),
    history: appendHistory(
      state.history,
      `Adjusted balance for ${source.name} from ${formatCurrency(oldBalance)} to ${formatCurrency(newBalance)} (Difference: ${difference > 0 ? '+' : ''}${formatCurrency(difference)}).`
    ),
  };
}
