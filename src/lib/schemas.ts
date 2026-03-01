import * as z from 'zod';
import { parseFormattedNumber } from '@/lib/utils';

/**
 * Shared validation schemas for forms across the application.
 * Centralizing schemas ensures consistent validation rules.
 */

/**
 * Validates a formatted number string (with commas).
 * Ensures the value is a positive number greater than zero.
 */
export const positiveAmountSchema = z.string().refine(
  (val) => parseFormattedNumber(val) > 0,
  'Amount must be greater than zero.'
);

/**
 * Validates a formatted number string.
 * Allows zero and positive values.
 */
export const nonNegativeAmountSchema = z.string().refine(
  (val) => !isNaN(parseFormattedNumber(val)) && parseFormattedNumber(val) >= 0,
  'Please enter a valid number.'
);

/**
 * Validates a formatted number string.
 * Allows any valid number including negative.
 */
export const validNumberSchema = z.string().refine(
  (val) => !isNaN(parseFormattedNumber(val)),
  'Please enter a valid number.'
);

/**
 * Schema for money source form validation.
 */
export const moneySourceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  budget: z.string().refine(
    (value) => !isNaN(parseFormattedNumber(value)) && parseFormattedNumber(value) > 0,
    { message: 'Budget must be a positive number.' }
  ),
  balance: z.string().refine(
    (value) => !isNaN(parseFormattedNumber(value)),
    { message: 'Balance must be a valid number.' }
  ),
});

export type MoneySourceFormValues = z.infer<typeof moneySourceSchema>;

/**
 * Schema for balance update form validation.
 */
export const updateBalanceSchema = z.object({
  newBalance: validNumberSchema,
});

export type UpdateBalanceFormValues = z.infer<typeof updateBalanceSchema>;

/**
 * Schema for AI assistant form validation.
 */
export const aiAssistantSchema = z.object({
  description: z.string().min(10, 'Please describe your transaction in more detail.'),
});

export type AiAssistantFormValues = z.infer<typeof aiAssistantSchema>;
