"use client";

import React, { useMemo, useState } from "react";
import { useBudget } from "@/contexts/budget-context";
import { formatCurrency, parseFormattedNumber } from "@/lib/utils";
import { FormattedInput, ClearableInput } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, Play, Lock, LockOpen, Pen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { BudgetLogEntry } from "@/lib/types";
import { formatNumberWithCommas } from "@/lib/utils";

// ─── Inline Add/Edit Entry Form ───────────────────────────────────────────────

interface EntryFormState {
  description: string;
  changes: Record<string, string>; // moneySourceId -> formatted string
}

function AddEntryDialog({
  children,
  entry,
  onClose,
}: {
  children?: React.ReactNode;
  entry?: BudgetLogEntry;
  onClose?: () => void;
}) {
  const { state, dispatch } = useBudget();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const isEditing = !!entry;

  const initialFormState: EntryFormState = {
    description: entry?.description || "",
    changes: Object.fromEntries(
      state.moneySources.map((ms) => [
        ms.id,
        entry?.changes[ms.id]
          ? formatNumberWithCommas(entry.changes[ms.id])
          : "",
      ]),
    ),
  };

  const [form, setForm] = useState<EntryFormState>(initialFormState);

  const resetForm = () => {
    setForm({
      description: "",
      changes: Object.fromEntries(state.moneySources.map((ms) => [ms.id, ""])),
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
      onClose?.();
    }
    if (newOpen && entry) {
      setForm(initialFormState);
    }
  };

  const handleSubmit = () => {
    if (!form.description.trim()) {
      toast({
        title: "Error",
        description: "Please enter a description.",
        variant: "destructive",
      });
      return;
    }

    const changes: Record<string, number> = {};
    let hasAnyChange = false;
    for (const ms of state.moneySources) {
      const raw = form.changes[ms.id] || "";
      const parsed = parseFormattedNumber(raw);
      if (!isNaN(parsed) && parsed !== 0) {
        changes[ms.id] = parsed;
        hasAnyChange = true;
      }
    }

    if (!hasAnyChange) {
      toast({
        title: "Error",
        description: "Please enter at least one budget change.",
        variant: "destructive",
      });
      return;
    }

    if (isEditing && entry) {
      dispatch({
        type: "UPDATE_BUDGET_LOG_ENTRY",
        payload: { id: entry.id, description: form.description, changes },
      });
      toast({ title: "Success", description: "Budget log entry updated." });
    } else {
      dispatch({
        type: "ADD_BUDGET_LOG_ENTRY",
        payload: { description: form.description, changes },
      });
      toast({ title: "Success", description: "Budget log entry added." });
    }

    setOpen(false);
    resetForm();
    onClose?.();
  };

  const handleChangeAmount = (msId: string, value: string) => {
    // Allow digits, commas, decimal point, and leading minus sign
    const raw = value.replace(/,/g, "");
    if (raw === "" || raw === "-" || /^-?\d*\.?\d*$/.test(raw)) {
      setForm((prev) => ({
        ...prev,
        changes: {
          ...prev.changes,
          [msId]: raw === "" || raw === "-" ? raw : formatNumberWithCommas(raw),
        },
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="outline" className="gap-1">
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">New Entry</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Budget Log Entry" : "New Budget Log Entry"}
          </DialogTitle>
          <DialogDescription>
            Enter the budget changes for each money source. Use negative numbers
            for decreases.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="entry-description">Description</Label>
            <ClearableInput
              id="entry-description"
              placeholder="e.g., Transfer to savings"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: (e.target as HTMLInputElement).value,
                }))
              }
              className="mt-1"
            />
          </div>

          <div className="space-y-3">
            <Label>Budget Changes</Label>
            {state.moneySources.map((ms) => (
              <div key={ms.id} className="flex items-center gap-3">
                <span className="text-sm font-medium min-w-[80px] truncate">
                  {ms.name}
                </span>
                <FormattedInput
                  field={{
                    value: form.changes[ms.id] || "",
                    onChange: (val: string) => handleChangeAmount(ms.id, val),
                  }}
                  placeholder="0"
                  showQuickButtons={false}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? "Save Changes" : "Add Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Initialize Budget Log Prompt ─────────────────────────────────────────────

function InitializeBudgetLogPrompt() {
  const { state, dispatch } = useBudget();
  const { toast } = useToast();

  if (state.moneySources.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Add money sources first to start tracking budget changes.</p>
      </div>
    );
  }

  const handleInitialize = () => {
    dispatch({
      type: "INITIALIZE_BUDGET_LOG",
      payload: "Initial budget",
    });
    toast({
      title: "Budget Log Started",
      description: "Initial budgets have been captured.",
    });
  };

  return (
    <div className="text-center py-8 space-y-4">
      <p className="text-muted-foreground">
        Start tracking budget changes to see how your budgets evolve over time.
      </p>
      <Button onClick={handleInitialize} className="gap-2">
        <Play className="h-4 w-4" />
        Start Budget Tracking
      </Button>
    </div>
  );
}

// ─── Edit Current Balances Dialog ─────────────────────────────────────────────

function EditCurrentBalancesDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state, dispatch } = useBudget();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [balances, setBalances] = useState<Record<string, string>>({});

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Initialize with current balance values
      setBalances(
        Object.fromEntries(
          state.moneySources.map((ms) => [
            ms.id,
            formatNumberWithCommas(ms.balance),
          ]),
        ),
      );
    }
  };

  const handleChangeBalance = (msId: string, value: string) => {
    const raw = value.replace(/,/g, "");
    if (raw === "" || raw === "-" || /^-?\d*\.?\d*$/.test(raw)) {
      setBalances((prev) => ({
        ...prev,
        [msId]: raw === "" || raw === "-" ? raw : formatNumberWithCommas(raw),
      }));
    }
  };

  const handleSubmit = () => {
    let hasChange = false;
    for (const ms of state.moneySources) {
      const raw = balances[ms.id] || "";
      const parsed = parseFormattedNumber(raw);
      if (!isNaN(parsed) && parsed !== ms.balance) {
        dispatch({
          type: "ADJUST_BALANCE",
          payload: { moneySourceId: ms.id, newBalance: parsed },
        });
        hasChange = true;
      }
    }
    if (hasChange) {
      toast({ title: "Success", description: "Balances updated." });
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Current Balances</DialogTitle>
          <DialogDescription>
            Adjust the current balance for each money source.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {state.moneySources.map((ms) => {
            const parsed = parseFormattedNumber(balances[ms.id] || "");
            const diff = isNaN(parsed) ? 0 : parsed - ms.balance;
            return (
              <div key={ms.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{ms.name}</span>
                  {diff !== 0 && (
                    <span
                      className={`text-xs font-medium ${
                        diff > 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {diff > 0 ? "+" : ""}
                      {formatCurrency(diff)}
                    </span>
                  )}
                </div>
                <FormattedInput
                  field={{
                    value: balances[ms.id] || "",
                    onChange: (val: string) => handleChangeBalance(ms.id, val),
                  }}
                  placeholder="0"
                  showQuickButtons={false}
                />
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Balances</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Budget Log Table ─────────────────────────────────────────────────────────

function BudgetLogTable() {
  const { state, dispatch } = useBudget();
  const { toast } = useToast();
  const { moneySources, budgetLog } = state;
  const locks = state.budgetLogBalanceLocks || {};

  // Entry pending deletion (for confirmation)
  const [pendingDelete, setPendingDelete] = useState<BudgetLogEntry | null>(
    null,
  );

  // Compute running totals for each entry
  const rows = useMemo(() => {
    const result: Array<{
      type: "initial" | "entry" | "result";
      entry?: BudgetLogEntry;
      totals: Record<string, number>;
    }> = [];

    const runningTotals: Record<string, number> = {};

    for (let i = 0; i < budgetLog.length; i++) {
      const entry = budgetLog[i];

      if (entry.isInitial) {
        // Initial entry: set absolute values
        moneySources.forEach((ms) => {
          runningTotals[ms.id] = entry.changes[ms.id] || 0;
        });
        result.push({
          type: "initial",
          entry,
          totals: { ...runningTotals },
        });
      } else {
        // Delta entry: add to running totals
        result.push({
          type: "entry",
          entry,
          totals: { ...runningTotals }, // totals BEFORE this entry (not used directly)
        });

        // Calculate new running totals
        moneySources.forEach((ms) => {
          runningTotals[ms.id] =
            (runningTotals[ms.id] || 0) + (entry.changes[ms.id] || 0);
        });

        // Add result row
        result.push({
          type: "result",
          totals: { ...runningTotals },
        });
      }
    }

    return result;
  }, [budgetLog, moneySources]);

  const handleDeleteEntry = (entry: BudgetLogEntry) => {
    setPendingDelete(entry);
  };

  const confirmDelete = () => {
    if (pendingDelete) {
      dispatch({
        type: "DELETE_BUDGET_LOG_ENTRY",
        payload: pendingDelete.id,
      });
      toast({ title: "Deleted", description: "Budget log entry removed." });
      setPendingDelete(null);
    }
  };

  const handleToggleLock = (msId: string) => {
    dispatch({ type: "TOGGLE_BUDGET_LOG_BALANCE_LOCK", payload: msId });
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto -mx-6 px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[140px] sticky left-0 bg-background z-10">
                Description
              </TableHead>
              {moneySources.map((ms) => (
                <TableHead key={ms.id} className="text-right min-w-[100px]">
                  {ms.name}
                </TableHead>
              ))}
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, idx) => {
              if (row.type === "initial" && row.entry) {
                return (
                  <TableRow key={row.entry.id} className="bg-muted/30">
                    <TableCell className="font-medium sticky left-0 bg-muted/30 z-10">
                      {row.entry.description}
                    </TableCell>
                    {moneySources.map((ms) => (
                      <TableCell
                        key={ms.id}
                        className="text-right font-semibold text-primary"
                      >
                        {formatCurrency(row.totals[ms.id] || 0)}
                      </TableCell>
                    ))}
                    <TableCell />
                  </TableRow>
                );
              }

              if (row.type === "entry" && row.entry) {
                const entry = row.entry;
                return (
                  <TableRow key={entry.id} className="group">
                    <TableCell className="sticky left-0 bg-background z-10">
                      <span className="text-sm">{entry.description}</span>
                    </TableCell>
                    {moneySources.map((ms) => {
                      const change = entry.changes[ms.id] || 0;
                      if (change === 0) {
                        return (
                          <TableCell
                            key={ms.id}
                            className="text-right text-muted-foreground"
                          >
                            —
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell
                          key={ms.id}
                          className={`text-right font-medium ${
                            change > 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {change > 0 ? "+" : ""}
                          {formatCurrency(change)}
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteEntry(entry)}
                        title="Delete entry"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              }

              if (row.type === "result") {
                return (
                  <TableRow
                    key={`result-${idx}`}
                    className="border-t-2 border-dashed bg-muted/20"
                  >
                    <TableCell className="sticky left-0 bg-muted/20 z-10">
                      <span className="text-xs text-muted-foreground italic">
                        Updated
                      </span>
                    </TableCell>
                    {moneySources.map((ms) => (
                      <TableCell
                        key={ms.id}
                        className="text-right font-bold text-primary"
                      >
                        {formatCurrency(row.totals[ms.id] || 0)}
                      </TableCell>
                    ))}
                    <TableCell />
                  </TableRow>
                );
              }

              return null;
            })}

            {/* ── Current Balance Row ────────────────────────────────── */}
            <TableRow className="border-t-2 bg-blue-50/50 dark:bg-blue-950/20">
              <TableCell className="sticky left-0 bg-blue-50/50 dark:bg-blue-950/20 z-10">
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  Current Balance
                </span>
              </TableCell>
              {moneySources.map((ms) => (
                <TableCell key={ms.id} className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="font-bold text-blue-700 dark:text-blue-300">
                      {formatCurrency(ms.balance)}
                    </span>
                    <button
                      onClick={() => handleToggleLock(ms.id)}
                      className="inline-flex items-center justify-center h-5 w-5 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                      title={
                        locks[ms.id]
                          ? "Balance locked — budget log entries won't affect this balance"
                          : "Balance unlocked — budget log entries will affect this balance"
                      }
                    >
                      {locks[ms.id] ? (
                        <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <LockOpen className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </TableCell>
              ))}
              <TableCell>
                <EditCurrentBalancesDialog>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    title="Edit current balances"
                  >
                    <Pen className="h-3.5 w-3.5" />
                  </Button>
                </EditCurrentBalancesDialog>
              </TableCell>
            </TableRow>

            {/* ── Spent Row ──────────────────────────────────────────── */}
            <TableRow className="bg-red-50/30 dark:bg-red-950/10">
              <TableCell className="sticky left-0 bg-red-50/30 dark:bg-red-950/10 z-10">
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  Spent
                </span>
              </TableCell>
              {moneySources.map((ms) => (
                <TableCell
                  key={ms.id}
                  className="text-right font-medium text-red-600 dark:text-red-400"
                >
                  {formatCurrency(ms.spent)}
                </TableCell>
              ))}
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Add new entry button */}
      <div className="flex justify-start pt-2">
        <AddEntryDialog />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget Log Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{pendingDelete?.description}
              &quot;? This will reverse its budget
              {Object.values(locks).some(Boolean)
                ? " and unlocked balance"
                : " and balance"}{" "}
              changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────

export default function BudgetLogView() {
  const { state } = useBudget();
  const hasInitialEntry = state.budgetLog.some((e) => e.isInitial);

  if (!hasInitialEntry) {
    return <InitializeBudgetLogPrompt />;
  }

  return <BudgetLogTable />;
}

/**
 * Exported button for use in CollapsibleCard action slot.
 */
export function AddBudgetLogEntryButton() {
  const { state } = useBudget();
  const hasInitialEntry = state.budgetLog.some((e) => e.isInitial);

  if (!hasInitialEntry || state.moneySources.length === 0) {
    return null;
  }

  return <AddEntryDialog />;
}
