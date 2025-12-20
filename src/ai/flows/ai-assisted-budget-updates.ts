'use server';

/**
 * @fileOverview AI-assisted budget updates flow.
 *
 * This flow allows users to describe budget changes or transactions in natural language,
 * and the AI will suggest and automatically apply the appropriate updates within the application.
 *
 * @param {string} description - A description of the budget change or transaction.
 * @returns {Promise<AiAssistedBudgetUpdatesOutput>} - The output of the flow, containing suggested updates.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiAssistedBudgetUpdatesInputSchema = z.object({
  description: z.string().describe('A description of the budget change or transaction.'),
});
export type AiAssistedBudgetUpdatesInput = z.infer<typeof AiAssistedBudgetUpdatesInputSchema>;

const AiAssistedBudgetUpdatesOutputSchema = z.object({
  suggestedUpdates: z
    .string()
    .describe('Suggested updates to apply to the budget, in a format suitable for application.'),
});
export type AiAssistedBudgetUpdatesOutput = z.infer<typeof AiAssistedBudgetUpdatesOutputSchema>;

export async function aiAssistedBudgetUpdates(
  input: AiAssistedBudgetUpdatesInput
): Promise<AiAssistedBudgetUpdatesOutput> {
  return aiAssistedBudgetUpdatesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiAssistedBudgetUpdatesPrompt',
  input: {schema: AiAssistedBudgetUpdatesInputSchema},
  output: {schema: AiAssistedBudgetUpdatesOutputSchema},
  prompt: `You are a personal finance assistant. The user will describe a budget change or transaction.

  Your task is to analyze the description and suggest updates to apply to the budget within the application.

  Description: {{{description}}}

  Respond with a string formatted suitable for direct consumption from the app.
  For example, if a user describes "I received my salary of $3000", respond with a string like:
  "income:3000"

  If the user describes "I bought groceries for $100", respond with a string like:
  "groceries:-100"

  Ensure that the amount is prefixed with a "-" if it's a withdrawal/expense, and no prefix if it's an income.
`,
});

const aiAssistedBudgetUpdatesFlow = ai.defineFlow(
  {
    name: 'aiAssistedBudgetUpdatesFlow',
    inputSchema: AiAssistedBudgetUpdatesInputSchema,
    outputSchema: AiAssistedBudgetUpdatesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
