# BudgetFlow Types & Actions Reference

Quick reference for TypeScript interfaces and reducer actions.

## Core Types (src/lib/types.ts)

### MoneySource

```typescript
{
  id: string; // UUID
  name: string; // e.g., "Wallet", "Bank Account"
  budget: number; // Total budget allocated
  spent: number; // Amount spent (calculated)
  balance: number; // Current balance
}
```

### Transaction

```typescript
{
  id: string; // UUID
  description: string; // Human-readable description
  amount: number; // Always positive; sign determined by type
  category: string; // e.g., "Groceries", "Salary"
  date: string; // ISO date string
  moneySourceId: string; // FK to MoneySource
  type: "income" | "expense"; // Determines if + or -
}
```

### FeaturedTransaction

```typescript
{
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string; // ISO date string
}
```

### HistoryLog

```typescript
{
  id: string; // UUID
  description: string; // Human-readable log entry
  timestamp: string; // ISO timestamp
}
```

## BudgetContext Actions (src/contexts/budget-context.tsx)

### Money Source Actions

- `ADD_MONEY_SOURCE`: `Omit<MoneySource, 'id' | 'spent'>`
  - Creates new source; auto-generates id, sets spent=0
- `UPDATE_MONEY_SOURCE`: `MoneySource`
  - Direct replacement by id
- `DELETE_MONEY_SOURCE`: `string` (id)
  - Cascades: deletes all transactions linked to source
- `ADJUST_BALANCE`: `{ moneySourceId: string; newBalance: number }`
  - Manually set balance; recalculates spent

### Transaction Actions

- `ADD_TRANSACTION`: `Omit<Transaction, 'id'> & { affectBalance: boolean }`
  - **Required fields**: description, amount, category, **date**, moneySourceId, type, affectBalance
  - Auto-generates id
  - If `affectBalance=true`: updates source balance
  - Income: increases budget & balance
  - Expense: increases spent & decreases balance
- `UPDATE_TRANSACTION`: `Transaction`
  - Shallow update; does NOT rebalance! Logs warning in history
- `DELETE_TRANSACTION`: `Transaction`
  - Reverses original transaction's effect on balance/budget/spent

### Featured Transaction Actions

- `ADD_FEATURED_TRANSACTION`: `Omit<FeaturedTransaction, 'id' | 'date'>`
  - Auto-generates id and date
  - Does NOT affect budget or balance
- `DELETE_FEATURED_TRANSACTION`: `string` (id)

### System Actions

- `SET_CURRENT_MONTH`: `Date`
  - Stores as ISO string (startOfMonth)
- `IMPORT_DATA`: `{ state: BudgetState; strategy: 'REPLACE' | 'NEXT_MONTH' }`
  - REPLACE: overwrites everything
  - NEXT_MONTH: resets spent, sets budgets to previous balances, advances month
- `SET_INITIAL_STATE`: `BudgetState`
  - Direct hydration (used on load)

## Common Pitfalls

- **ADD_TRANSACTION**: Must include `date` (ISO string) and `affectBalance` (boolean). Example:
  ```typescript
  dispatch({
    type: "ADD_TRANSACTION",
    payload: {
      description: "Groceries",
      amount: 50.0,
      category: "Food",
      date: new Date().toISOString(),
      moneySourceId: "abc-123",
      type: "expense",
      affectBalance: true,
    },
  });
  ```
- **UPDATE_TRANSACTION**: Does not recalculate balances; use with caution.
- **DELETE_MONEY_SOURCE**: Deletes all child transactions silently.
- Transaction `amount` is always positive; `type` controls the sign.
