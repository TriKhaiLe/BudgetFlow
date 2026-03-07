# **App Name**: BudgetFlow

## Core Features:

- Budget Summary Display: Display total budget, spent amount, and remaining balance with color-coded indicators.
- Money Sources Management: CRUD operations for money sources (e.g., Wallet, Bank Account), including budget, current balance, and amount spent.
- Budget Transactions (Budget Log): The primary budget tracking system. Users initialize tracking to capture a baseline snapshot of all money source budgets. Each subsequent entry records delta changes (positive or negative) per money source. Adding an entry updates both the budget and balance (unless locked) for affected sources. Entries can be edited (description, amounts, timestamp) or deleted (which reverses the changes). The table shows running totals after each entry, current balances with per-source lock/unlock toggles, and spent amounts. A direct "Edit Current Balances" dialog allows manual balance adjustments with auto-entry creation when the new balance exceeds the latest running total.
- Budget Entry Templates: Reusable presets for quickly creating budget log entries. Each template stores a name, description, and preset delta values per money source. Managed via a dialog accessible from the dashboard header.
- Transaction History (Budget Log): Automatically logs all budget or balance operations (money source changes, budget log entries, template operations, data imports, month transitions, etc.) with timestamps and icons in reverse chronological order.
- Data Import/Export: Allow users to export current budget to JSON for saving and share with friends. Provide two importing strategies to re-hydrate all the existing entries or load for creating budgets of subsequent month.
- AI Assistant: Chat interface where users can describe budget changes, and the AI will suggest and automatically apply the appropriate updates within the application, acting as an application agent.

### Deprecated Features (removed):
- ~~Budget Impact Transactions~~: Replaced by Budget Transactions (Budget Log) system above.
- ~~Featured Transactions~~: Removed. Budget log entries now serve as the sole tracking mechanism.
- ~~Category Suggestions~~: The AI flow (`suggest-transaction-categories.ts`) still exists in the codebase but is no longer used by any UI component since transactions were removed.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) to represent trust and financial security.
- Background color: Light gray (#ECEFF1) for a clean and modern look.
- Accent color: Teal (#009688) to highlight key actions and elements.
- Body and headline font: 'Inter' sans-serif for clear, modern text.
- Use 'lucide-react' icons to visually represent different money sources and transaction types.
- Dashboard layout with two columns on larger screens. Tables should be scrollable on smaller devices.
- Subtle transitions for budget updates and transaction entries.