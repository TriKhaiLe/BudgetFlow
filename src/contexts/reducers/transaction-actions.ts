import type { BudgetState, Transaction, FeaturedTransaction, TransactionSnapshot } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { appendHistory } from './history-helpers';

/**
 * Handles adding a new transaction to the state.
 * Updates the associated money source balance, budget, and spent amounts.
 * Stores affectBalance and before/after snapshots for tracking.
 */
export function handleAddTransaction(
  state: BudgetState,
  payload: Omit<Transaction, 'id' | 'snapshot'> & { affectBalance: boolean }
): BudgetState {
  const { affectBalance, ...transactionPayload } = payload;
  const { amount, moneySourceId, type } = transactionPayload;
  const signedAmount = type === 'income' ? amount : -amount;

  // Find the money source to get before values
  const moneySource = state.moneySources.find((ms) => ms.id === moneySourceId);
  const budgetBefore = moneySource?.budget ?? 0;
  const balanceBefore = moneySource?.balance ?? 0;

  // Calculate after values
  const balanceAfter = affectBalance ? balanceBefore + signedAmount : balanceBefore;
  const budgetAfter = budgetBefore + signedAmount;

  // Create snapshot
  const snapshot: TransactionSnapshot = {
    budgetBefore,
    budgetAfter,
    balanceBefore,
    balanceAfter,
  };

  const newTransaction: Transaction = {
    ...transactionPayload,
    id: crypto.randomUUID(),
    affectBalance,
    snapshot,
  };

  return {
    ...state,
    transactions: [newTransaction, ...state.transactions],
    moneySources: state.moneySources.map((ms) => {
      if (ms.id !== moneySourceId) return ms;

      const newBalance = affectBalance ? ms.balance + signedAmount : ms.balance;
      const newBudget = ms.budget + signedAmount;
      const newSpent = newBudget - newBalance;

      return { ...ms, balance: newBalance, budget: newBudget, spent: newSpent };
    }),
    history: appendHistory(
      state.history,
      `Transaction: ${newTransaction.description || 'Untitled'} (${signedAmount > 0 ? '+' : ''}${formatCurrency(signedAmount)})`
    ),
  };
}

/**
 * Handles updating an existing transaction.
 * Note: This is a simplified implementation that doesn't rebalance.
 * A full implementation would reverse the old transaction and apply the new one.
 */
export function handleUpdateTransaction(
  state: BudgetState,
  payload: Transaction
): BudgetState {
  return {
    ...state,
    transactions: state.transactions.map((t) =>
      t.id === payload.id ? payload : t
    ),
    history: appendHistory(
      state.history,
      `Updated transaction: ${payload.description}. Manual balance check recommended.`
    ),
  };
}

/**
 * Handles deleting a transaction.
 * Reverses the balance changes assuming the transaction affected the balance.
 * TODO: Store `affectBalance` on the transaction object for accurate reversal.
 */
export function handleDeleteTransaction(
  state: BudgetState,
  payload: Transaction
): BudgetState {
  const { amount, moneySourceId, type, description } = payload;
  const signedAmount = type === 'income' ? amount : -amount;

  return {
    ...state,
    transactions: state.transactions.filter((t) => t.id !== payload.id),
    moneySources: state.moneySources.map((ms) =>
      ms.id === moneySourceId
        ? {
            ...ms,
            balance: ms.balance - signedAmount,
            budget: ms.budget - signedAmount,
            spent: (ms.budget - signedAmount) - (ms.balance - signedAmount),
          }
        : ms
    ),
    history: appendHistory(state.history, `Deleted transaction: ${description}`),
  };
}

/**
 * Handles adding a featured transaction (non-budget-affecting).
 */
export function handleAddFeaturedTransaction(
  state: BudgetState,
  payload: Omit<FeaturedTransaction, 'id' | 'date'>
): BudgetState {
  const newFeatured: FeaturedTransaction = {
    ...payload,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
  };

  return {
    ...state,
    featuredTransactions: [newFeatured, ...state.featuredTransactions],
    history: appendHistory(
      state.history,
      `Added featured transaction: ${newFeatured.description || 'Untitled'}`
    ),
  };
}

/**
 * Handles deleting a featured transaction.
 */
export function handleDeleteFeaturedTransaction(
  state: BudgetState,
  id: string
): BudgetState {
  const toDelete = state.featuredTransactions.find((ft) => ft.id === id);
  if (!toDelete) return state;

  return {
    ...state,
    featuredTransactions: state.featuredTransactions.filter((ft) => ft.id !== id),
    history: appendHistory(
      state.history,
      `Removed featured transaction: ${toDelete.description}`
    ),
  };
}
