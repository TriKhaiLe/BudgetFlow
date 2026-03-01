"use client";

import React from "react";
import { useBudget } from "@/contexts/budget-context";
import { getHistoryIconConfig } from "@/lib/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Displays the centralized activity history log for the entire app.
 * Shows all budget operations (money source changes, budget log entries,
 * template operations, data imports, month transitions, etc.) in reverse
 * chronological order.
 */
export default function HistoryView() {
  const { state } = useBudget();

  if (state.history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>
          No activity yet. Start by adding money sources and budget entries.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Description</TableHead>
            <TableHead className="text-right min-w-[140px]">
              Timestamp
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.history
            .slice()
            .reverse()
            .map((log) => {
              const iconConfig = getHistoryIconConfig(log.description);
              const Icon = iconConfig.icon;
              return (
                <TableRow key={log.id}>
                  <TableCell>
                    <Icon className={`h-4 w-4 ${iconConfig.color}`} />
                  </TableCell>
                  <TableCell className="text-sm">{log.description}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
}
