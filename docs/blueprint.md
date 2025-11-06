# **App Name**: BudgetFlow

## Core Features:

- Budget Summary Display: Display total budget, spent amount, and remaining balance with color-coded indicators.
- Money Sources Management: CRUD operations for money sources (e.g., Wallet, Bank Account), including budget, current balance, and amount spent.
- Transaction History: Automatically log all budget or balance updates (e.g. budget allocations and earnings) with timestamps.
- Data Import/Export: Allow users to export current budget to JSON for saving and share with friends. Provide two importing strategies to re-hydrate all the existing entries or load for creating budgets of subsequent month.
- Budget Impact Transactions: Full CRUD operations for transactions that directly impact the budget (salary, saving deposits, etc.).
- Featured Transactions: Log meaningful spent that DON'T AFFECT budget or current balances.
- Category Suggestions: Suggests appropriate categories from previous inputs using LLM tool, for budget impacting and featured transaction entries.
- AI Assistant: Chat interface where users can describe transactions or budget changes, and the AI will suggest and automatically apply the appropriate updates within the application, acting as an application agent.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) to represent trust and financial security.
- Background color: Light gray (#ECEFF1) for a clean and modern look.
- Accent color: Teal (#009688) to highlight key actions and elements.
- Body and headline font: 'Inter' sans-serif for clear, modern text.
- Use 'lucide-react' icons to visually represent different money sources and transaction types.
- Dashboard layout with two columns on larger screens. Tables should be scrollable on smaller devices.
- Subtle transitions for budget updates and transaction entries.