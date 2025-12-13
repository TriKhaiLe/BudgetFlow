# BudgetFlow Quick Context

Use this when booting up the repo to regain context fast.

## Stack and Commands

- Next.js 15 (app router) with Turbopack dev server; port 9002. UI: Tailwind + shadcn (Radix), Recharts, date-fns, react-hook-form, zod.
- AI: Genkit with Google Gemini 2.5 Flash via @genkit-ai/google-genai.
- Data is stored client-side in localStorage only (key: `budgetFlowState`). No backend other than Genkit flows.
- Scripts: `npm run dev` (Next), `npm run genkit:dev` (Genkit server via `src/ai/dev.ts`), `npm run genkit:watch` (hot reload flows), `npm run build`, `npm run lint`, `npm run typecheck`.
- Env: `.env` must include `GEMINI_API_KEY`. Genkit loads env via `dotenv` inside `src/ai/dev.ts`.

## App Flow (happy path)

1. Run both dev servers (Next + Genkit). Open `http://localhost:9002`.
2. Add money sources (wallet/bank) -> adds to state + history. State persists to localStorage automatically after init load.
3. Add transactions (income/expense) under "Transactions" tab. Toggle `Update Balance` to decide whether the balance changes; affects budget/spent/balance per reducer logic.
4. Use AI Assistant to describe a transaction; it returns `category:amount` (income positive, expense negative). Confirm and choose a money source to add.
5. Track featured (non-budget) transactions in separate tab. History tab shows logged actions.
6. Export/Import via header Data Management (JSON). Strategies: `REPLACE` overwrites everything; `NEXT_MONTH` resets spending, sets budgets to previous balances, advances month.

## State Model (src/contexts/budget-context.tsx)

- `BudgetState`: `moneySources`, `transactions`, `featuredTransactions`, `history`, `currentMonth` (ISO, startOfMonth default).
- Actions include `ADD/UPDATE/DELETE_MONEY_SOURCE`, `ADD/UPDATE/DELETE_TRANSACTION`, `ADD/DELETE_FEATURED_TRANSACTION`, `ADJUST_BALANCE`, `SET_CURRENT_MONTH`, `IMPORT_DATA` strategies, `SET_INITIAL_STATE`.
- Transactions: income increases budget and balance; expense increases spent and decreases balance; delete assumes transaction affected balance; update is shallow (does not rebalance) and logs a warning.
- Migrations: on load, backfills `currentMonth`, coerces transaction types, ensures arrays exist.
- **Reducer Architecture (Refactored Dec 2025)**: Action handlers split into `src/contexts/reducers/` with separate files for money sources, transactions, state, and history helpers.

## Shared Code (Refactored Dec 2025)

- **Constants** (`src/lib/constants.ts`): `CATEGORY_SUGGESTIONS`, `HISTORY_ICON_MAP`, `STORAGE_KEY`, `getHistoryIconConfig()`.
- **Schemas** (`src/lib/schemas.ts`): Zod validation schemas: `moneySourceSchema`, `transactionSchema`, `featuredTransactionSchema`, `updateBalanceSchema`, `aiAssistantSchema`.
- **Shared Components** (`src/components/shared/`): `FormattedInput` - reusable number input with comma formatting and quick-add buttons.

## AI Flows (src/ai)

- Config (`genkit.ts`): `googleai/gemini-2.5-flash` with Google plugin.
- `ai-assisted-budget-updates`: input `description`; output string in `category:amount` format (expense negative). Used by AI Assistant dialog.
- `suggest-transaction-categories`: input `description`; output `categories: string[]`. Not yet wired into UI.
- Dev entry (`dev.ts`): loads dotenv, registers both flows.

## UI Landmarks

- `src/app/page.tsx`: wraps dashboard in `BudgetProvider`; sections: Budget Summary, Analytics, Transactions, Money Sources. Add buttons for Transactions and Money Sources are in the CollapsibleCard headers.
- Header: `dashboard-header.tsx` exposes AI Assistant, Import/Export, Help, Month selector. Mobile sidebar includes DialogTitle for accessibility.
- CollapsibleCard: `collapsible-card.tsx` supports optional `action` prop for header buttons (e.g., Add buttons). Clicking action buttons won't trigger collapse/expand.
- Dialogs: All dialog components (Add Transaction, Money Source, AI Assistant, etc.) use scrollable containers with `max-h-[90vh]` and `overflow-y-auto` on content areas to prevent overflow on small screens. Header and footer remain fixed while body scrolls.
- Analytics: bar chart of expenses by category; hidden when no expenses.
- Budget Month Selector: month/year dropdown that dispatches `SET_CURRENT_MONTH` (also logs to history).
- Data Management: JSON import/export; shows strategy dialog before import.
- Help Dialog: quick usage guide baked into UI.

## Testing/Quality Notes

- No automated tests present. Rely on `npm run lint` and `npm run typecheck`.
- Be cautious editing reducer math and import/export transformations; they drive persistence and history logging.
- Transaction update/delete logic is simplified; altering amounts/types may need full rebalance if correctness matters.

## Quick Checks After Changes

- Add/delete money source updates history and cascades to transactions as expected.
- AI Assistant still returns parsable `category:amount` strings and adds transactions correctly.
- Import/Export round-trips localStorage state (both strategies) without runtime errors.
