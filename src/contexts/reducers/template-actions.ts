import type { BudgetState, TransactionTemplate } from '@/lib/types';
import { appendHistory } from './history-helpers';

/**
 * Generates a unique ID for a new template.
 */
function generateTemplateId(): string {
  return `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Handles adding a new transaction template.
 */
export function handleAddTemplate(
  state: BudgetState,
  payload: Omit<TransactionTemplate, 'id'>
): BudgetState {
  const newTemplate: TransactionTemplate = {
    ...payload,
    id: generateTemplateId(),
  };

  return {
    ...state,
    transactionTemplates: [...state.transactionTemplates, newTemplate],
    history: appendHistory(
      state.history,
      `Created template "${payload.name}"`
    ),
  };
}

/**
 * Handles updating an existing transaction template.
 */
export function handleUpdateTemplate(
  state: BudgetState,
  payload: TransactionTemplate
): BudgetState {
  return {
    ...state,
    transactionTemplates: state.transactionTemplates.map((template) =>
      template.id === payload.id ? payload : template
    ),
    history: appendHistory(
      state.history,
      `Updated template "${payload.name}"`
    ),
  };
}

/**
 * Handles deleting a transaction template.
 */
export function handleDeleteTemplate(
  state: BudgetState,
  templateId: string
): BudgetState {
  const template = state.transactionTemplates.find((t) => t.id === templateId);
  const templateName = template?.name || 'Unknown';

  return {
    ...state,
    transactionTemplates: state.transactionTemplates.filter(
      (t) => t.id !== templateId
    ),
    history: appendHistory(
      state.history,
      `Deleted template "${templateName}"`
    ),
  };
}
