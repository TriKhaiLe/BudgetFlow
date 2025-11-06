'use server';

/**
 * @fileOverview Provides transaction category suggestions based on a user-provided description.
 *
 * - suggestTransactionCategories - An asynchronous function that suggests relevant transaction categories.
 * - SuggestTransactionCategoriesInput - The input type for the suggestTransactionCategories function, containing the transaction description.
 * - SuggestTransactionCategoriesOutput - The output type for the suggestTransactionCategories function, listing suggested categories.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTransactionCategoriesInputSchema = z.object({
  description: z
    .string()
    .describe('A description of the transaction for which to suggest categories.'),
});
export type SuggestTransactionCategoriesInput = z.infer<
  typeof SuggestTransactionCategoriesInputSchema
>;

const SuggestTransactionCategoriesOutputSchema = z.object({
  categories: z
    .array(z.string())
    .describe('An array of suggested categories for the transaction.'),
});
export type SuggestTransactionCategoriesOutput = z.infer<
  typeof SuggestTransactionCategoriesOutputSchema
>;

export async function suggestTransactionCategories(
  input: SuggestTransactionCategoriesInput
): Promise<SuggestTransactionCategoriesOutput> {
  return suggestTransactionCategoriesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTransactionCategoriesPrompt',
  input: {schema: SuggestTransactionCategoriesInputSchema},
  output: {schema: SuggestTransactionCategoriesOutputSchema},
  prompt: `Given the following transaction description, suggest up to 5 appropriate categories:

Transaction Description: {{{description}}}

Categories:`,
});

const suggestTransactionCategoriesFlow = ai.defineFlow(
  {
    name: 'suggestTransactionCategoriesFlow',
    inputSchema: SuggestTransactionCategoriesInputSchema,
    outputSchema: SuggestTransactionCategoriesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
