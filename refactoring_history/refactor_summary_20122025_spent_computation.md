# Refactoring Summary: Spent as Computed Value

**Date**: December 20, 2025  
**Type**: Logic Refactoring  
**Status**: ✅ Completed

## Overview

Changed the `spent` field from being directly updated to being a computed value based on the formula:

**`spent = budget - balance`**

This ensures the `spent` value is always accurate and consistent with the budget and balance values.

## Motivation

- **Accuracy**: Computing spent eliminates inconsistencies and ensures it always reflects the actual difference between budget and balance
- **Simplicity**: No need to manually update spent in every transaction or balance change
- **Correctness**: Prevents bugs where spent might get out of sync with budget/balance

## Changes Made

### 1. Transaction Actions

**File**: [src/contexts/reducers/transaction-actions.ts](src/contexts/reducers/transaction-actions.ts)

**handleAddTransaction**:

```typescript
const newBalance = affectBalance ? ms.balance + signedAmount : ms.balance;
const newBudget = ms.budget + signedAmount;
const newSpent = newBudget - newBalance; // COMPUTED

return { ...ms, balance: newBalance, budget: newBudget, spent: newSpent };
```

**handleDeleteTransaction**:

```typescript
balance: ms.balance - signedAmount,
budget: ms.budget - signedAmount,
spent: (ms.budget - signedAmount) - (ms.balance - signedAmount), // COMPUTED
```

### 2. Money Source Actions

**File**: [src/contexts/reducers/money-source-actions.ts](src/contexts/reducers/money-source-actions.ts)

**handleAddMoneySource**:

```typescript
const newSource: MoneySource = {
  ...payload,
  id: crypto.randomUUID(),
  spent: payload.budget - payload.balance, // COMPUTED on creation
};
```

**handleAdjustBalance**:

```typescript
ms.id === moneySourceId
  ? { ...ms, balance: newBalance, spent: ms.budget - newBalance } // COMPUTED
  : ms;
```

### 3. State Actions

**File**: [src/contexts/reducers/state-actions.ts](src/contexts/reducers/state-actions.ts)

**handleStartNewMonth**:

- When starting a new month, budget = balance, so spent = 0
- Comment added for clarity: `spent: 0, // spent = budget - balance = balance - balance = 0`

**handleImportData (NEXT_MONTH strategy)**:

- Similar logic: budget = balance, so spent = 0

**migrateState**:

- Added migration logic to recompute spent for all loaded money sources:

```typescript
if (parsedState.moneySources) {
  parsedState.moneySources = parsedState.moneySources.map((ms: any) => ({
    ...ms,
    spent: ms.budget - ms.balance, // RECOMPUTE on load
  }));
}
```

### 4. UI Components

**File**: [src/components/dashboard/money-sources.tsx](src/components/dashboard/money-sources.tsx)

**MoneySourceForm onSubmit**:

```typescript
if (source) {
  const updatedSource = {
    ...source,
    ...numericValues,
    spent: numericValues.budget - numericValues.balance, // COMPUTED
  };
  dispatch({ type: "UPDATE_MONEY_SOURCE", payload: updatedSource });
}
```

### 5. Documentation

**File**: [docs/types-reference.md](docs/types-reference.md)

Updated MoneySource interface documentation:

```typescript
{
  id: string; // UUID
  name: string; // e.g., "Wallet", "Bank Account"
  budget: number; // Total budget allocated
  spent: number; // COMPUTED: budget - balance (never set directly)
  balance: number; // Current balance
}
```

## Formula

**Always**: `spent = budget - balance`

This makes logical sense:

- If you have a budget of 1000 and a balance of 700, you've spent 300
- The formula naturally handles all cases without special logic

## Implementation Pattern

Whenever budget or balance changes:

1. Update budget and/or balance
2. Compute spent = budget - balance
3. Never update spent directly

## Migration

All existing data is automatically migrated:

- `migrateState` recomputes spent for all money sources on load
- Ensures old data with potentially incorrect spent values is corrected
- No manual migration needed by users

## Files Changed

**Total Files Modified**: 5

1. [src/contexts/reducers/transaction-actions.ts](src/contexts/reducers/transaction-actions.ts)
2. [src/contexts/reducers/money-source-actions.ts](src/contexts/reducers/money-source-actions.ts)
3. [src/contexts/reducers/state-actions.ts](src/contexts/reducers/state-actions.ts)
4. [src/components/dashboard/money-sources.tsx](src/components/dashboard/money-sources.tsx)
5. [docs/types-reference.md](docs/types-reference.md)

## Testing

Existing test in [src/contexts/reducers/**tests**/money-source-actions.test.ts](src/contexts/reducers/__tests__/money-source-actions.test.ts) validates the computation:

```typescript
it("should adjust balance and recalculate spent", () => {
  // ...
  expect(updatedSource?.spent).toBe(500); // budget(5000) - balance(4500)
});
```

## Benefits

✅ **Accuracy**: Spent is always correct  
✅ **Simplicity**: One formula, no special cases  
✅ **Maintainability**: Less code, fewer bugs  
✅ **Consistency**: Impossible for spent to be out of sync  
✅ **Migration**: Automatic correction of old data

## Breaking Changes

**None**: All changes are backward compatible with automatic migration.
