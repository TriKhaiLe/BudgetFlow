# **App Name**: BudgetFlow

## Core Features:

- Budget Summary Display: Display total budget, spent amount, and remaining balance with color-coded indicators.
- Money Sources Management: CRUD operations for money sources (e.g., Wallet, Bank Account), including budget, current balance, and amount spent.
- Budget Transactions (Budget Log): The primary budget tracking system. Users initialize tracking to capture a baseline snapshot of all money source budgets. Each subsequent entry records delta changes (positive or negative) per money source. Adding an entry updates both the budget and balance (unless locked) for affected sources. Entries can be edited (description, amounts, timestamp) or deleted (which reverses the changes). The table shows running totals after each entry, current balances with per-source lock/unlock toggles, and spent amounts. A direct "Edit Current Balances" dialog allows manual balance adjustments with auto-entry creation when the new balance exceeds the latest running total.
- Budget Entry Templates: Reusable presets for quickly creating budget log entries. Each template stores a name, description, and preset delta values per money source. Managed via a dialog accessible from the dashboard header.
- Transaction History (Budget Log): Automatically logs all budget or balance operations (money source changes, budget log entries, template operations, data imports, month transitions, etc.) with timestamps and icons in reverse chronological order.
- Data Import/Export: Allow users to export current budget to JSON for saving and share with friends. Provide two importing strategies to re-hydrate all the existing entries or load for creating budgets of subsequent month.
- AI Assistant: Chat interface where users can describe budget changes in plain English, and the AI will parse them into budget log entries. The AI determines the category and amount (income vs. expense), then the user selects which money source to apply it to. The entry is added to the Budget Transactions table with an `[AI]` prefix.

### AI Assistant Use Cases:

| Use Case | Example Input | AI Output | Result |
|----------|---------------|-----------|--------|
| Log an expense | "I bought groceries for $78.34" | `groceries:-78.34` | -$78.34 applied to selected source |
| Record income | "Received salary of $3000" | `income:3000` | +$3,000 applied to selected source |
| Log a withdrawal | "ATM withdrawal of $200" | `withdrawal:-200` | -$200 applied to selected source |
| Track a payment | "Paid electricity bill $120.50" | `utilities:-120.50` | -$120.50 applied to selected source |
| Record earnings | "Freelance payment of $500 received" | `freelance:500` | +$500 applied to selected source |
| Log dining expense | "Dinner with friends cost $65" | `dining:-65` | -$65 applied to selected source |
| Track subscription | "Netflix monthly subscription $15.99" | `entertainment:-15.99` | -$15.99 applied to selected source |
| Log transfer context | "Sent rent payment $1200" | `housing:-1200` | -$1,200 applied to selected source |

**Flow**: User describes change → AI returns `category:amount` → User reviews suggestion (type, category, amount) → User selects money source → Confirm & Add → Budget log entry created with `[AI]` prefix.

### Deprecated Features (removed):
- ~~Budget Impact Transactions~~: Replaced by Budget Transactions (Budget Log) system above.
- ~~Featured Transactions~~: Removed. Budget log entries now serve as the sole tracking mechanism.
- ~~Category Suggestions~~: AI flow removed (`suggest-transaction-categories.ts` deleted). Was unused since transactions were removed.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) to represent trust and financial security.
- Background color: Light gray (#ECEFF1) for a clean and modern look.
- Accent color: Teal (#009688) to highlight key actions and elements.
- Body and headline font: 'Inter' sans-serif for clear, modern text.
- Use 'lucide-react' icons to visually represent different money sources and transaction types.
- Dashboard layout with two columns on larger screens. Tables should be scrollable on smaller devices.
- Subtle transitions for budget updates and transaction entries.