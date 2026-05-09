"use client";

import { BudgetProvider } from "@/contexts/budget-context";
import BudgetSummary from "@/components/dashboard/budget-summary";
import MoneySources, {
  AddMoneySourceButton,
} from "@/components/dashboard/money-sources";
import BudgetLogView, {
  AddBudgetLogEntryButton,
} from "@/components/dashboard/budget-log-view";
import HistoryView from "@/components/dashboard/history-view";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import { Analytics } from "@/components/dashboard/analytics";
import { CollapsibleCard } from "@/components/dashboard/collapsible-card";
import { MonthDescription } from "@/components/dashboard/month-description";
import { AuthProvider } from "@/contexts/auth-context";

export default function Home() {
  return (
    <AuthProvider>
      <BudgetProvider>
        <div className="flex min-h-screen w-full flex-col overflow-x-hidden">
          <DashboardHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 overflow-x-hidden">
            <CollapsibleCard
              storageKey="budget-log-collapsed"
              title="Budget Transactions"
              action={<AddBudgetLogEntryButton />}
            >
              <BudgetLogView />
            </CollapsibleCard>

            <CollapsibleCard
              storageKey="transactions-view-collapsed"
              title="Budget Log"
            >
              <HistoryView />
            </CollapsibleCard>

            <CollapsibleCard
              storageKey="money-sources-collapsed"
              title="Money Sources"
              action={<AddMoneySourceButton />}
            >
              <MoneySources />
            </CollapsibleCard>

            <CollapsibleCard
              storageKey="budget-summary-collapsed"
              title="Budget Summary"
            >
              <BudgetSummary />
            </CollapsibleCard>

            <Analytics />

            <CollapsibleCard
              storageKey="month-description-collapsed"
              title="Month Notes"
            >
              <MonthDescription />
            </CollapsibleCard>
          </main>
        </div>
      </BudgetProvider>
    </AuthProvider>
  );
}
