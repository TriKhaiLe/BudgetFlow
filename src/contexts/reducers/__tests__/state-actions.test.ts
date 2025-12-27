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
      transactions: [
        {
          id: 'trans-1',
          description: 'Groceries',
          amount: 100,
          category: 'Food',
          date: '2025-12-01',
          moneySourceId: 'source-1',
          type: 'withdraw',
        },
      ],
      featuredTransactions: [
        {
          id: 'featured-1',
          description: 'Important',
          category: 'Savings',
          amount: 1000,
          date: '2025-12-01',
        },
      ],
      transactionTemplates: [],
      history: [],
      currentMonth: '2025-12-01T00:00:00.000Z',
      monthDescription: 'December budget',
    };
  });

  describe('initialBudgetState', () => {
    it('should have correct initial structure', () => {
      expect(initialBudgetState.moneySources).toEqual([]);
      expect(initialBudgetState.transactions).toEqual([]);
      expect(initialBudgetState.featuredTransactions).toEqual([]);
      expect(initialBudgetState.transactionTemplates).toEqual([]);
      expect(initialBudgetState.history).toEqual([]);
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
      expect(result.transactions).toEqual(initialState.transactions);
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

    it('should clear transactions and featured transactions', () => {
      const result = handleStartNewMonth(initialState);

      expect(result.transactions).toEqual([]);
      expect(result.featuredTransactions).toEqual([]);
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
      transactions: [
        {
          id: 'imported-trans-1',
          description: 'Imported Transaction',
          amount: 200,
          category: 'Shopping',
          date: '2025-11-15',
          moneySourceId: 'imported-1',
          type: 'withdraw',
        },
      ],
      featuredTransactions: [],
      transactionTemplates: [],
      history: [],
      currentMonth: '2025-11-01T00:00:00.000Z',
    };

    describe('REPLACE strategy', () => {
      it('should replace entire state with imported data', () => {
        const result = handleImportData(initialState, {
          state: importedState,
          strategy: 'REPLACE',
        });

        expect(result.moneySources).toEqual(importedState.moneySources);
        expect(result.transactions).toEqual(importedState.transactions);
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

      it('should clear transactions for new month', () => {
        const result = handleImportData(initialState, {
          state: importedState,
          strategy: 'NEXT_MONTH',
        });

        expect(result.transactions).toEqual([]);
        expect(result.featuredTransactions).toEqual([]);
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

    it('should migrate transaction types', () => {
      const legacyState = {
        ...initialState,
        transactions: [
          {
            id: 'trans-1',
            description: 'Old transaction',
            amount: -100, // Negative amount
            category: 'Food',
            date: '2025-12-01',
            moneySourceId: 'source-1',
            type: undefined as any, // Missing type
          },
        ],
      };

      const result = migrateState(legacyState);

      expect(result.transactions[0].type).toBe('withdraw');
      expect(result.transactions[0].amount).toBe(100); // Converted to positive
    });

    it('should add missing arrays', () => {
      const legacyState = {
        ...initialState,
        featuredTransactions: undefined as any,
        transactionTemplates: undefined as any,
        history: undefined as any,
      };

      const result = migrateState(legacyState);

      expect(result.featuredTransactions).toEqual([]);
      expect(result.transactionTemplates).toEqual([]);
      expect(result.history).toEqual([]);
    });

    it('should add missing monthDescription', () => {
      const legacyState = {
        ...initialState,
        monthDescription: undefined as any,
      };

      const result = migrateState(legacyState);

      expect(result.monthDescription).toBe('');
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

    it('should handle fully valid state', () => {
      const result = migrateState(initialState);

      expect(result.currentMonth).toBe(initialState.currentMonth);
      expect(result.moneySources).toEqual(initialState.moneySources);
    });
  });
});
