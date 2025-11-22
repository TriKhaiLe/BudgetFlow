'use client';

import { useBudget } from '@/contexts/budget-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, PiggyBank, ReceiptText } from 'lucide-react';
import React from 'react';

export default function BudgetSummary() {
  const { state } = useBudget();

  const summary = React.useMemo(() => {
    const totalBudget = state.moneySources.reduce((sum, s) => sum + s.budget, 0);
    const totalSpent = state.moneySources.reduce((sum, s) => sum + s.spent, 0);
    const remaining = totalBudget - totalSpent;
    const percentageSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    return { totalBudget, totalSpent, remaining, percentageSpent };
  }, [state.moneySources]);

  return (
    <div className="sm:grid sm:grid-cols-2 sm:gap-4 xl:grid-cols-1 2xl:grid-cols-3">
      <div className="sm:contents">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalBudget)}</div>
            <p className="text-xs text-muted-foreground">Total allocated budget across all sources</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spent</CardTitle>
            <ReceiptText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(summary.totalSpent)}</div>
             <Progress value={summary.percentageSpent} className="mt-2 h-2" />
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className={`text-2xl font-bold ${summary.remaining < 0 ? 'text-destructive' : 'text-primary'}`}>{formatCurrency(summary.remaining)}</div>
            <p className="text-xs text-muted-foreground">{summary.percentageSpent.toFixed(0)}% of budget spent</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
