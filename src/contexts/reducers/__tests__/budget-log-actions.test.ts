import {
  handleInitializeBudgetLog,
  handleAddBudgetLogEntry,
  handleDeleteBudgetLogEntry,
  handleUpdateBudgetLogEntry,
} from '../budget-log-actions';
import type { BudgetState } from '@/lib/types';

describe('Budget Log Actions', () => {
  let initialState: BudgetState;

  beforeEach(() => {
    initialState = {
      moneySources: [
        {
          id: 'source-1',
          name: 'Momo',
          budget: 1000000,
          spent: 0,
          balance: 1000000,
        },
        {
          id: 'source-2',
          name: 'TTT',
          budget: 2000000,
          spent: 0,
          balance: 2000000,
        },
        {
          id: 'source-3',
          name: 'Wallet',
          budget: 4000000,
          spent: 0,
          balance: 4000000,
        },
      ],
      transactions: [],
      featuredTransactions: [],
      transactionTemplates: [],
      history: [],
      budgetLog: [],
      currentMonth: '2026-02',
    };
  });

  describe('handleInitializeBudgetLog', () => {
    it('should create an initial entry capturing current budgets', () => {
      const result = handleInitializeBudgetLog(initialState, 'Initial budget');

      expect(result.budgetLog).toHaveLength(1);
      expect(result.budgetLog[0].isInitial).toBe(true);
      expect(result.budgetLog[0].description).toBe('Initial budget');
      expect(result.budgetLog[0].changes['source-1']).toBe(1000000);
      expect(result.budgetLog[0].changes['source-2']).toBe(2000000);
      expect(result.budgetLog[0].changes['source-3']).toBe(4000000);
    });

    it('should not create duplicate initial entry', () => {
      const stateWithInitial = handleInitializeBudgetLog(initialState, 'Initial');
      const result = handleInitializeBudgetLog(stateWithInitial, 'Duplicate');

      expect(result.budgetLog).toHaveLength(1);
      expect(result.budgetLog[0].description).toBe('Initial');
    });

    it('should add history entry', () => {
      const result = handleInitializeBudgetLog(initialState, 'Initial budget');

      expect(result.history).toHaveLength(1);
      expect(result.history[0].description).toContain('Initialized budget log');
    });

    it('should use default description if empty', () => {
      const result = handleInitializeBudgetLog(initialState, '');

      expect(result.budgetLog[0].description).toBe('Initial budget');
    });
  });

  describe('handleAddBudgetLogEntry', () => {
    let stateWithLog: BudgetState;

    beforeEach(() => {
      stateWithLog = handleInitializeBudgetLog(initialState, 'Last month balance');
    });

    it('should add a new entry with budget changes', () => {
      const payload = {
        description: 'Transfer to TTT',
        changes: { 'source-1': -200000, 'source-2': 200000 },
      };

      const result = handleAddBudgetLogEntry(stateWithLog, payload);

      expect(result.budgetLog).toHaveLength(2);
      expect(result.budgetLog[1].isInitial).toBe(false);
      expect(result.budgetLog[1].description).toBe('Transfer to TTT');
      expect(result.budgetLog[1].changes['source-1']).toBe(-200000);
      expect(result.budgetLog[1].changes['source-2']).toBe(200000);
    });

    it('should update money source budgets with delta', () => {
      const payload = {
        description: 'Transfer to TTT',
        changes: { 'source-1': -200000, 'source-2': 200000 },
      };

      const result = handleAddBudgetLogEntry(stateWithLog, payload);

      expect(result.moneySources[0].budget).toBe(800000); // 1000000 - 200000
      expect(result.moneySources[1].budget).toBe(2200000); // 2000000 + 200000
      expect(result.moneySources[2].budget).toBe(4000000); // unchanged
    });

    it('should recalculate spent after budget change', () => {
      const payload = {
        description: 'Withdraw from BIDV',
        changes: { 'source-2': 400000 },
      };

      const result = handleAddBudgetLogEntry(stateWithLog, payload);

      const ttt = result.moneySources.find(ms => ms.id === 'source-2')!;
      expect(ttt.budget).toBe(2400000);
      expect(ttt.spent).toBe(ttt.budget - ttt.balance); // 2400000 - 2000000 = 400000
    });

    it('should add history entry with change summary', () => {
      const payload = {
        description: 'Transfer',
        changes: { 'source-1': -200000 },
      };

      const result = handleAddBudgetLogEntry(stateWithLog, payload);

      const lastHistory = result.history[result.history.length - 1];
      expect(lastHistory.description).toContain('Budget log: Transfer');
      expect(lastHistory.description).toContain('Momo');
    });

    it('should support multiple sequential entries', () => {
      const step1 = handleAddBudgetLogEntry(stateWithLog, {
        description: 'Transfer to TTT',
        changes: { 'source-1': -200000, 'source-2': 200000 },
      });

      const step2 = handleAddBudgetLogEntry(step1, {
        description: 'Withdraw from BIDV',
        changes: { 'source-2': 400000 },
      });

      expect(step2.budgetLog).toHaveLength(3);
      expect(step2.moneySources[0].budget).toBe(800000); // 1000000 - 200000
      expect(step2.moneySources[1].budget).toBe(2600000); // 2000000 + 200000 + 400000
      expect(step2.moneySources[2].budget).toBe(4000000); // unchanged
    });
  });

  describe('handleDeleteBudgetLogEntry', () => {
    let stateWithEntries: BudgetState;

    beforeEach(() => {
      const withLog = handleInitializeBudgetLog(initialState, 'Last month balance');
      stateWithEntries = handleAddBudgetLogEntry(withLog, {
        description: 'Transfer',
        changes: { 'source-1': -200000, 'source-2': 200000 },
      });
    });

    it('should delete a non-initial entry and reverse budget changes', () => {
      const entryId = stateWithEntries.budgetLog[1].id;
      const result = handleDeleteBudgetLogEntry(stateWithEntries, entryId);

      expect(result.budgetLog).toHaveLength(1);
      expect(result.moneySources[0].budget).toBe(1000000); // reversed
      expect(result.moneySources[1].budget).toBe(2000000); // reversed
    });

    it('should not delete initial entry if other entries exist', () => {
      const initialId = stateWithEntries.budgetLog[0].id;
      const result = handleDeleteBudgetLogEntry(stateWithEntries, initialId);

      expect(result.budgetLog).toHaveLength(2); // unchanged
    });

    it('should allow deleting initial entry if it is the only entry', () => {
      const withLog = handleInitializeBudgetLog(initialState, 'Initial');
      const initialId = withLog.budgetLog[0].id;
      const result = handleDeleteBudgetLogEntry(withLog, initialId);

      expect(result.budgetLog).toHaveLength(0);
    });

    it('should handle non-existent entry gracefully', () => {
      const result = handleDeleteBudgetLogEntry(stateWithEntries, 'non-existent-id');

      expect(result).toEqual(stateWithEntries);
    });

    it('should add history entry on deletion', () => {
      const entryId = stateWithEntries.budgetLog[1].id;
      const result = handleDeleteBudgetLogEntry(stateWithEntries, entryId);

      const lastHistory = result.history[result.history.length - 1];
      expect(lastHistory.description).toContain('Deleted budget log entry');
    });
  });

  describe('handleUpdateBudgetLogEntry', () => {
    let stateWithEntries: BudgetState;

    beforeEach(() => {
      const withLog = handleInitializeBudgetLog(initialState, 'Last month balance');
      stateWithEntries = handleAddBudgetLogEntry(withLog, {
        description: 'Transfer',
        changes: { 'source-1': -200000, 'source-2': 200000 },
      });
    });

    it('should update entry description and changes', () => {
      const entryId = stateWithEntries.budgetLog[1].id;
      const result = handleUpdateBudgetLogEntry(stateWithEntries, {
        id: entryId,
        description: 'Updated transfer',
        changes: { 'source-1': -300000, 'source-2': 300000 },
      });

      expect(result.budgetLog[1].description).toBe('Updated transfer');
      expect(result.budgetLog[1].changes['source-1']).toBe(-300000);
    });

    it('should reverse old changes and apply new ones to budgets', () => {
      const entryId = stateWithEntries.budgetLog[1].id;
      const result = handleUpdateBudgetLogEntry(stateWithEntries, {
        id: entryId,
        description: 'Updated',
        changes: { 'source-1': -300000, 'source-2': 300000 },
      });

      // Original: source-1 was 1000000, then -200000 = 800000
      // Update: reverse -200000 (back to 1000000), then apply -300000 = 700000
      expect(result.moneySources[0].budget).toBe(700000);
      expect(result.moneySources[1].budget).toBe(2300000);
    });

    it('should handle non-existent entry gracefully', () => {
      const result = handleUpdateBudgetLogEntry(stateWithEntries, {
        id: 'non-existent',
        description: 'Test',
        changes: {},
      });

      expect(result).toEqual(stateWithEntries);
    });

    it('should not modify budgets when updating initial entry', () => {
      const initialId = stateWithEntries.budgetLog[0].id;
      const result = handleUpdateBudgetLogEntry(stateWithEntries, {
        id: initialId,
        description: 'Updated initial',
        changes: { 'source-1': 9999999 },
      });

      // Budget should NOT change because it's an initial entry
      expect(result.moneySources[0].budget).toBe(800000); // still has the -200000 from entry 2
    });

    it('should add history entry on update', () => {
      const entryId = stateWithEntries.budgetLog[1].id;
      const result = handleUpdateBudgetLogEntry(stateWithEntries, {
        id: entryId,
        description: 'Updated',
        changes: { 'source-1': -100000 },
      });

      const lastHistory = result.history[result.history.length - 1];
      expect(lastHistory.description).toContain('Updated budget log entry');
    });
  });
});
