'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { useBudget } from '@/contexts/budget-context';
import { getCategoryColor } from '@/lib/utils';
import type { ChartConfig } from '@/components/ui/chart';

export function Analytics() {
  const { state } = useBudget();

  const { chartData, chartConfig } = React.useMemo(() => {
    const expenseByCategory: { [key: string]: number } = {};

    state.transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      });

    const chartData = Object.entries(expenseByCategory).map(([category, amount]) => ({
      category,
      amount,
      fill: getCategoryColor(category),
    }));

    const chartConfig: ChartConfig = {};
    chartData.forEach(item => {
        chartConfig[item.category] = {
            label: item.category,
        }
    });

    return { chartData, chartConfig };
  }, [state.transactions]);

  if (chartData.length === 0) {
      return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Breakdown</CardTitle>
        <CardDescription>
          A visual breakdown of your spending by category for the current month.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="amount" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
