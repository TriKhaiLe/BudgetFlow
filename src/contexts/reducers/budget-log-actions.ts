import type { BudgetState, BudgetLogEntry } from '@/lib/types';
import { appendHistory } from './history-helpers';
import { formatCurrency } from '@/lib/utils';

/**
 * Handles initializing the budget log with current money source budgets.
 * Creates an initial entry (isInitial=true) capturing absolute budget values.
 */
export function handleInitializeBudgetLog(
  state: BudgetState,
  description: string
): BudgetState {
  // Don't create if an initial entry already exists
  if (state.budgetLog.some((entry) => entry.isInitial)) {
    return state;
  }

  const changes: Record<string, number> = {};
  state.moneySources.forEach((ms) => {
    changes[ms.id] = ms.budget;
  });

  const initialEntry: BudgetLogEntry = {
    id: crypto.randomUUID(),
    description: description || 'Initial budget',
    changes,
    isInitial: true,
    createdAt: new Date().toISOString(),
  };

  return {
    ...state,
    budgetLog: [initialEntry],
    history: appendHistory(state.history, 'Initialized budget log tracking'),
  };
}

/**
 * Handles adding a new budget log entry.
 * Updates money source budgets by the delta amounts in changes.
 */
export function handleAddBudgetLogEntry(
  state: BudgetState,
  payload: { description: string; changes: Record<string, number> }
): BudgetState {
  const { description, changes } = payload;

  const newEntry: BudgetLogEntry = {
    id: crypto.randomUUID(),
    description,
    changes,
    isInitial: false,
    createdAt: new Date().toISOString(),
  };

  // Build a readable summary of changes
  const changeSummary = Object.entries(changes)
    .filter(([, amount]) => amount !== 0)
    .map(([msId, amount]) => {
      const ms = state.moneySources.find((s) => s.id === msId);
      return `${ms?.name || 'Unknown'}: ${amount > 0 ? '+' : ''}${formatCurrency(amount)}`;
    })
    .join(', ');

  return {
    ...state,
    budgetLog: [...state.budgetLog, newEntry],
    moneySources: state.moneySources.map((ms) => {
      const delta = changes[ms.id];
      if (!delta) return ms;

      const newBudget = ms.budget + delta;
      const newSpent = newBudget - ms.balance;
      return { ...ms, budget: newBudget, spent: newSpent };
    }),
    history: appendHistory(
      state.history,
      `Budget log: ${description || 'Untitled'} (${changeSummary || 'no changes'})`
    ),
  };
}

/**
 * Handles deleting a budget log entry.
 * Reverses the budget changes if the entry is not the initial entry.
 */
export function handleDeleteBudgetLogEntry(
  state: BudgetState,
  entryId: string
): BudgetState {
  const entry = state.budgetLog.find((e) => e.id === entryId);
  if (!entry) return state;

  // Don't allow deleting the initial entry if there are other entries
  if (entry.isInitial && state.budgetLog.length > 1) {
    return state;
  }

  // Reverse budget changes for non-initial entries
  const updatedMoneySources = entry.isInitial
    ? state.moneySources
    : state.moneySources.map((ms) => {
        const delta = entry.changes[ms.id];
        if (!delta) return ms;

        const newBudget = ms.budget - delta;
        const newSpent = newBudget - ms.balance;
        return { ...ms, budget: newBudget, spent: newSpent };
      });

  return {
    ...state,
    budgetLog: state.budgetLog.filter((e) => e.id !== entryId),
    moneySources: updatedMoneySources,
    history: appendHistory(
      state.history,
      `Deleted budget log entry: ${entry.description || 'Untitled'}`
    ),
  };
}

/**
 * Handles updating an existing budget log entry.
 * Reverses old changes and applies new ones for non-initial entries.
 */
export function handleUpdateBudgetLogEntry(
  state: BudgetState,
  payload: { id: string; description: string; changes: Record<string, number> }
): BudgetState {
  const { id, description, changes: newChanges } = payload;
  const oldEntry = state.budgetLog.find((e) => e.id === id);
  if (!oldEntry) return state;

  const updatedEntry: BudgetLogEntry = {
    ...oldEntry,
    description,
    changes: newChanges,
  };

  // For non-initial entries, reverse old changes and apply new ones
  const updatedMoneySources = oldEntry.isInitial
    ? state.moneySources
    : state.moneySources.map((ms) => {
        const oldDelta = oldEntry.changes[ms.id] || 0;
        const newDelta = newChanges[ms.id] || 0;
        const netChange = newDelta - oldDelta;
        if (netChange === 0) return ms;

        const newBudget = ms.budget + netChange;
        const newSpent = newBudget - ms.balance;
        return { ...ms, budget: newBudget, spent: newSpent };
      });

  return {
    ...state,
    budgetLog: state.budgetLog.map((e) => (e.id === id ? updatedEntry : e)),
    moneySources: updatedMoneySources,
    history: appendHistory(
      state.history,
      `Updated budget log entry: ${description || 'Untitled'}`
    ),
  };
}
