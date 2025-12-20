# Refactoring Summary: Expense to Withdraw Transaction Type

**Date**: December 20, 2025  
**Type**: Feature Refactoring  
**Status**: ✅ Completed

## Overview

Refactored the "expense" transaction type to "withdraw" to better represent the actual behavior and align with the application's intended functionality.

## Motivation

The previous "expense" transaction type was misleading:

- It only updated the `spent` value of a money source
- The name "expense" didn't clearly communicate what it did
- The intended behavior was to subtract from the budget (like a withdrawal), not just track spending

## Changes Made

### 1. Type System Updates

**Files Modified:**

- [src/lib/types.ts](src/lib/types.ts)
- [src/lib/schemas.ts](src/lib/schemas.ts)
- [src/lib/constants.ts](src/lib/constants.ts)

**Changes:**

- Changed `type: 'income' | 'expense'` to `type: 'income' | 'withdraw'` in:
  - `Transaction` interface
  - `TransactionTemplate` interface
  - `transactionSchema` validation
  - `transactionTemplateSchema` validation
  - `TRANSACTION_TYPES` constant

### 2. Logic Updates

**Files Modified:**

- [src/contexts/reducers/transaction-actions.ts](src/contexts/reducers/transaction-actions.ts)

**Key Changes:**

**Before (Expense):**

```typescript
const newSpent = type === "expense" ? ms.spent + amount : ms.spent;
const newBudget = type === "income" ? ms.budget + amount : ms.budget;
```

**After (Withdraw):**

```typescript
const newBudget = ms.budget + signedAmount;
// signedAmount is negative for withdraw, positive for income
```

**New Behavior:**

- **Income**: Adds to budget, optionally adds to balance
- **Withdraw**: Subtracts from budget, optionally subtracts from balance
- The `affectBalance` toggle controls whether the current balance is updated
- Removed the `spent` field manipulation entirely

### 3. UI Component Updates

**Files Modified:**

- [src/components/dashboard/transactions-view.tsx](src/components/dashboard/transactions-view.tsx)
- [src/components/dashboard/templates-view.tsx](src/components/dashboard/templates-view.tsx)
- [src/components/dashboard/help-dialog.tsx](src/components/dashboard/help-dialog.tsx)
- [src/components/dashboard/analytics.tsx](src/components/dashboard/analytics.tsx)
- [src/components/dashboard/ai-assistant-dialog.tsx](src/components/dashboard/ai-assistant-dialog.tsx)

**Changes:**

- Updated all radio button labels from "Expense" to "Withdraw"
- Updated dialog descriptions to mention "withdrawal" instead of "expense"
- Updated help text to explain the new withdraw behavior
- Updated analytics chart title from "Expense Breakdown" to "Withdrawal Breakdown"
- Changed default transaction type in templates from 'expense' to 'withdraw'

### 4. AI Integration Updates

**Files Modified:**

- [src/ai/flows/ai-assisted-budget-updates.ts](src/ai/flows/ai-assisted-budget-updates.ts)

**Changes:**

- Updated AI prompt to mention "withdrawal/expense" for clarity
- Type handling updated to use 'withdraw' instead of 'expense'

### 5. Documentation Updates

**Files Modified:**

- [docs/blueprint.md](docs/blueprint.md)
- [docs/types-reference.md](docs/types-reference.md)
- [docs/context-guide.md](docs/context-guide.md)
- [src/app/layout.tsx](src/app/layout.tsx)
- [public/manifest.json](public/manifest.json)

**Changes:**

- Updated all documentation to reflect the new "withdraw" terminology
- Updated behavior descriptions to explain that withdraw subtracts from budget
- Updated app descriptions to use "Track income and withdrawals" instead of "Track expenses"

### 6. Migration Support

**Files Modified:**

- [src/contexts/reducers/state-actions.ts](src/contexts/reducers/state-actions.ts)

**Changes:**

- Added backward compatibility migration logic
- Automatically converts old 'expense' type to 'withdraw' when loading saved data
- Ensures existing user data continues to work correctly

### 7. Test Updates

**Files Modified:**

- [src/contexts/reducers/**tests**/money-source-actions.test.ts](src/contexts/reducers/__tests__/money-source-actions.test.ts)

**Changes:**

- Updated test fixtures to use 'withdraw' instead of 'expense'

## Summary of New Transaction Behavior

### Income Transaction

- ✅ Adds amount to budget
- ✅ Optionally adds amount to balance (if "Update Balance" is enabled)
- ✅ Positive amount

### Withdraw Transaction

- ✅ Subtracts amount from budget
- ✅ Optionally subtracts amount from balance (if "Update Balance" is enabled)
- ✅ Negative amount (internally handled with signedAmount)

## Testing Recommendations

1. ✅ Verify old data with 'expense' type is migrated correctly
2. ✅ Test adding new withdraw transactions
3. ✅ Test the "Update Balance" toggle functionality
4. ✅ Verify analytics chart shows withdrawals correctly
5. ✅ Test transaction templates with withdraw type
6. ✅ Test AI assistant with withdrawal descriptions

## Breaking Changes

- **None for existing users**: Migration logic ensures backward compatibility
- API/Schema changes are internal only
- Saved data will be automatically migrated on load

## Files Changed Summary

**Total Files Modified**: 19

**Categories:**

- Type definitions: 3 files
- Logic/Reducers: 3 files
- UI Components: 5 files
- AI Integration: 1 file
- Documentation: 5 files
- Tests: 1 file
- Configuration: 1 file

## Next Steps

- Monitor for any edge cases in production
- Consider removing the `spent` field from `MoneySource` interface if no longer needed
- Update any external documentation or tutorials

## Notes

- The term "expense" in AI prompts was kept as "withdrawal/expense" for user familiarity
- Migration logic maintains compatibility with older saved budgets
- The refactoring aligns the implementation with the original design intent
