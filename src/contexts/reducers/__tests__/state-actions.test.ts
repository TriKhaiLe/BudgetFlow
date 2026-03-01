import {
  initialBudgetState,
  handleSetCurrentMonth,
  handleStartNewMonth,
  handleUpdateMonthDescription,
  handleImportData,
  migrateState,
} from '../state-actions';
import type { BudgetState } from '@/lib/types';
import { startOfMonth } from 'date-fns';

describe('State Actions', () => {
  let initialState: BudgetState;

  beforeEach(() => {
    initialState = {
      moneySources: [
        {
          id: 'source-1',
          name: 'Salary',
          budget: 5000,
          spent: 1000,
          balance: 4000,
        },
        {
          id: 'source-2',
          name: 'Savings',
          budget: 2000,
          spent: 500,
          balance: 1500,
        },
      ],
      templates: [],
      history: [],
      budgetLog: [],
      budgetLogBalanceLocks: {},
      currentMonth: '2025-12-01T00:00:00.000Z',
      monthDescription: 'December budget',
    };
  });

  describe('initialBudgetState', () => {
    it('should have correct initial structure', () => {
      expect(initialBudgetState.moneySources).toEqual([]);
      expect(initialBudgetState.templates).toEqual([]);
      expect(initialBudgetState.history).toEqual([]);
      expect(initialBudgetState.budgetLog).toEqual([]);
      expect(initialBudgetState.budgetLogBalanceLocks).toEqual({});
      expect(initialBudgetState.monthDescription).toBe('');
      expect(initialBudgetState.currentMonth).toBeTruthy();
    });
  });

  describe('handleSetCurrentMonth', () => {
    it('should update current month and add history', () => {
      const newDate = new Date('2026-01-01');
      const result = handleSetCurrentMonth(initialState, newDate);

      expect(result.currentMonth).toBe(newDate.toISOString());
      expect(result.history).toHaveLength(1);
      expect(result.history[0].description).toContain('Changed budget month');
      expect(result.history[0].description).toContain('January 2026');
    });

    it('should preserve other state properties', () => {
      const newDate = new Date('2026-01-01');
      const result = handleSetCurrentMonth(initialState, newDate);

      expect(result.moneySources).toEqual(initialState.moneySources);
      expect(result.templates).toEqual(initialState.templates);
    });
  });

  describe('handleUpdateMonthDescription', () => {
    it('should update month description', () => {
      const newDescription = 'Holiday season budget';
      const result = handleUpdateMonthDescription(initialState, newDescription);

      expect(result.monthDescription).toBe(newDescription);
    });

    it('should clear month description when empty', () => {
      const result = handleUpdateMonthDescription(initialState, '');

      expect(result.monthDescription).toBe('');
    });

    it('should preserve other state properties', () => {
      const result = handleUpdateMonthDescription(initialState, 'New description');

      expect(result.moneySources).toEqual(initialState.moneySources);
      expect(result.currentMonth).toEqual(initialState.currentMonth);
    });
  });

  describe('handleStartNewMonth', () => {
    it('should move to next month and use balances as budgets', () => {
      const result = handleStartNewMonth(initialState);

      // Check month advanced
      const currentDate = new Date(initialState.currentMonth);
      const expectedNextMonth = new Date(currentDate);
      expectedNextMonth.setMonth(expectedNextMonth.getMonth() + 1);
      const expectedMonthStart = startOfMonth(expectedNextMonth).toISOString();
      
      expect(result.currentMonth).toBe(expectedMonthStart);
    });

    it('should reset balances using previous balances as budgets', () => {
      const result = handleStartNewMonth(initialState);

      expect(result.moneySources[0].budget).toBe(4000); // Previous balance
      expect(result.moneySources[0].spent).toBe(0);
      expect(result.moneySources[1].budget).toBe(1500); // Previous balance
      expect(result.moneySources[1].spent).toBe(0);
    });

    it('should create initial budget log entry from previous balances', () => {
      const result = handleStartNewMonth(initialState);

      expect(result.budgetLog).toHaveLength(1);
      expect(result.budgetLog[0].isInitial).toBe(true);
      expect(result.budgetLog[0].description).toBe('Last month balance');
      expect(result.budgetLog[0].changes['source-1']).toBe(4000); // Previous balance
      expect(result.budgetLog[0].changes['source-2']).toBe(1500); // Previous balance
    });

    it('should clear month description', () => {
      const result = handleStartNewMonth(initialState);

      expect(result.monthDescription).toBe('');
    });

    it('should log previous balances to history', () => {
      const result = handleStartNewMonth(initialState);

      expect(result.history).toHaveLength(1);
      expect(result.history[0].description).toContain('Started new month');
      expect(result.history[0].description).toContain('Previous balances');
      expect(result.history[0].description).toContain('Salary');
      expect(result.history[0].description).toContain('Savings');
    });

    it('should preserve money source names and IDs', () => {
      const result = handleStartNewMonth(initialState);

      expect(result.moneySources[0].id).toBe('source-1');
      expect(result.moneySources[0].name).toBe('Salary');
      expect(result.moneySources[1].id).toBe('source-2');
      expect(result.moneySources[1].name).toBe('Savings');
    });

    it('should clear lastBalanceUpdate for new month', () => {
      const stateWithTimestamp: BudgetState = {
        ...initialState,
        moneySources: initialState.moneySources.map(ms => ({
          ...ms,
          lastBalanceUpdate: '2025-12-15T00:00:00.000Z',
        })),
      };

      const result = handleStartNewMonth(stateWithTimestamp);
      result.moneySources.forEach(ms => {
        expect(ms.lastBalanceUpdate).toBeUndefined();
      });
    });

    it('should handle empty money sources', () => {
      const emptyState: BudgetState = {
        ...initialState,
        moneySources: [],
      };
      const result = handleStartNewMonth(emptyState);
      expect(result.budgetLog).toEqual([]);
      expect(result.moneySources).toEqual([]);
    });
  });

  describe('handleImportData', () => {
    const importedState: BudgetState = {
      moneySources: [
        {
          id: 'imported-1',
          name: 'Imported Source',
          budget: 3000,
          spent: 500,
          balance: 2500,
        },
      ],
      templates: [],
      history: [],
      budgetLog: [],
      budgetLogBalanceLocks: {},
      currentMonth: '2025-11-01T00:00:00.000Z',
    };

    describe('REPLACE strategy', () => {
      it('should replace entire state with imported data', () => {
        const result = handleImportData(initialState, {
          state: importedState,
          strategy: 'REPLACE',
        });

        expect(result.moneySources).toEqual(importedState.moneySources);
        expect(result.currentMonth).toBe(importedState.currentMonth);
        expect(result.history.length).toBeGreaterThan(0);
        expect(result.history[result.history.length - 1].description).toContain('Data imported and replaced');
      });
    });

    describe('NEXT_MONTH strategy', () => {
      it('should use imported balances as budgets for next month', () => {
        const result = handleImportData(initialState, {
          state: importedState,
          strategy: 'NEXT_MONTH',
        });

        expect(result.moneySources[0].budget).toBe(2500); // Imported balance
        expect(result.moneySources[0].spent).toBe(0);
      });

      it('should set month to next month', () => {
        const result = handleImportData(initialState, {
          state: importedState,
          strategy: 'NEXT_MONTH',
        });

        const currentDate = new Date();
        const nextMonth = new Date(currentDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const expectedMonth = startOfMonth(nextMonth).toISOString();

        expect(result.currentMonth).toBe(expectedMonth);
      });

      it('should add appropriate history entry', () => {
        const result = handleImportData(initialState, {
          state: importedState,
          strategy: 'NEXT_MONTH',
        });

        expect(result.history).toHaveLength(1);
        expect(result.history[0].description).toContain('Data imported for next month');
      });

      it('should preserve templates from import', () => {
        const stateWithTemplates: BudgetState = {
          ...importedState,
          templates: [{ id: 'tpl-1', name: 'Test', description: '', changes: { 'imported-1': -100 } }],
        };
        const result = handleImportData(initialState, {
          state: stateWithTemplates,
          strategy: 'NEXT_MONTH',
        });
        expect(result.templates).toHaveLength(1);
        expect(result.templates[0].name).toBe('Test');
      });
    });
  });

  describe('migrateState', () => {
    it('should add missing currentMonth', () => {
      const legacyState = {
        ...initialState,
        currentMonth: undefined as any,
      };

      const result = migrateState(legacyState);

      expect(result.currentMonth).toBeTruthy();
    });

    it('should migrate legacy transactionTemplates to templates', () => {
      const legacyState = {
        ...initialState,
        templates: undefined as any,
        transactionTemplates: [
          {
            id: 'tpl-1',
            name: 'Groceries',
            description: 'Weekly groceries',
            amount: 200,
            moneySourceId: 'source-1',
            type: 'withdraw',
            category: 'Food',
            affectBalance: true,
          },
        ],
      } as any;

      const result = migrateState(legacyState);

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].id).toBe('tpl-1');
      expect(result.templates[0].name).toBe('Groceries');
      expect(result.templates[0].description).toBe('Weekly groceries');
      expect(result.templates[0].changes['source-1']).toBe(-200); // withdraw → negative
    });

    it('should migrate income transactionTemplate as positive amount', () => {
      const legacyState = {
        ...initialState,
        templates: undefined as any,
        transactionTemplates: [
          {
            id: 'tpl-2',
            name: 'Salary',
            amount: 5000,
            moneySourceId: 'source-1',
            type: 'income',
          },
        ],
      } as any;

      const result = migrateState(legacyState);

      expect(result.templates[0].changes['source-1']).toBe(5000); // income → positive
    });

    it('should clean up legacy fields', () => {
      const legacyState = {
        ...initialState,
        transactions: [{ id: 'old-trans' }],
        featuredTransactions: [{ id: 'old-feat' }],
        transactionTemplates: [],
      } as any;

      const result = migrateState(legacyState) as any;

      expect(result.transactions).toBeUndefined();
      expect(result.featuredTransactions).toBeUndefined();
      expect(result.transactionTemplates).toBeUndefined();
    });

    it('should add missing arrays and defaults', () => {
      const legacyState = {
        ...initialState,
        history: undefined as any,
        budgetLog: undefined as any,
        budgetLogBalanceLocks: undefined as any,
        monthDescription: undefined as any,
      };

      const result = migrateState(legacyState);

      expect(result.history).toEqual([]);
      expect(result.budgetLog).toEqual([]);
      expect(result.budgetLogBalanceLocks).toEqual({});
      expect(result.monthDescription).toBe('');
    });

    it('should add missing monthDescription', () => {
      const legacyState = {
        ...initialState,
        monthDescription: undefined as any,
      };

      const result = migrateState(legacyState);

      expect(result.monthDescription).toBe('');
    });

    it('should add missing budgetLog', () => {
      const legacyState = {
        ...initialState,
        budgetLog: undefined as any,
      };

      const result = migrateState(legacyState);

      expect(result.budgetLog).toEqual([]);
    });

    it('should remove metadata', () => {
      const stateWithMetadata = {
        ...initialState,
        metadata: {
          exportDate: '2025-12-01',
          month: 12,
          year: 2025,
          monthLabel: 'December 2025',
          version: '1.0',
        },
      };

      const result = migrateState(stateWithMetadata);

      expect(result.metadata).toBeUndefined();
    });

    it('should recompute spent for money sources', () => {
      const stateWithBadSpent = {
        ...initialState,
        moneySources: [
          { id: 'ms-1', name: 'Test', budget: 1000, balance: 800, spent: 999 }, // wrong spent
        ],
      };

      const result = migrateState(stateWithBadSpent);

      expect(result.moneySources[0].spent).toBe(200); // budget - balance
    });

    it('should handle fully valid state', () => {
      const result = migrateState(initialState);

      expect(result.currentMonth).toBe(initialState.currentMonth);
      expect(result.moneySources).toHaveLength(initialState.moneySources.length);
    });
  });
});
