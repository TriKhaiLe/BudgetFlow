"use client";

import React, { useMemo, useState, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, Play, Lock, LockOpen, Pen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { BudgetLogEntry } from "@/lib/types";
import { formatNumberWithCommas } from "@/lib/utils";
import { format } from "date-fns";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  try {
    return format(new Date(iso), "dd/MM HH:mm");
  } catch {
    return "—";
  }
}

// ─── Add/Edit Entry Dialog (popup, reverted from inline) ─────────────────────

interface EntryFormState {
  description: string;
  createdAt: string;
  changes: Record<string, string>;
}

function toDateTimeLocalValue(iso?: string): string {
  try {
    return format(iso ? new Date(iso) : new Date(), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return format(new Date(), "yyyy-MM-dd'T'HH:mm");
  }
}

function toIsoFromDateTimeLocal(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

function AddEntryDialog({
  children,
  entry,
  onClose,
  externalOpen,
  onExternalOpenChange,
}: {
  children?: React.ReactNode;
  entry?: BudgetLogEntry;
  onClose?: () => void;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}) {
  const { state, dispatch } = useBudget();
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const isEditing = !!entry;

  // Use external open state if provided (for programmatic opening)
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onExternalOpenChange || setInternalOpen;

  const initialFormState: EntryFormState = {
    description: entry?.description || "",
    createdAt: toDateTimeLocalValue(entry?.createdAt),
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

  // Sync form state when entry changes or dialog opens
  React.useEffect(() => {
    if (open && entry) {
      setForm({
        description: entry.description || "",
        createdAt: toDateTimeLocalValue(entry.createdAt),
        changes: Object.fromEntries(
          state.moneySources.map((ms) => [
            ms.id,
            entry.changes[ms.id]
              ? formatNumberWithCommas(entry.changes[ms.id])
              : "",
          ]),
        ),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entry?.id]);

  const resetForm = () => {
    setForm({
      description: "",
      createdAt: toDateTimeLocalValue(),
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
    if (newOpen && !entry) {
      resetForm();
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

    const createdAt = toIsoFromDateTimeLocal(form.createdAt);

    if (isEditing && entry) {
      dispatch({
        type: "UPDATE_BUDGET_LOG_ENTRY",
        payload: {
          id: entry.id,
          description: form.description,
          changes,
          createdAt,
        },
      });
      toast({ title: "Success", description: "Budget log entry updated." });
    } else {
      dispatch({
        type: "ADD_BUDGET_LOG_ENTRY",
        payload: { description: form.description, changes, createdAt },
      });
      toast({ title: "Success", description: "Budget log entry added." });
    }

    setOpen(false);
    resetForm();
    onClose?.();
  };

  const handleChangeAmount = (msId: string, value: string) => {
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
      {externalOpen === undefined && (
        <DialogTrigger asChild>
          {children || (
            <Button size="sm" variant="outline" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">New Entry</span>
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Budget Log Entry" : "New Budget Log Entry"}
          </DialogTitle>
          <DialogDescription>
            Enter the budget changes for each money source. Use negative numbers
            for decreases.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-y-auto">
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

          <div>
            <Label htmlFor="entry-created-at">Transaction Date</Label>
            <Input
              id="entry-created-at"
              type="datetime-local"
              value={form.createdAt}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, createdAt: e.target.value }))
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
                  showQuickButtons={true}
                  quickButtonValues={["00", "000"]}
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

// ─── Edit Current Balances Dialog (popup, reverted from inline) ───────────────

function EditCurrentBalancesDialog({
  children,
  onAutoEntry,
}: {
  children: React.ReactNode;
  onAutoEntry?: () => void;
}) {
  const { state, dispatch } = useBudget();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [balances, setBalances] = useState<Record<string, string>>({});

  // Compute latest Updated totals for auto-entry (Task 8)
  const latestUpdatedTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    state.moneySources.forEach((ms) => {
      totals[ms.id] = 0;
    });
    for (const entry of state.budgetLog) {
      if (entry.isInitial) {
        state.moneySources.forEach((ms) => {
          totals[ms.id] = entry.changes[ms.id] || 0;
        });
      } else {
        state.moneySources.forEach((ms) => {
          totals[ms.id] = (totals[ms.id] || 0) + (entry.changes[ms.id] || 0);
        });
      }
    }
    return totals;
  }, [state.budgetLog, state.moneySources]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
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
    // Task 8: Auto-add budget log entry if new balance > latest Updated
    const autoChanges: Record<string, number> = {};
    let hasAutoChange = false;

    for (const ms of state.moneySources) {
      const parsed = parseFormattedNumber(balances[ms.id] || "");
      const newBal = isNaN(parsed) ? ms.balance : parsed;
      const latestUpdated = latestUpdatedTotals[ms.id] || 0;
      if (newBal > latestUpdated) {
        autoChanges[ms.id] = newBal - latestUpdated;
        hasAutoChange = true;
      }
    }

    if (hasAutoChange) {
      dispatch({
        type: "ADD_BUDGET_LOG_ENTRY",
        payload: {
          description: "Balance adjustment (auto)",
          changes: autoChanges,
        },
      });
    }

    // Update each balance that changed
    let hasChange = false;
    for (const ms of state.moneySources) {
      const parsed = parseFormattedNumber(balances[ms.id] || "");
      const newBal = isNaN(parsed) ? ms.balance : parsed;
      if (newBal !== ms.balance) {
        dispatch({
          type: "ADJUST_BALANCE",
          payload: { moneySourceId: ms.id, newBalance: newBal },
        });
        hasChange = true;
      }
    }

    if (hasChange || hasAutoChange) {
      toast({ title: "Success", description: "Balances updated." });
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Current Balances</DialogTitle>
          <DialogDescription>
            Adjust the current balance for each money source.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 overflow-y-auto">
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
                  showQuickButtons={true}
                  quickButtonValues={["00", "000"]}
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

  // Editing entry (for popup dialog)
  const [editingEntry, setEditingEntry] = useState<BudgetLogEntry | null>(null);

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
        moneySources.forEach((ms) => {
          runningTotals[ms.id] = entry.changes[ms.id] || 0;
        });
        result.push({
          type: "initial",
          entry,
          totals: { ...runningTotals },
        });
      } else {
        result.push({
          type: "entry",
          entry,
          totals: { ...runningTotals },
        });

        moneySources.forEach((ms) => {
          runningTotals[ms.id] =
            (runningTotals[ms.id] || 0) + (entry.changes[ms.id] || 0);
        });

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

  // ─── Timestamp editing ─────────────────────────────────────────────────────
  const [editingTimestamp, setEditingTimestamp] = useState<{
    entryId: string;
    value: string;
  } | null>(null);

  const handleTimestampEdit = (entry: BudgetLogEntry) => {
    try {
      const d = new Date(entry.createdAt);
      const local = format(d, "yyyy-MM-dd'T'HH:mm");
      setEditingTimestamp({ entryId: entry.id, value: local });
    } catch {
      setEditingTimestamp({ entryId: entry.id, value: "" });
    }
  };

  const handleTimestampSave = (entryId: string, value: string) => {
    if (value) {
      const newDate = new Date(value).toISOString();
      const entry = budgetLog.find((e) => e.id === entryId);
      if (entry) {
        dispatch({
          type: "UPDATE_BUDGET_LOG_ENTRY",
          payload: {
            id: entry.id,
            description: entry.description,
            changes: entry.changes,
            createdAt: newDate,
          },
        });
      }
    }
    setEditingTimestamp(null);
  };

  return (
    <div className="space-y-0">
      <div className="overflow-x-auto -mx-6 px-6">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Time column (Task 3) — NOT sticky on mobile (Task 13) */}
              <TableHead className="min-w-[80px] text-xs">Time</TableHead>
              <TableHead className="min-w-[140px]">Description</TableHead>
              {moneySources.map((ms) => (
                <TableHead key={ms.id} className="text-right min-w-[100px]">
                  {ms.name}
                </TableHead>
              ))}
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, idx) => {
              if (row.type === "initial" && row.entry) {
                return (
                  <TableRow key={row.entry.id} className="bg-muted/30">
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTimestamp(row.entry.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {row.entry.description}
                    </TableCell>
                    {moneySources.map((ms) => (
                      <TableCell
                        key={ms.id}
                        className="text-right font-medium text-primary"
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
                    {/* Editable timestamp (Task 3) */}
                    <TableCell>
                      {editingTimestamp?.entryId === entry.id ? (
                        <Input
                          type="datetime-local"
                          value={editingTimestamp.value}
                          onChange={(e) =>
                            setEditingTimestamp({
                              entryId: entry.id,
                              value: e.target.value,
                            })
                          }
                          onBlur={() =>
                            handleTimestampSave(
                              entry.id,
                              editingTimestamp.value,
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleTimestampSave(
                                entry.id,
                                editingTimestamp.value,
                              );
                            if (e.key === "Escape") setEditingTimestamp(null);
                          }}
                          className="h-7 text-xs w-[140px]"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => handleTimestampEdit(entry)}
                          className="text-xs text-muted-foreground hover:text-foreground cursor-pointer hover:underline"
                          title="Click to edit timestamp"
                        >
                          {formatTimestamp(entry.createdAt)}
                        </button>
                      )}
                    </TableCell>
                    {/* Description — click to open edit dialog */}
                    <TableCell>
                      <button
                        onClick={() => setEditingEntry(entry)}
                        className="text-sm hover:underline cursor-pointer text-left"
                        title="Click to edit"
                      >
                        {entry.description}
                      </button>
                    </TableCell>
                    {/* Task 4+10: Lighter, less bold colors for transactions */}
                    {moneySources.map((ms) => {
                      const change = entry.changes[ms.id] || 0;
                      if (change === 0) {
                        return (
                          <TableCell
                            key={ms.id}
                            className="text-right text-muted-foreground/40"
                          >
                            —
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell
                          key={ms.id}
                          className={`text-right text-sm ${
                            change > 0
                              ? "text-green-600/50 dark:text-green-400/50"
                              : "text-red-600/50 dark:text-red-400/50"
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

              {
                /* Task 7: "Updated" label */
              }
              if (row.type === "result") {
                return (
                  <TableRow
                    key={`result-${idx}`}
                    className="border-t-2 border-dashed bg-muted/20"
                  >
                    <TableCell />
                    <TableCell>
                      <span className="text-xs text-muted-foreground italic">
                        Updated
                      </span>
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

              return null;
            })}

            {/* Task 5+14: Spacing row with "New Entry" button, left-aligned */}
            <TableRow className="border-none hover:bg-transparent">
              <TableCell colSpan={moneySources.length + 3} className="py-3">
                <AddEntryDialog />
              </TableCell>
            </TableRow>

            {/* ── Current Balance Row ────────────────────────────── */}
            <TableRow className="border-t-2 bg-blue-50/50 dark:bg-blue-950/20">
              <TableCell className="bg-blue-50/50 dark:bg-blue-950/20" />
              <TableCell className="bg-blue-50/50 dark:bg-blue-950/20">
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  Current Balance
                </span>
              </TableCell>
              {moneySources.map((ms) => (
                <TableCell key={ms.id} className="text-right">
                  {/* Task 2: Lock icon on the left of the number */}
                  <div className="flex items-center justify-end gap-1">
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
                    <span className="font-bold text-blue-700 dark:text-blue-300">
                      {formatCurrency(ms.balance)}
                    </span>
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

            {/* ── Spent Row ──────────────────────────────────────── */}
            <TableRow className="bg-red-50/30 dark:bg-red-950/10">
              <TableCell className="bg-red-50/30 dark:bg-red-950/10" />
              <TableCell className="bg-red-50/30 dark:bg-red-950/10">
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

      {/* Edit entry dialog (opened when clicking description) */}
      <AddEntryDialog
        entry={editingEntry || undefined}
        externalOpen={!!editingEntry}
        onExternalOpenChange={(open) => {
          if (!open) setEditingEntry(null);
        }}
        onClose={() => setEditingEntry(null)}
      />

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
 * The add button is now inside the table, so this returns null.
 */
export function AddBudgetLogEntryButton() {
  return null;
}
