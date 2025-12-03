'use client';

import { BudgetProvider } from '@/contexts/budget-context';
import BudgetSummary from '@/components/dashboard/budget-summary';
import MoneySources from '@/components/dashboard/money-sources';
import TransactionsView from '@/components/dashboard/transactions-view';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import { Analytics } from '@/components/dashboard/analytics';
import { CollapsibleCard } from '@/components/dashboard/collapsible-card';

export default function Home() {
  return (
    <BudgetProvider>
      <div className="flex min-h-screen w-full flex-col">
        <DashboardHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <CollapsibleCard
            storageKey="budget-summary-collapsed"
            title="Budget Summary"
            description="A quick overview of your budget, spending, and remaining funds for the month."
          >
            <BudgetSummary />
          </CollapsibleCard>

          <Analytics />

          <CollapsibleCard
            storageKey="transactions-view-collapsed"
            title="Transactions"
            description="Manage your income, expenses, and historical log."
          >
            <TransactionsView />
          </CollapsibleCard>
          
          <CollapsibleCard
            storageKey="money-sources-collapsed"
            title="Money Sources"
            description="Manage your financial accounts and wallets."
          >
            <MoneySources />
          </CollapsibleCard>

        </main>
      </div>
    </BudgetProvider>
  );
}
