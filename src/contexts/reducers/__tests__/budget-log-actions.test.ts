import {
  handleInitializeBudgetLog,
  handleAddBudgetLogEntry,
  handleDeleteBudgetLogEntry,
  handleUpdateBudgetLogEntry,
  handleToggleBudgetLogBalanceLock,
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
      templates: [],
      history: [],
      budgetLog: [],
      budgetLogBalanceLocks: {},
      currentMonth: '2026-02',
    };
  });

  // ─── handleToggleBudgetLogBalanceLock ───────────────────────────

  describe('handleToggleBudgetLogBalanceLock', () => {
    it('should lock a money source when unlocked', () => {
      const result = handleToggleBudgetLogBalanceLock(initialState, 'source-1');
      expect(result.budgetLogBalanceLocks!['source-1']).toBe(true);
    });

    it('should unlock a money source when locked', () => {
      const locked: BudgetState = {
        ...initialState,
        budgetLogBalanceLocks: { 'source-1': true },
      };
      const result = handleToggleBudgetLogBalanceLock(locked, 'source-1');
      expect(result.budgetLogBalanceLocks!['source-1']).toBe(false);
    });

    it('should not affect other money source locks', () => {
      const locked: BudgetState = {
        ...initialState,
        budgetLogBalanceLocks: { 'source-2': true },
      };
      const result = handleToggleBudgetLogBalanceLock(locked, 'source-1');
      expect(result.budgetLogBalanceLocks!['source-1']).toBe(true);
      expect(result.budgetLogBalanceLocks!['source-2']).toBe(true);
    });

    it('should handle missing budgetLogBalanceLocks gracefully', () => {
      const noLocks: BudgetState = {
        ...initialState,
        budgetLogBalanceLocks: undefined as any,
      };
      const result = handleToggleBudgetLogBalanceLock(noLocks, 'source-1');
      expect(result.budgetLogBalanceLocks!['source-1']).toBe(true);
    });
  });

  // ─── handleInitializeBudgetLog ──────────────────────────────────

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

    it('should reset balances to match budgets', () => {
      const state: BudgetState = {
        ...initialState,
        moneySources: [
          { id: 'ms-1', name: 'Test', budget: 5000, spent: 2000, balance: 3000 },
        ],
      };
      const result = handleInitializeBudgetLog(state, 'Init');
      expect(result.moneySources[0].balance).toBe(5000);
      expect(result.moneySources[0].spent).toBe(0);
    });

    it('should clear balance locks on initialization', () => {
      const state: BudgetState = {
        ...initialState,
        budgetLogBalanceLocks: { 'source-1': true },
      };
      const result = handleInitializeBudgetLog(state, 'Init');
      expect(result.budgetLogBalanceLocks).toEqual({});
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

  // ─── handleAddBudgetLogEntry ────────────────────────────────────

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

    it('should update balance when NOT locked', () => {
      const payload = {
        description: 'Withdraw',
        changes: { 'source-1': -200000 },
      };

      const result = handleAddBudgetLogEntry(stateWithLog, payload);

      expect(result.moneySources[0].balance).toBe(800000); // balance also decreased
      expect(result.moneySources[0].spent).toBe(0); // budget - balance = 800000 - 800000
    });

    it('should NOT update balance when locked', () => {
      const lockedState: BudgetState = {
        ...stateWithLog,
        budgetLogBalanceLocks: { 'source-1': true },
      };

      const payload = {
        description: 'Withdraw',
        changes: { 'source-1': -200000 },
      };

      const result = handleAddBudgetLogEntry(lockedState, payload);

      expect(result.moneySources[0].budget).toBe(800000); // budget changed
      expect(result.moneySources[0].balance).toBe(1000000); // balance NOT changed
      expect(result.moneySources[0].spent).toBe(-200000); // budget - balance = 800000 - 1000000
    });

    it('should recalculate spent after budget change', () => {
      const payload = {
        description: 'Withdraw from BIDV',
        changes: { 'source-2': 400000 },
      };

      const result = handleAddBudgetLogEntry(stateWithLog, payload);

      const ttt = result.moneySources.find(ms => ms.id === 'source-2')!;
      expect(ttt.budget).toBe(2400000);
      expect(ttt.balance).toBe(2400000); // unlocked → balance also changed
      expect(ttt.spent).toBe(0); // budget - balance = 0
    });

    it('should add entry affecting single money source', () => {
      const result = handleAddBudgetLogEntry(stateWithLog, {
        description: 'Salary',
        changes: { 'source-1': 500000 },
      });

      expect(result.moneySources[0].budget).toBe(1500000);
      expect(result.moneySources[1].budget).toBe(2000000); // unchanged
      expect(result.moneySources[2].budget).toBe(4000000); // unchanged
    });

    it('should add entry affecting all money sources', () => {
      const result = handleAddBudgetLogEntry(stateWithLog, {
        description: 'Distribute salary',
        changes: { 'source-1': 100000, 'source-2': 200000, 'source-3': 300000 },
      });

      expect(result.moneySources[0].budget).toBe(1100000);
      expect(result.moneySources[1].budget).toBe(2200000);
      expect(result.moneySources[2].budget).toBe(4300000);
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

    it('should handle entry with zero change values', () => {
      const result = handleAddBudgetLogEntry(stateWithLog, {
        description: 'Empty entry',
        changes: { 'source-1': 0 },
      });

      expect(result.budgetLog).toHaveLength(2);
      expect(result.moneySources[0].budget).toBe(1000000); // unchanged
    });

    it('should handle entry with no matching money sources', () => {
      const result = handleAddBudgetLogEntry(stateWithLog, {
        description: 'Orphan entry',
        changes: { 'non-existent': 100000 },
      });

      expect(result.budgetLog).toHaveLength(2);
      // All budgets unchanged
      expect(result.moneySources[0].budget).toBe(1000000);
      expect(result.moneySources[1].budget).toBe(2000000);
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

    it('should handle negative budget results', () => {
      const result = handleAddBudgetLogEntry(stateWithLog, {
        description: 'Big withdraw',
        changes: { 'source-1': -2000000 }, // more than budget
      });

      expect(result.moneySources[0].budget).toBe(-1000000);
      expect(result.moneySources[0].balance).toBe(-1000000);
    });

    it('should generate createdAt timestamp', () => {
      const result = handleAddBudgetLogEntry(stateWithLog, {
        description: 'Test',
        changes: { 'source-1': 100 },
      });

      expect(result.budgetLog[1].createdAt).toBeTruthy();
      expect(new Date(result.budgetLog[1].createdAt).getTime()).not.toBeNaN();
    });
  });

  // ─── handleDeleteBudgetLogEntry ─────────────────────────────────

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

    it('should reverse balance changes when unlocked', () => {
      const entryId = stateWithEntries.budgetLog[1].id;
      const result = handleDeleteBudgetLogEntry(stateWithEntries, entryId);

      expect(result.moneySources[0].balance).toBe(1000000); // reversed
      expect(result.moneySources[1].balance).toBe(2000000); // reversed
    });

    it('should NOT reverse balance changes when locked', () => {
      const lockedState: BudgetState = {
        ...stateWithEntries,
        budgetLogBalanceLocks: { 'source-1': true },
      };
      const entryId = lockedState.budgetLog[1].id;
      const result = handleDeleteBudgetLogEntry(lockedState, entryId);

      expect(result.moneySources[0].budget).toBe(1000000); // reversed
      expect(result.moneySources[0].balance).toBe(800000); // NOT reversed (was 800000 after entry)
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

    it('should correctly reverse multi-source entry', () => {
      // Add entry affecting all 3 sources
      const stateWith3 = handleAddBudgetLogEntry(stateWithEntries, {
        description: '3-way',
        changes: { 'source-1': 100000, 'source-2': -50000, 'source-3': -300000 },
      });

      const entryId = stateWith3.budgetLog[2].id; // the 3-way entry
      const result = handleDeleteBudgetLogEntry(stateWith3, entryId);

      // Should revert to state before the 3-way entry
      expect(result.moneySources[0].budget).toBe(800000); // still has transfer entry
      expect(result.moneySources[1].budget).toBe(2200000);
      expect(result.moneySources[2].budget).toBe(4000000);
    });
  });

  // ─── handleUpdateBudgetLogEntry ─────────────────────────────────

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

    it('should update balance when NOT locked', () => {
      const entryId = stateWithEntries.budgetLog[1].id;
      const result = handleUpdateBudgetLogEntry(stateWithEntries, {
        id: entryId,
        description: 'Updated',
        changes: { 'source-1': -300000, 'source-2': 300000 },
      });

      // balance follows budget when unlocked
      expect(result.moneySources[0].balance).toBe(700000);
      expect(result.moneySources[1].balance).toBe(2300000);
    });

    it('should NOT update balance when locked', () => {
      const lockedState: BudgetState = {
        ...stateWithEntries,
        budgetLogBalanceLocks: { 'source-1': true },
      };
      const entryId = lockedState.budgetLog[1].id;
      const result = handleUpdateBudgetLogEntry(lockedState, {
        id: entryId,
        description: 'Updated',
        changes: { 'source-1': -300000 },
      });

      expect(result.moneySources[0].budget).toBe(700000); // budget changed
      expect(result.moneySources[0].balance).toBe(800000); // balance NOT changed (still from original add)
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

    it('should preserve createdAt when not provided', () => {
      const entryId = stateWithEntries.budgetLog[1].id;
      const originalCreatedAt = stateWithEntries.budgetLog[1].createdAt;

      const result = handleUpdateBudgetLogEntry(stateWithEntries, {
        id: entryId,
        description: 'Updated',
        changes: { 'source-1': -100000 },
      });

      expect(result.budgetLog[1].createdAt).toBe(originalCreatedAt);
    });

    it('should update createdAt when provided', () => {
      const entryId = stateWithEntries.budgetLog[1].id;
      const newCreatedAt = '2025-06-15T10:00:00.000Z';

      const result = handleUpdateBudgetLogEntry(stateWithEntries, {
        id: entryId,
        description: 'Updated',
        changes: { 'source-1': -100000 },
        createdAt: newCreatedAt,
      });

      expect(result.budgetLog[1].createdAt).toBe(newCreatedAt);
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

    it('should handle updating to empty changes', () => {
      const entryId = stateWithEntries.budgetLog[1].id;
      const result = handleUpdateBudgetLogEntry(stateWithEntries, {
        id: entryId,
        description: 'Cleared',
        changes: {},
      });

      // Should reverse old changes, net effect = reversal
      expect(result.moneySources[0].budget).toBe(1000000); // reversed -200000
      expect(result.moneySources[1].budget).toBe(2000000); // reversed +200000
    });

    it('should handle updating entry to affect different money sources', () => {
      const entryId = stateWithEntries.budgetLog[1].id;
      // Original: source-1: -200000, source-2: +200000
      // New: source-3: -500000
      const result = handleUpdateBudgetLogEntry(stateWithEntries, {
        id: entryId,
        description: 'Changed sources',
        changes: { 'source-3': -500000 },
      });

      // source-1: reversed -200000 → back to 1000000
      expect(result.moneySources[0].budget).toBe(1000000);
      // source-2: reversed +200000 → back to 2000000
      expect(result.moneySources[1].budget).toBe(2000000);
      // source-3: new -500000 → 3500000
      expect(result.moneySources[2].budget).toBe(3500000);
    });
  });

  // ─── Integration / Edge Cases ───────────────────────────────────

  describe('Integration scenarios', () => {
    it('should handle full workflow: init → add → update → delete', () => {
      // Init
      let state = handleInitializeBudgetLog(initialState, 'Start');
      expect(state.budgetLog).toHaveLength(1);

      // Add
      state = handleAddBudgetLogEntry(state, {
        description: 'Salary',
        changes: { 'source-1': 500000 },
      });
      expect(state.moneySources[0].budget).toBe(1500000);

      // Update
      const entryId = state.budgetLog[1].id;
      state = handleUpdateBudgetLogEntry(state, {
        id: entryId,
        description: 'Adjusted salary',
        changes: { 'source-1': 600000 },
      });
      expect(state.moneySources[0].budget).toBe(1600000);

      // Delete
      state = handleDeleteBudgetLogEntry(state, entryId);
      expect(state.moneySources[0].budget).toBe(1000000); // back to original
      expect(state.budgetLog).toHaveLength(1); // only initial
    });

    it('should correctly track history across multiple operations', () => {
      let state = handleInitializeBudgetLog(initialState, 'Start');
      state = handleAddBudgetLogEntry(state, {
        description: 'Entry 1',
        changes: { 'source-1': 100 },
      });
      state = handleAddBudgetLogEntry(state, {
        description: 'Entry 2',
        changes: { 'source-2': 200 },
      });
      const deleteId = state.budgetLog[1].id;
      state = handleDeleteBudgetLogEntry(state, deleteId);

      // Init + Add + Add + Delete = 4 history entries
      expect(state.history).toHaveLength(4);
    });

    it('should handle add with locked then delete while unlocked', () => {
      let state = handleInitializeBudgetLog(initialState, 'Start');

      // Lock source-1 and add entry
      state = handleToggleBudgetLogBalanceLock(state, 'source-1');
      state = handleAddBudgetLogEntry(state, {
        description: 'While locked',
        changes: { 'source-1': -300000 },
      });

      // Budget changed but balance didn't
      expect(state.moneySources[0].budget).toBe(700000);
      expect(state.moneySources[0].balance).toBe(1000000);

      // Unlock and delete
      state = handleToggleBudgetLogBalanceLock(state, 'source-1');
      const entryId = state.budgetLog[1].id;
      state = handleDeleteBudgetLogEntry(state, entryId);

      // Budget reversed, balance also reversed (now unlocked)
      expect(state.moneySources[0].budget).toBe(1000000);
      expect(state.moneySources[0].balance).toBe(1300000); // 1000000 - (-300000) reversed
    });

    it('should handle state with no money sources', () => {
      const emptyState: BudgetState = {
        ...initialState,
        moneySources: [],
      };

      const result = handleInitializeBudgetLog(emptyState, 'Empty');
      expect(result.budgetLog).toHaveLength(1);
      expect(result.budgetLog[0].changes).toEqual({});

      const after = handleAddBudgetLogEntry(result, {
        description: 'No sources',
        changes: {},
      });
      expect(after.budgetLog).toHaveLength(2);
    });
  });
});
