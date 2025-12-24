import {
  handleAddTransaction,
  handleUpdateTransaction,
  handleDeleteTransaction,
  handleAddFeaturedTransaction,
  handleDeleteFeaturedTransaction,
} from '../transaction-actions';
import type { BudgetState, Transaction, FeaturedTransaction } from '@/lib/types';

describe('Transaction Actions', () => {
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
      ],
      transactions: [],
      featuredTransactions: [],
      transactionTemplates: [],
      history: [],
      currentMonth: '2025-12',
    };
  });

  describe('handleAddTransaction', () => {
    it('should add withdraw transaction and update money source', () => {
      const payload = {
        description: 'Groceries',
        amount: 200,
        category: 'Food',
        date: '2025-12-15',
        moneySourceId: 'source-1',
        type: 'withdraw' as const,
        affectBalance: true,
      };

      const result = handleAddTransaction(initialState, payload);

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0]).toMatchObject({
        description: 'Groceries',
        amount: 200,
        category: 'Food',
        type: 'withdraw',
      });
      
      const updatedSource = result.moneySources[0];
      expect(updatedSource.balance).toBe(3800); // 4000 - 200
      expect(updatedSource.budget).toBe(4800); // 5000 - 200 (budget affected)
      expect(updatedSource.spent).toBe(1000); // 4800 - 3800
      expect(result.history).toHaveLength(1);
    });

    it('should add income transaction and update money source', () => {
      const payload = {
        description: 'Freelance',
        amount: 500,
        category: 'Income',
        date: '2025-12-15',
        moneySourceId: 'source-1',
        type: 'income' as const,
        affectBalance: true,
      };

      const result = handleAddTransaction(initialState, payload);

      const updatedSource = result.moneySources[0];
      expect(updatedSource.balance).toBe(4500); // 4000 + 500
      expect(updatedSource.budget).toBe(5500); // 5000 + 500
      expect(updatedSource.spent).toBe(1000); // 5500 - 4500
    });

    it('should add transaction without affecting balance', () => {
      const payload = {
        description: 'Note only',
        amount: 100,
        category: 'Misc',
        date: '2025-12-15',
        moneySourceId: 'source-1',
        type: 'withdraw' as const,
        affectBalance: false,
      };

      const result = handleAddTransaction(initialState, payload);

      const updatedSource = result.moneySources[0];
      expect(updatedSource.balance).toBe(4000); // unchanged
      expect(updatedSource.budget).toBe(4900); // 5000 - 100 (budget still affected)
      expect(updatedSource.spent).toBe(900); // 4900 - 4000
    });

    it('should generate unique transaction ID', () => {
      const payload = {
        description: 'Test',
        amount: 50,
        category: 'Test',
        date: '2025-12-15',
        moneySourceId: 'source-1',
        type: 'withdraw' as const,
        affectBalance: true,
      };

      const result1 = handleAddTransaction(initialState, payload);
      const result2 = handleAddTransaction(result1, payload);

      expect(result2.transactions).toHaveLength(2);
      expect(result2.transactions[0].id).not.toBe(result2.transactions[1].id);
    });
  });

  describe('handleUpdateTransaction', () => {
    it('should update transaction details', () => {
      // First add a transaction
      const addPayload = {
        description: 'Original',
        amount: 100,
        category: 'Food',
        date: '2025-12-15',
        moneySourceId: 'source-1',
        type: 'withdraw' as const,
        affectBalance: true,
      };
      const stateWithTransaction = handleAddTransaction(initialState, addPayload);
      const transactionId = stateWithTransaction.transactions[0].id;

      // Update it
      const updatedTransaction: Transaction = {
        id: transactionId,
        description: 'Updated',
        amount: 150,
        category: 'Entertainment',
        date: '2025-12-16',
        moneySourceId: 'source-1',
        type: 'withdraw',
      };

      const result = handleUpdateTransaction(stateWithTransaction, updatedTransaction);

      expect(result.transactions[0]).toEqual(updatedTransaction);
      expect(result.history).toHaveLength(2); // One from add, one from update
      expect(result.history[1].description).toContain('Updated transaction: Updated');
    });
  });

  describe('handleDeleteTransaction', () => {
    it('should delete withdraw transaction and reverse balance changes', () => {
      const addPayload = {
        description: 'Groceries',
        amount: 200,
        category: 'Food',
        date: '2025-12-15',
        moneySourceId: 'source-1',
        type: 'withdraw' as const,
        affectBalance: true,
      };
      const stateWithTransaction = handleAddTransaction(initialState, addPayload);
      const transaction = stateWithTransaction.transactions[0];

      const result = handleDeleteTransaction(stateWithTransaction, transaction);

      expect(result.transactions).toHaveLength(0);
      expect(result.moneySources[0].balance).toBe(4000); // Restored
      expect(result.moneySources[0].budget).toBe(5000); // Restored
      expect(result.moneySources[0].spent).toBe(1000); // Restored
      expect(result.history[1].description).toContain('Deleted transaction: Groceries');
    });

    it('should delete income transaction and reverse balance changes', () => {
      const addPayload = {
        description: 'Freelance',
        amount: 500,
        category: 'Income',
        date: '2025-12-15',
        moneySourceId: 'source-1',
        type: 'income' as const,
        affectBalance: true,
      };
      const stateWithTransaction = handleAddTransaction(initialState, addPayload);
      const transaction = stateWithTransaction.transactions[0];

      const result = handleDeleteTransaction(stateWithTransaction, transaction);

      expect(result.moneySources[0].balance).toBe(4000); // Restored
      expect(result.moneySources[0].budget).toBe(5000); // Restored
    });
  });

  describe('handleAddFeaturedTransaction', () => {
    it('should add featured transaction with generated id and date', () => {
      const payload = {
        description: 'Featured Item',
        category: 'Important',
        amount: 1000,
      };

      const result = handleAddFeaturedTransaction(initialState, payload);

      expect(result.featuredTransactions).toHaveLength(1);
      expect(result.featuredTransactions[0]).toMatchObject({
        description: 'Featured Item',
        category: 'Important',
        amount: 1000,
      });
      expect(result.featuredTransactions[0].id).toBeTruthy();
      expect(result.featuredTransactions[0].date).toBeTruthy();
      expect(result.history).toHaveLength(1);
    });
  });

  describe('handleDeleteFeaturedTransaction', () => {
    it('should delete featured transaction by id', () => {
      const addPayload = {
        description: 'Featured Item',
        category: 'Important',
        amount: 1000,
      };
      const stateWithFeatured = handleAddFeaturedTransaction(initialState, addPayload);
      const featuredId = stateWithFeatured.featuredTransactions[0].id;

      const result = handleDeleteFeaturedTransaction(stateWithFeatured, featuredId);

      expect(result.featuredTransactions).toHaveLength(0);
      expect(result.history[1].description).toContain('Removed featured transaction');
    });

    it('should return unchanged state if featured transaction not found', () => {
      const result = handleDeleteFeaturedTransaction(initialState, 'non-existent');

      expect(result).toBe(initialState);
    });
  });
});
