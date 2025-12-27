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
3. Add transactions (income/withdraw) under "Transactions" tab. Toggle `Update Balance` to decide whether the balance changes; both income and withdraw affect the budget, and optionally the balance per reducer logic.
4. Use AI Assistant to describe a transaction; it returns `category:amount` (income positive, withdrawal negative). Confirm and choose a money source to add.
5. Track featured (non-budget) transactions in separate tab. History tab shows logged actions.
6. Export/Import via header Data Management (JSON). Strategies: `REPLACE` overwrites everything; `NEXT_MONTH` resets spending, sets budgets to previous balances, advances month.

## State Model (src/contexts/budget-context.tsx)

- `BudgetState`: `moneySources`, `transactions`, `featuredTransactions`, `transactionTemplates`, `history`, `currentMonth` (ISO, startOfMonth default).
- Actions include `ADD/UPDATE/DELETE_MONEY_SOURCE`, `ADD/UPDATE/DELETE_TRANSACTION`, `ADD/DELETE_FEATURED_TRANSACTION`, `ADD/UPDATE/DELETE_TEMPLATE`, `ADJUST_BALANCE`, `SET_CURRENT_MONTH`, `IMPORT_DATA` strategies, `SET_INITIAL_STATE`.
- Transactions: income adds to budget and optionally to balance; withdraw subtracts from budget and optionally from balance; spent is always computed as budget - balance; delete reverses the transaction assuming it affected balance; update is shallow (does not rebalance) and logs a warning.
- Templates: reusable transaction presets with `useCurrentDate` flag to auto-fill today's date when applied.
- Migrations: on load, backfills `currentMonth`, coerces transaction types, ensures arrays exist (including `transactionTemplates`).
- **Reducer Architecture (Refactored Dec 2025)**: Action handlers split into `src/contexts/reducers/` with separate files for money sources, transactions, templates, state, and history helpers.

## Shared Code (Refactored Dec 2025)

- **Constants** (`src/lib/constants.ts`): `CATEGORY_SUGGESTIONS`, `HISTORY_ICON_MAP`, `STORAGE_KEY`, `getHistoryIconConfig()`.
- **Schemas** (`src/lib/schemas.ts`): Zod validation schemas: `moneySourceSchema`, `transactionSchema`, `featuredTransactionSchema`, `transactionTemplateSchema`, `updateBalanceSchema`, `aiAssistantSchema`.
- **Shared Components** (`src/components/shared/`):
  - `FormattedInput` - reusable number input with comma formatting, quick-add buttons, and clear button.
  - `ClearableInput` - text input wrapper with quick-delete (X) button that appears when input has value. Used for description/name fields.
  - `ClearableTextarea` - textarea wrapper with quick-delete (X) button. Used for notes and AI description fields.

## Transaction Templates (Added Dec 2025)

- **Purpose**: Reusable presets for quick transaction entry. Templates store: name, description, amount, category, money source, type (income/withdraw), useCurrentDate flag, affectBalance flag.
- **Components**: `src/components/dashboard/templates-view.tsx` contains `TemplatesView`, `TemplateFormDialog`, `AddTemplateButton`.
- **Usage Flow**:
  1. Create templates via Templates tab or from Add Transaction dialog
  2. In Add Transaction dialog, click "Use Template" dropdown
  3. Select template to auto-fill form fields
  4. If `useCurrentDate` is true, date is set to today
- **State**: Templates stored in `state.transactionTemplates`, persisted to localStorage.
- **Reducer**: `template-actions.ts` handles `ADD_TEMPLATE`, `UPDATE_TEMPLATE`, `DELETE_TEMPLATE`.

## AI Flows (src/ai)

- Config (`genkit.ts`): `googleai/gemini-2.5-flash` with Google plugin.
- `ai-assisted-budget-updates`: input `description`; output string in `category:amount` format (withdrawal negative). Used by AI Assistant dialog.
- `suggest-transaction-categories`: input `description`; output `categories: string[]`. Not yet wired into UI.
- Dev entry (`dev.ts`): loads dotenv, registers both flows.

## UI Landmarks

- `src/app/page.tsx`: wraps dashboard in `BudgetProvider`; sections: Budget Summary, Analytics, Transactions, Money Sources. Add buttons for Transactions and Money Sources are in the CollapsibleCard headers.
- Header: `dashboard-header.tsx` exposes AI Assistant, Import/Export, Help, Month selector. Mobile sidebar includes DialogTitle for accessibility.
- CollapsibleCard: `collapsible-card.tsx` supports optional `action` prop for header buttons (e.g., Add buttons). Clicking action buttons won't trigger collapse/expand.
- Dialogs: All dialog components (Add Transaction, Money Source, AI Assistant, etc.) use scrollable containers with `max-h-[90vh]` and `overflow-y-auto` on content areas to prevent overflow on small screens. Header and footer remain fixed while body scrolls.
- Analytics: collapsible bar chart showing spent amount per money source.
- Budget Month Selector: month/year dropdown that dispatches `SET_CURRENT_MONTH` (also logs to history).
- Data Management: JSON import/export; shows strategy dialog before import.
- Help Dialog: quick usage guide baked into UI.

## Testing/Quality Notes

- Tests available via `npm run test`. Component tests in `__tests__` folders, coverage via `npm run test:coverage`.
- Also rely on `npm run lint` and `npm run typecheck` for static analysis.
- Be cautious editing reducer math and import/export transformations; they drive persistence and history logging.
- Transaction update/delete logic is simplified; altering amounts/types may need full rebalance if correctness matters.

## Quick Checks After Changes

- Add/delete money source updates history and cascades to transactions as expected.
- AI Assistant still returns parsable `category:amount` strings and adds transactions correctly.
- Import/Export round-trips localStorage state (both strategies) without runtime errors.
