import {
  handleAddTemplate,
  handleUpdateTemplate,
  handleDeleteTemplate,
} from '../template-actions';
import type { BudgetState, TransactionTemplate } from '@/lib/types';

describe('Template Actions', () => {
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

  describe('handleAddTemplate', () => {
    it('should add a new transaction template', () => {
      const payload = {
        name: 'Monthly Rent',
        description: 'Apartment rent',
        amount: 1500,
        category: 'Housing',
        moneySourceId: 'source-1',
        type: 'withdraw' as const,
        affectBalance: true,
      };

      const result = handleAddTemplate(initialState, payload);

      expect(result.transactionTemplates).toHaveLength(1);
      expect(result.transactionTemplates[0]).toMatchObject({
        name: 'Monthly Rent',
        description: 'Apartment rent',
        amount: 1500,
        category: 'Housing',
        type: 'withdraw',
        affectBalance: true,
      });
      expect(result.transactionTemplates[0].id).toBeTruthy();
      expect(result.transactionTemplates[0].id).toContain('template-');
      expect(result.history).toHaveLength(1);
      expect(result.history[0].description).toContain('Created template "Monthly Rent"');
    });

    it('should generate unique template IDs', () => {
      const payload = {
        name: 'Template',
        description: 'Test',
        amount: 100,
        category: 'Test',
        moneySourceId: 'source-1',
        type: 'withdraw' as const,
        affectBalance: true,
      };

      const result1 = handleAddTemplate(initialState, payload);
      const result2 = handleAddTemplate(result1, payload);

      expect(result2.transactionTemplates).toHaveLength(2);
      expect(result2.transactionTemplates[0].id).not.toBe(result2.transactionTemplates[1].id);
    });

    it('should add income template', () => {
      const payload = {
        name: 'Salary Template',
        description: 'Monthly salary',
        amount: 5000,
        category: 'Income',
        moneySourceId: 'source-1',
        type: 'income' as const,
        affectBalance: true,
      };

      const result = handleAddTemplate(initialState, payload);

      expect(result.transactionTemplates[0].type).toBe('income');
      expect(result.transactionTemplates[0].amount).toBe(5000);
    });
  });

  describe('handleUpdateTemplate', () => {
    it('should update an existing template', () => {
      // First add a template
      const addPayload = {
        name: 'Original Template',
        description: 'Original',
        amount: 100,
        category: 'Food',
        moneySourceId: 'source-1',
        type: 'withdraw' as const,
        affectBalance: true,
      };
      const stateWithTemplate = handleAddTemplate(initialState, addPayload);
      const templateId = stateWithTemplate.transactionTemplates[0].id;

      // Update it
      const updatedTemplate: TransactionTemplate = {
        id: templateId,
        name: 'Updated Template',
        description: 'Updated description',
        amount: 200,
        category: 'Entertainment',
        moneySourceId: 'source-1',
        type: 'withdraw',
        affectBalance: false,
      };

      const result = handleUpdateTemplate(stateWithTemplate, updatedTemplate);

      expect(result.transactionTemplates[0]).toEqual(updatedTemplate);
      expect(result.history).toHaveLength(2); // One from add, one from update
      expect(result.history[1].description).toContain('Updated template "Updated Template"');
    });

    it('should not affect other templates', () => {
      // Add two templates
      const payload1 = {
        name: 'Template 1',
        description: 'First',
        amount: 100,
        category: 'Food',
        moneySourceId: 'source-1',
        type: 'withdraw' as const,
        affectBalance: true,
      };
      const payload2 = {
        name: 'Template 2',
        description: 'Second',
        amount: 200,
        category: 'Transport',
        moneySourceId: 'source-1',
        type: 'withdraw' as const,
        affectBalance: true,
      };
      
      let state = handleAddTemplate(initialState, payload1);
      state = handleAddTemplate(state, payload2);
      
      const template1Id = state.transactionTemplates[0].id;
      const template1Original = state.transactionTemplates[0];

      // Update second template
      const updatedTemplate2: TransactionTemplate = {
        ...state.transactionTemplates[1],
        amount: 300,
      };

      const result = handleUpdateTemplate(state, updatedTemplate2);

      expect(result.transactionTemplates[0]).toEqual(template1Original);
      expect(result.transactionTemplates[1].amount).toBe(300);
    });
  });

  describe('handleDeleteTemplate', () => {
    it('should delete a template by id', () => {
      const addPayload = {
        name: 'To Delete',
        description: 'Will be deleted',
        amount: 100,
        category: 'Food',
        moneySourceId: 'source-1',
        type: 'withdraw' as const,
        affectBalance: true,
      };
      const stateWithTemplate = handleAddTemplate(initialState, addPayload);
      const templateId = stateWithTemplate.transactionTemplates[0].id;

      const result = handleDeleteTemplate(stateWithTemplate, templateId);

      expect(result.transactionTemplates).toHaveLength(0);
      expect(result.history[1].description).toContain('Deleted template "To Delete"');
    });

    it('should handle deletion of non-existent template', () => {
      const result = handleDeleteTemplate(initialState, 'non-existent');

      expect(result.transactionTemplates).toHaveLength(0);
      expect(result.history).toHaveLength(1);
      expect(result.history[0].description).toContain('Unknown');
    });

    it('should only delete specified template', () => {
      // Add multiple templates
      const payload1 = {
        name: 'Keep This',
        description: 'First',
        amount: 100,
        category: 'Food',
        moneySourceId: 'source-1',
        type: 'withdraw' as const,
        affectBalance: true,
      };
      const payload2 = {
        name: 'Delete This',
        description: 'Second',
        amount: 200,
        category: 'Transport',
        moneySourceId: 'source-1',
        type: 'withdraw' as const,
        affectBalance: true,
      };
      
      let state = handleAddTemplate(initialState, payload1);
      state = handleAddTemplate(state, payload2);
      
      const templateToDelete = state.transactionTemplates[1].id;

      const result = handleDeleteTemplate(state, templateToDelete);

      expect(result.transactionTemplates).toHaveLength(1);
      expect(result.transactionTemplates[0].name).toBe('Keep This');
    });
  });
});
