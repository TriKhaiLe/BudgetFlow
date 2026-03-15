# BudgetFlow Quick Context

Use this when booting up the repo to regain context fast.

## Stack and Commands

- Next.js 15 (app router) with Turbopack dev server; port 9002. UI: Tailwind + shadcn (Radix), Recharts, date-fns, react-hook-form, zod.
- AI: Genkit with Google Gemini 2.5 Flash via @genkit-ai/google-genai.
- Data is stored client-side in localStorage only (key: `budgetFlowState`). No backend other than Genkit flows.
- Scripts: `npm run dev` (Next), `npm run genkit:dev` (Genkit server via `src/ai/dev.ts`), `npm run genkit:watch` (hot reload flows), `npm run build`, `npm run lint`, `npm run typecheck`.
- Env: `.env` must include `GEMINI_API_KEY`. Genkit loads env via `dotenv` inside `src/ai/dev.ts`.
- Known issue: `npm run lint` fails with a circular JSON error in `.eslintrc.json` (React plugin circular reference). Pre-existing, not related to app code.

## App Flow (happy path)

1. Run both dev servers (Next + Genkit). Open `http://localhost:9002`.
2. Add money sources (wallet/bank) → adds to state + history. State persists to localStorage automatically after init load.
3. Initialize budget tracking → captures current budgets as the baseline entry.
4. Add budget log entries with delta changes per money source (positive = income, negative = withdrawal). Each entry updates budget and balance (unless locked).
5. Use AI Assistant to describe a budget change; it returns `category:amount`. Confirm and choose a money source to add as a budget log entry.
6. Track activity via the "Budget Log" card (history of all app operations in reverse chronological order).
7. Export/Import via header Data Management (JSON). Strategies: `REPLACE` overwrites everything; `NEXT_MONTH` resets spending, sets budgets to previous balances, advances month.

## State Model (src/contexts/budget-context.tsx)

- `BudgetState`: `moneySources`, `templates` (BudgetLogTemplate[]), `history`, `budgetLog` (BudgetLogEntry[]), `budgetLogBalanceLocks?`, `currentMonth`, `monthDescription?`, `metadata?`.
- Actions: `ADD/UPDATE/DELETE_MONEY_SOURCE`, `ADD/UPDATE/DELETE_TEMPLATE`, `INITIALIZE_BUDGET_LOG`, `ADD/DELETE/UPDATE_BUDGET_LOG_ENTRY`, `TOGGLE_BUDGET_LOG_BALANCE_LOCK`, `ADJUST_BALANCE`, `SET_CURRENT_MONTH`, `IMPORT_DATA`, `START_NEW_MONTH`, `UPDATE_MONTH_DESCRIPTION`, `SET_INITIAL_STATE`.
- Budget log entries: delta changes per money source. Adding an entry: `budget += delta`, `balance += delta` (unless locked), `spent = budget - balance`. Deleting reverses the changes. Updating computes net change (newDelta - oldDelta) and applies it.
- Balance locks: per-money-source toggle. When locked, budget log add/delete/update skip balance adjustments (budget still changes).
- Templates: reusable budget log entry presets storing name, description, and preset delta values per money source.
- Migrations: on load, `migrateState` ensures `budgetLog`, `templates`, `history` arrays exist; migrates old `transactionTemplates` to new `templates` format; deletes legacy `transactions`/`featuredTransactions`/`transactionTemplates` fields.
- **Reducer Architecture**: Action handlers split into `src/contexts/reducers/` with separate files for money sources, templates, budget log, state, and history helpers.

## Shared Code

- **Constants** (`src/lib/constants.ts`): `HISTORY_ICON_MAP`, `STORAGE_KEY`, `getHistoryIconConfig()`, `IMPORT_STRATEGIES`.
- **Schemas** (`src/lib/schemas.ts`): Zod validation schemas: `moneySourceSchema`, `updateBalanceSchema`, `aiAssistantSchema`, `positiveAmountSchema`, `nonNegativeAmountSchema`, `validNumberSchema`.
- **Shared Components** (`src/components/shared/`):
  - `FormattedInput` — reusable number input with comma formatting, quick-add buttons, and clear button. Supports negative numbers.
  - `ClearableInput` — text input wrapper with quick-delete (X) button.
  - `ClearableTextarea` — textarea wrapper with quick-delete (X) button.

## Budget Transactions (Budget Log) — Primary Feature

- **Purpose**: A vertical spreadsheet-like view tracking budget changes over time. Columns = money sources, rows = budget change entries.
- **Data Model**: `BudgetLogEntry { id, description, changes: Record<moneySourceId, amount>, isInitial, createdAt }`. Stored in `state.budgetLog`.
- **Flow**:
  1. User clicks "Start Budget Tracking" → captures current budgets as initial entry (isInitial=true, absolute values)
  2. Click "New Entry" → popup dialog with description + delta amounts per money source
  3. Each entry updates money source budgets and balances. Running totals are computed in the view via useMemo.
  4. Table rows: Initial (gray), Entry (white, with edit/delete), Updated (dashed, running totals), New Entry button, Current Balance (blue, with lock toggles), Spent (red).
  5. Click description to edit entry (popup), click timestamp to edit inline, trash icon to delete (confirmation dialog).
  6. Lock/unlock icons toggle per-source balance locks.
  7. "Edit Current Balances" dialog for direct balance adjustment with auto-entry creation.
- **Components**: `src/components/dashboard/budget-log-view.tsx` — `BudgetLogView`, `AddEntryDialog`, `EditCurrentBalancesDialog`, `InitializeBudgetLogPrompt`, `BudgetLogTable`.
- **Reducer**: `budget-log-actions.ts` — `handleInitializeBudgetLog`, `handleAddBudgetLogEntry`, `handleDeleteBudgetLogEntry`, `handleUpdateBudgetLogEntry`, `handleToggleBudgetLogBalanceLock`.

## Budget Entry Templates

- **Purpose**: Reusable presets for quick budget log entry creation. Each template stores: name, description, and preset delta values per money source.
- **Components**: `src/components/dashboard/templates-view.tsx` — `TemplatesView`, `TemplateFormDialog`, `AddTemplateButton`. Accessed via `TemplatesManagementDialog` in the dashboard header.
- **State**: Templates stored in `state.templates`, persisted to localStorage.
- **Reducer**: `template-actions.ts` handles `ADD_TEMPLATE`, `UPDATE_TEMPLATE`, `DELETE_TEMPLATE`.

## AI Flows (src/ai)

- Config (`genkit.ts`): `googleai/gemini-2.5-flash` with Google plugin.
- `ai-assisted-budget-updates`: input `description`; output string in `category:amount` format (withdrawal negative). Used by AI Assistant dialog (dispatches `ADD_BUDGET_LOG_ENTRY` with `[AI]` prefix).
- Dev entry (`dev.ts`): loads dotenv, registers the flow.

## UI Landmarks

- `src/app/page.tsx`: wraps dashboard in `BudgetProvider`; sections: Budget Transactions (BudgetLogView), Budget Log (HistoryView), Money Sources, Budget Summary, Analytics, Month Notes.
- Header: `dashboard-header.tsx` — AI Assistant, Templates Management, Import/Export, Help, Month selector. Mobile sidebar includes DialogTitle for accessibility.
- CollapsibleCard: `collapsible-card.tsx` — optional `action` prop for header buttons. Clicking action buttons won't trigger collapse/expand.
- Dialogs: All dialog components use scrollable containers with `max-h-[90vh]` and `overflow-y-auto` on content areas.
- Analytics: collapsible bar chart showing spent amount per money source.
- Budget Month Selector: month/year dropdown that dispatches `SET_CURRENT_MONTH`.
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
