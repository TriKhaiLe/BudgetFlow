'use client';

import { BudgetProvider } from '@/contexts/budget-context';
import BudgetSummary from '@/components/dashboard/budget-summary';
import MoneySources from '@/components/dashboard/money-sources';
import TransactionsView from '@/components/dashboard/transactions-view';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import { Analytics } from '@/components/dashboard/analytics';

export default function Home() {
  return (
    <BudgetProvider>
      <div className="flex min-h-screen w-full flex-col">
        <DashboardHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-1 xl:grid-cols-2">
            <BudgetSummary />
            <MoneySources />
          </div>
          <Analytics />
          <TransactionsView />
        </main>
      </div>
    </BudgetProvider>
  );
}
