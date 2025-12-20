"use client";

import React from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { useBudget } from "@/contexts/budget-context";
import { getCategoryColor } from "@/lib/utils";
import type { ChartConfig } from "@/components/ui/chart";
import { CollapsibleCard } from "./collapsible-card";

export function Analytics() {
  const { state } = useBudget();

  const { chartData, chartConfig } = React.useMemo(() => {
    const chartData = state.moneySources.map((ms) => ({
      name: ms.name,
      spent: ms.spent,
      fill: getCategoryColor(ms.name),
    }));

    const chartConfig: ChartConfig = {};
    chartData.forEach((item) => {
      chartConfig[item.name] = {
        label: item.name,
      };
    });

    return { chartData, chartConfig };
  }, [state.moneySources]);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <CollapsibleCard
      title="Spending Overview"
      storageKey="spending-overview-open"
    >
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="spent" radius={4} />
        </BarChart>
      </ChartContainer>
    </CollapsibleCard>
  );
}
