import {
  handleAddMoneySource,
  handleUpdateMoneySource,
  handleDeleteMoneySource,
  handleAdjustBalance,
} from '../money-source-actions';
import type { BudgetState, MoneySource } from '@/lib/types';

describe('Money Source Actions', () => {
  let initialState: BudgetState;

  beforeEach(() => {
    // Reset state before each test
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
      featuredTransactions: [],
      transactionTemplates: [],
      history: [],
      budgetLog: [],
      currentMonth: '2025-12',
    };
  });

  describe('handleAddMoneySource', () => {
    it('should add a new money source with generated id and spent=0', () => {
      const payload = {
        name: 'Bonus',
        budget: 1000,
        balance: 1000,
      };

      const result = handleAddMoneySource(initialState, payload);

      expect(result.moneySources).toHaveLength(3);
      expect(result.moneySources[2]).toMatchObject({
        name: 'Bonus',
        budget: 1000,
        balance: 1000,
        spent: 0,
      });
      expect(result.moneySources[2].id).toBeTruthy();
      expect(result.history).toHaveLength(1);
      expect(result.history[0].description).toContain('Created money source: Bonus');
    });

    it('should not mutate the original state', () => {
      const payload = {
        name: 'Bonus',
        budget: 1000,
        balance: 1000,
      };

      handleAddMoneySource(initialState, payload);

      expect(initialState.moneySources).toHaveLength(2);
    });
  });

  describe('handleUpdateMoneySource', () => {
    it('should update an existing money source', () => {
      const updatedSource: MoneySource = {
        id: 'source-1',
        name: 'Salary Updated',
        budget: 6000,
        spent: 1000,
        balance: 5000,
      };

      const result = handleUpdateMoneySource(initialState, updatedSource);

      expect(result.moneySources[0]).toEqual(updatedSource);
      expect(result.moneySources[1]).toEqual(initialState.moneySources[1]);
      expect(result.history).toHaveLength(1);
      expect(result.history[0].description).toContain('Updated money source: Salary Updated');
    });

    it('should not affect other money sources', () => {
      const updatedSource: MoneySource = {
        id: 'source-1',
        name: 'Salary Updated',
        budget: 6000,
        spent: 1000,
        balance: 5000,
      };

      const result = handleUpdateMoneySource(initialState, updatedSource);

      expect(result.moneySources[1]).toEqual(initialState.moneySources[1]);
    });
  });

  describe('handleDeleteMoneySource', () => {
    it('should delete a money source and its transactions', () => {
      const result = handleDeleteMoneySource(initialState, 'source-1');

      expect(result.moneySources).toHaveLength(1);
      expect(result.moneySources[0].id).toBe('source-2');
      expect(result.transactions).toHaveLength(0); // Transaction with source-1 should be deleted
      expect(result.history).toHaveLength(1);
      expect(result.history[0].description).toContain('Deleted money source: Salary');
    });

    it('should return unchanged state if source not found', () => {
      const result = handleDeleteMoneySource(initialState, 'non-existent');

      expect(result).toBe(initialState);
    });
  });

  describe('handleAdjustBalance', () => {
    it('should adjust balance and recalculate spent', () => {
      const payload = {
        moneySourceId: 'source-1',
        newBalance: 4500,
      };

      const result = handleAdjustBalance(initialState, payload);
      const updatedSource = result.moneySources.find((ms) => ms.id === 'source-1');

      expect(updatedSource?.balance).toBe(4500);
      expect(updatedSource?.spent).toBe(500); // budget(5000) - balance(4500)
      expect(result.history).toHaveLength(1);
      expect(result.history[0].description).toContain('Adjusted balance');
      expect(result.history[0].description).toContain('Salary');
    });

    it('should handle negative balance adjustment', () => {
      const payload = {
        moneySourceId: 'source-1',
        newBalance: 3500,
      };

      const result = handleAdjustBalance(initialState, payload);
      const updatedSource = result.moneySources.find((ms) => ms.id === 'source-1');

      expect(updatedSource?.balance).toBe(3500);
      expect(updatedSource?.spent).toBe(1500);
    });

    it('should return unchanged state if source not found', () => {
      const payload = {
        moneySourceId: 'non-existent',
        newBalance: 1000,
      };

      const result = handleAdjustBalance(initialState, payload);

      expect(result).toBe(initialState);
    });
  });
});
