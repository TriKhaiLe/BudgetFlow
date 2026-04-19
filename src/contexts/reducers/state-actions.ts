import type { BudgetState } from '@/lib/types';
import { startOfMonth } from 'date-fns';
import { format } from 'date-fns';
import { appendHistory, createHistoryEntry } from './history-helpers';

/**
 * Initial state for the budget context.
 */
export const initialBudgetState: BudgetState = {
  moneySources: [],
  templates: [],
  history: [],
  budgetLog: [],
  budgetLogSnapshot: null,
  budgetLogBalanceLocks: {},
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
      spent: 0, // spent = budget - balance = balance - balance = 0
      lastBalanceUpdate: undefined, // Clear timestamp for new month
    })),
    budgetLog: state.moneySources.length > 0 ? [{
      id: crypto.randomUUID(),
      description: 'Last month balance',
      changes: Object.fromEntries(state.moneySources.map(ms => [ms.id, ms.balance])),
      isInitial: true,
      createdAt: new Date().toISOString(),
    }] : [], // Auto-create initial budget log entry from previous balances
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
        lastBalanceUpdate: undefined,
      })),
      templates: migratedImportedState.templates || [],
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

  // Migrate old transactionTemplates to templates (backward compatibility)
  const legacyState = parsedState as any;
  if (!parsedState.templates) {
    if (legacyState.transactionTemplates && Array.isArray(legacyState.transactionTemplates)) {
      // Convert old TransactionTemplate to BudgetLogTemplate
      parsedState.templates = legacyState.transactionTemplates.map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description || '',
        changes: t.moneySourceId ? { [t.moneySourceId]: t.type === 'income' ? t.amount : -t.amount } : {},
      }));
      warnings.push('Migrated transactionTemplates to templates');
    } else {
      parsedState.templates = [];
      warnings.push('Missing templates');
    }
  }

  // Clean up legacy fields
  delete legacyState.transactions;
  delete legacyState.featuredTransactions;
  delete legacyState.transactionTemplates;

  // Ensure arrays exist
  if (!parsedState.history) {
    parsedState.history = [];
    warnings.push('Missing history');
  }

  // Ensure monthDescription exists
  if (parsedState.monthDescription === undefined) {
    parsedState.monthDescription = '';
  }

  // Ensure budgetLog exists
  if (!parsedState.budgetLog) {
    (parsedState as any).budgetLog = [];
    warnings.push('Missing budgetLog');
  }

  // Ensure budgetLogSnapshot exists and has compatible shape
  if (parsedState.budgetLogSnapshot === undefined) {
    parsedState.budgetLogSnapshot = null;
  } else if (parsedState.budgetLogSnapshot) {
    const snapshot = parsedState.budgetLogSnapshot as any;
    const hasValidEntries = Array.isArray(snapshot.entries);
    if (!hasValidEntries) {
      parsedState.budgetLogSnapshot = null;
      warnings.push('Invalid budgetLogSnapshot reset');
    } else {
      parsedState.budgetLogSnapshot = {
        id: typeof snapshot.id === 'string' ? snapshot.id : crypto.randomUUID(),
        createdAt:
          typeof snapshot.createdAt === 'string'
            ? snapshot.createdAt
            : new Date().toISOString(),
        entryCount:
          typeof snapshot.entryCount === 'number'
            ? snapshot.entryCount
            : snapshot.entries.length,
        entries: snapshot.entries,
      };
    }
  }

  // Ensure budgetLogBalanceLocks exists
  if (!parsedState.budgetLogBalanceLocks) {
    parsedState.budgetLogBalanceLocks = {};
  }

  // Ensure spent is computed correctly for all money sources
  if (parsedState.moneySources) {
    parsedState.moneySources = parsedState.moneySources.map((ms: any) => ({
      ...ms,
      spent: ms.budget - ms.balance,
    }));
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
