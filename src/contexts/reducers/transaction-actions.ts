import type { BudgetState, Transaction, FeaturedTransaction, TransactionSnapshot } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { appendHistory } from './history-helpers';

/**
 * Handles adding a new transaction to the state.
 * Updates the associated money source balance, budget, and spent amounts.
 * Stores affectBalance and before/after snapshots for tracking.
 * For transfer transactions: withdraws from source and adds to target money source.
 */
export function handleAddTransaction(
  state: BudgetState,
  payload: Omit<Transaction, 'id' | 'snapshot'> & { affectBalance: boolean }
): BudgetState {
  const { affectBalance, ...transactionPayload } = payload;
  const { amount, moneySourceId, type, targetMoneySourceId } = transactionPayload;

  // Handle transfer transactions differently
  if (type === 'transfer' && targetMoneySourceId) {
    return handleTransferTransaction(state, transactionPayload, affectBalance);
  }

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
 * Handles transfer transaction: creates TWO separate transactions.
 * 1. A withdraw transaction from the source money source
 * 2. An income transaction to the target money source
 * This way transfers are logged as normal withdraw/income transactions.
 */
function handleTransferTransaction(
  state: BudgetState,
  transactionPayload: Omit<Transaction, 'id' | 'snapshot'>,
  affectBalance: boolean
): BudgetState {
  const { amount, moneySourceId, targetMoneySourceId, description, category, date } = transactionPayload;

  // Find source and target money sources
  const sourceMs = state.moneySources.find((ms) => ms.id === moneySourceId);
  const targetMs = state.moneySources.find((ms) => ms.id === targetMoneySourceId);

  const sourceName = sourceMs?.name || 'Unknown';
  const targetName = targetMs?.name || 'Unknown';

  // Create withdraw transaction (from source)
  const withdrawSnapshot: TransactionSnapshot = {
    budgetBefore: sourceMs?.budget ?? 0,
    budgetAfter: (sourceMs?.budget ?? 0) - amount,
    balanceBefore: sourceMs?.balance ?? 0,
    balanceAfter: affectBalance ? (sourceMs?.balance ?? 0) - amount : (sourceMs?.balance ?? 0),
  };

  const withdrawTransaction: Transaction = {
    id: crypto.randomUUID(),
    description: `${description || 'Transfer'} (to ${targetName})`,
    amount,
    category: category || 'transfer',
    date,
    moneySourceId,
    type: 'withdraw',
    affectBalance,
    snapshot: withdrawSnapshot,
  };

  // Calculate intermediate state after withdraw
  const sourceBudgetAfterWithdraw = (sourceMs?.budget ?? 0) - amount;
  const sourceBalanceAfterWithdraw = affectBalance ? (sourceMs?.balance ?? 0) - amount : (sourceMs?.balance ?? 0);

  // Create income transaction (to target)
  const incomeSnapshot: TransactionSnapshot = {
    budgetBefore: targetMs?.budget ?? 0,
    budgetAfter: (targetMs?.budget ?? 0) + amount,
    balanceBefore: targetMs?.balance ?? 0,
    balanceAfter: affectBalance ? (targetMs?.balance ?? 0) + amount : (targetMs?.balance ?? 0),
  };

  const incomeTransaction: Transaction = {
    id: crypto.randomUUID(),
    description: `${description || 'Transfer'} (from ${sourceName})`,
    amount,
    category: category || 'transfer',
    date,
    moneySourceId: targetMoneySourceId!,
    type: 'income',
    affectBalance,
    snapshot: incomeSnapshot,
  };

  return {
    ...state,
    // Add both transactions (income first so withdraw appears on top in the list)
    transactions: [withdrawTransaction, incomeTransaction, ...state.transactions],
    moneySources: state.moneySources.map((ms) => {
      if (ms.id === moneySourceId) {
        // Withdraw from source
        const newBudget = ms.budget - amount;
        const newBalance = affectBalance ? ms.balance - amount : ms.balance;
        return { ...ms, budget: newBudget, balance: newBalance, spent: newBudget - newBalance };
      }
      if (ms.id === targetMoneySourceId) {
        // Income to target
        const newBudget = ms.budget + amount;
        const newBalance = affectBalance ? ms.balance + amount : ms.balance;
        return { ...ms, budget: newBudget, balance: newBalance, spent: newBudget - newBalance };
      }
      return ms;
    }),
    history: appendHistory(
      state.history,
      `Transfer: ${description || 'Untitled'} (${formatCurrency(amount)}) from ${sourceName} to ${targetName}`
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
 * Reverses the balance and budget changes.
 * Note: Transfer transactions are stored as separate withdraw/income,
 * so they are deleted individually like normal transactions.
 */
export function handleDeleteTransaction(
  state: BudgetState,
  payload: Transaction
): BudgetState {
  const { amount, moneySourceId, type, description, affectBalance } = payload;

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
