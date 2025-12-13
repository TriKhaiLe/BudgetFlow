"use client";

import { BudgetProvider } from "@/contexts/budget-context";
import BudgetSummary from "@/components/dashboard/budget-summary";
import MoneySources, {
  AddMoneySourceButton,
} from "@/components/dashboard/money-sources";
import TransactionsView, {
  AddTransactionButton,
} from "@/components/dashboard/transactions-view";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import { Analytics } from "@/components/dashboard/analytics";
import { CollapsibleCard } from "@/components/dashboard/collapsible-card";

export default function Home() {
  return (
    <BudgetProvider>
      <div className="flex min-h-screen w-full flex-col overflow-x-hidden">
        <DashboardHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 overflow-x-hidden">
          <CollapsibleCard
            storageKey="transactions-view-collapsed"
            title="Transactions"
            action={<AddTransactionButton />}
          >
            <TransactionsView />
          </CollapsibleCard>

          <Analytics />

          <CollapsibleCard
            storageKey="budget-summary-collapsed"
            title="Budget Summary"
          >
            <BudgetSummary />
          </CollapsibleCard>

          <CollapsibleCard
            storageKey="money-sources-collapsed"
            title="Money Sources"
            action={<AddMoneySourceButton />}
          >
            <MoneySources />
          </CollapsibleCard>
        </main>
      </div>
    </BudgetProvider>
  );
}
