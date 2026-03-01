import type { BudgetState, BudgetLogTemplate } from '@/lib/types';
import { appendHistory } from './history-helpers';

/**
 * Generates a unique ID for a new template.
 */
function generateTemplateId(): string {
  return `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Handles adding a new budget log template.
 */
export function handleAddTemplate(
  state: BudgetState,
  payload: Omit<BudgetLogTemplate, 'id'>
): BudgetState {
  const newTemplate: BudgetLogTemplate = {
    ...payload,
    id: generateTemplateId(),
  };

  return {
    ...state,
    templates: [...state.templates, newTemplate],
    history: appendHistory(
      state.history,
      `Created template "${payload.name}"`
    ),
  };
}

/**
 * Handles updating an existing budget log template.
 */
export function handleUpdateTemplate(
  state: BudgetState,
  payload: BudgetLogTemplate
): BudgetState {
  return {
    ...state,
    templates: state.templates.map((template) =>
      template.id === payload.id ? payload : template
    ),
    history: appendHistory(
      state.history,
      `Updated template "${payload.name}"`
    ),
  };
}

/**
 * Handles deleting a budget log template.
 */
export function handleDeleteTemplate(
  state: BudgetState,
  templateId: string
): BudgetState {
  const template = state.templates.find((t) => t.id === templateId);
  const templateName = template?.name || 'Unknown';

  return {
    ...state,
    templates: state.templates.filter(
      (t) => t.id !== templateId
    ),
    history: appendHistory(
      state.history,
      `Deleted template "${templateName}"`
    ),
  };
}
