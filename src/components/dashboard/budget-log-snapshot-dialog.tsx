"use client";

import React from "react";
import { format } from "date-fns";
import { useBudget } from "@/contexts/budget-context";
import type { BudgetLogEntry } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Camera, FileText } from "lucide-react";

type DiffStatus = "added" | "removed" | "modified" | "unchanged";

interface DiffRow {
  id: string;
  status: DiffStatus;
  snapshotEntry?: BudgetLogEntry;
  currentEntry?: BudgetLogEntry;
  details: string[];
}

function formatTimestamp(iso?: string): string {
  if (!iso) return "-";
  try {
    return format(new Date(iso), "dd/MM/yyyy HH:mm");
  } catch {
    return "-";
  }
}

function areChangesEqual(
  oldChanges: Record<string, number>,
  newChanges: Record<string, number>,
): boolean {
  const keySet = new Set([
    ...Object.keys(oldChanges),
    ...Object.keys(newChanges),
  ]);
  for (const key of keySet) {
    if ((oldChanges[key] || 0) !== (newChanges[key] || 0)) {
      return false;
    }
  }
  return true;
}

function areEntriesEqual(
  snapshot: BudgetLogEntry,
  current: BudgetLogEntry,
): boolean {
  return (
    snapshot.description === current.description &&
    snapshot.createdAt === current.createdAt &&
    snapshot.isInitial === current.isInitial &&
    areChangesEqual(snapshot.changes, current.changes)
  );
}

function statusBadgeVariant(
  status: DiffStatus,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "added") return "default";
  if (status === "removed") return "destructive";
  if (status === "modified") return "secondary";
  return "outline";
}

function statusLabel(status: DiffStatus): string {
  if (status === "added") return "Added";
  if (status === "removed") return "Removed";
  if (status === "modified") return "Modified";
  return "Unchanged";
}

export function BudgetLogSnapshotActions() {
  const { state, dispatch } = useBudget();
  const { toast } = useToast();

  const snapshot = state.budgetLogSnapshot;
  const currentEntries = state.budgetLog;

  const handleSaveSnapshot = () => {
    if (currentEntries.length === 0) {
      toast({
        title: "Nothing to snapshot",
        description: "Budget Transactions is empty.",
        variant: "destructive",
      });
      return;
    }

    dispatch({ type: "SAVE_BUDGET_LOG_SNAPSHOT" });
    toast({
      title: "Snapshot saved",
      description: `Captured ${currentEntries.length} budget transaction entries.`,
    });
  };

  const diffRows = React.useMemo<DiffRow[]>(() => {
    if (!snapshot) return [];

    const rows: DiffRow[] = [];
    const currentMap = new Map(
      currentEntries.map((entry) => [entry.id, entry]),
    );
    const snapshotMap = new Map(
      snapshot.entries.map((entry) => [entry.id, entry]),
    );

    for (const snapshotEntry of snapshot.entries) {
      const currentEntry = currentMap.get(snapshotEntry.id);
      if (!currentEntry) {
        rows.push({
          id: snapshotEntry.id,
          status: "removed",
          snapshotEntry,
          details: ["Entry no longer exists in current data."],
        });
        continue;
      }

      if (areEntriesEqual(snapshotEntry, currentEntry)) {
        rows.push({
          id: snapshotEntry.id,
          status: "unchanged",
          snapshotEntry,
          currentEntry,
          details: [],
        });
        continue;
      }

      const details: string[] = [];
      if (snapshotEntry.description !== currentEntry.description) {
        details.push(
          `Description: \"${snapshotEntry.description}\" -> \"${currentEntry.description}\"`,
        );
      }

      if (snapshotEntry.createdAt !== currentEntry.createdAt) {
        details.push(
          `Time: ${formatTimestamp(snapshotEntry.createdAt)} -> ${formatTimestamp(currentEntry.createdAt)}`,
        );
      }

      const keySet = new Set([
        ...Object.keys(snapshotEntry.changes),
        ...Object.keys(currentEntry.changes),
      ]);

      for (const key of keySet) {
        const oldValue = snapshotEntry.changes[key] || 0;
        const newValue = currentEntry.changes[key] || 0;
        if (oldValue !== newValue) {
          const sourceName =
            state.moneySources.find((ms) => ms.id === key)?.name || key;
          details.push(
            `${sourceName}: ${formatCurrency(oldValue)} -> ${formatCurrency(newValue)}`,
          );
        }
      }

      rows.push({
        id: snapshotEntry.id,
        status: "modified",
        snapshotEntry,
        currentEntry,
        details,
      });
    }

    for (const currentEntry of currentEntries) {
      if (!snapshotMap.has(currentEntry.id)) {
        rows.push({
          id: currentEntry.id,
          status: "added",
          currentEntry,
          details: ["New entry added after snapshot."],
        });
      }
    }

    return rows.sort((a, b) => {
      const aTime = new Date(
        (a.currentEntry || a.snapshotEntry)?.createdAt || 0,
      ).getTime();
      const bTime = new Date(
        (b.currentEntry || b.snapshotEntry)?.createdAt || 0,
      ).getTime();
      return aTime - bTime;
    });
  }, [snapshot, currentEntries, state.moneySources]);

  const summary = React.useMemo(() => {
    const counts = {
      added: 0,
      removed: 0,
      modified: 0,
      unchanged: 0,
    };

    for (const row of diffRows) {
      counts[row.status] += 1;
    }

    return counts;
  }, [diffRows]);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-2 whitespace-nowrap flex-shrink-0"
        onClick={handleSaveSnapshot}
      >
        <Camera className="h-4 w-4" />
        <span>Save Snapshot</span>
      </Button>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 whitespace-nowrap flex-shrink-0"
          >
            <FileText className="h-4 w-4" />
            <span>Compare Snapshot</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-5xl p-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle>Budget Transactions Snapshot Audit</DialogTitle>
            <DialogDescription>
              Compare current Budget Transactions data against your saved
              snapshot.
            </DialogDescription>
          </DialogHeader>

          {!snapshot ? (
            <div className="px-4 pb-4">
              <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
                No snapshot found yet. Click <strong>Save Snapshot</strong>{" "}
                first.
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto px-4 pb-4 space-y-4 max-h-[calc(90vh-120px)]">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>
                  Snapshot time:{" "}
                  <strong>{formatTimestamp(snapshot.createdAt)}</strong>
                </span>
                <span>•</span>
                <span>
                  Entries captured: <strong>{snapshot.entryCount}</strong>
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Added: {summary.added}</Badge>
                <Badge variant="destructive">Removed: {summary.removed}</Badge>
                <Badge variant="secondary">Modified: {summary.modified}</Badge>
                <Badge variant="outline">Unchanged: {summary.unchanged}</Badge>
              </div>

              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[170px]">Time</TableHead>
                      <TableHead className="min-w-[220px]">
                        Description
                      </TableHead>
                      <TableHead className="min-w-[320px]">
                        Detected Changes
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diffRows.length > 0 ? (
                      diffRows.map((row) => {
                        const baseEntry = row.currentEntry || row.snapshotEntry;
                        return (
                          <TableRow key={`${row.status}-${row.id}`}>
                            <TableCell>
                              <Badge variant={statusBadgeVariant(row.status)}>
                                {statusLabel(row.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatTimestamp(baseEntry?.createdAt)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {baseEntry?.description || "-"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground align-top">
                              {row.details.length > 0
                                ? row.details.join("; ")
                                : "No differences"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-6 text-muted-foreground"
                        >
                          No entries to compare.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
