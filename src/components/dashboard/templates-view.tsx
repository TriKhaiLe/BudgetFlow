"use client";

import React, { useState } from "react";
import { useBudget } from "@/contexts/budget-context";
import type { BudgetLogTemplate } from "@/lib/types";
import {
  formatCurrency,
  parseFormattedNumber,
  formatNumberWithCommas,
} from "@/lib/utils";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash, Edit, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Template Form Dialog ─────────────────────────────────────────────────────

interface TemplateFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  template?: BudgetLogTemplate | null;
  onSubmitCallback?: () => void;
}

export function TemplateFormDialog({
  isOpen,
  onOpenChange,
  template = null,
  onSubmitCallback,
}: TemplateFormDialogProps) {
  const { state, dispatch } = useBudget();
  const { toast } = useToast();
  const isEditing = !!template;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [changes, setChanges] = useState<Record<string, string>>({});

  // Sync form when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      if (template) {
        setName(template.name);
        setDescription(template.description);
        setChanges(
          Object.fromEntries(
            state.moneySources.map((ms) => [
              ms.id,
              template.changes[ms.id]
                ? formatNumberWithCommas(template.changes[ms.id])
                : "",
            ]),
          ),
        );
      } else {
        setName("");
        setDescription("");
        setChanges(
          Object.fromEntries(state.moneySources.map((ms) => [ms.id, ""])),
        );
      }
    }
  }, [isOpen, template, state.moneySources]);

  const handleChangeAmount = (msId: string, value: string) => {
    const raw = value.replace(/,/g, "");
    if (raw === "" || raw === "-" || /^-?\d*\.?\d*$/.test(raw)) {
      setChanges((prev) => ({
        ...prev,
        [msId]: raw === "" || raw === "-" ? raw : formatNumberWithCommas(raw),
      }));
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a template name.",
        variant: "destructive",
      });
      return;
    }

    const parsedChanges: Record<string, number> = {};
    let hasAnyChange = false;
    for (const ms of state.moneySources) {
      const raw = changes[ms.id] || "";
      const parsed = parseFormattedNumber(raw);
      if (!isNaN(parsed) && parsed !== 0) {
        parsedChanges[ms.id] = parsed;
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

    if (isEditing && template) {
      dispatch({
        type: "UPDATE_TEMPLATE",
        payload: {
          id: template.id,
          name: name.trim(),
          description: description.trim(),
          changes: parsedChanges,
        },
      });
      toast({ title: "Success", description: "Template updated." });
    } else {
      dispatch({
        type: "ADD_TEMPLATE",
        payload: {
          name: name.trim(),
          description: description.trim(),
          changes: parsedChanges,
        },
      });
      toast({ title: "Success", description: "Template created." });
    }

    onOpenChange(false);
    onSubmitCallback?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Template" : "Create Template"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your budget entry template."
              : "Create a reusable template for quick budget log entry."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-y-auto">
          <div>
            <Label htmlFor="template-name">Template Name *</Label>
            <ClearableInput
              id="template-name"
              placeholder="e.g., Weekly transfer"
              value={name}
              onChange={(e) => setName((e.target as HTMLInputElement).value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="template-description">Description</Label>
            <ClearableInput
              id="template-description"
              placeholder="e.g., Transfer to savings"
              value={description}
              onChange={(e) =>
                setDescription((e.target as HTMLInputElement).value)
              }
              className="mt-1"
            />
          </div>

          <div className="space-y-3">
            <Label>Budget Changes per Money Source</Label>
            {state.moneySources.map((ms) => (
              <div key={ms.id} className="flex items-center gap-3">
                <span className="text-sm font-medium min-w-[80px] truncate">
                  {ms.name}
                </span>
                <FormattedInput
                  field={{
                    value: changes[ms.id] || "",
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? "Update Template" : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Template Button ──────────────────────────────────────────────────────

function AddTemplateDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button size="sm" className="h-8 gap-1" onClick={() => setIsOpen(true)}>
        <PlusCircle className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
          Add Template
        </span>
      </Button>
      <TemplateFormDialog isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}

export function AddTemplateButton() {
  return <AddTemplateDialog />;
}

// ─── Templates View (table) ──────────────────────────────────────────────────

export default function TemplatesView() {
  const { state, dispatch } = useBudget();
  const { toast } = useToast();
  const [editingTemplate, setEditingTemplate] =
    useState<BudgetLogTemplate | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleDeleteTemplate = (template: BudgetLogTemplate) => {
    if (
      confirm(
        `Are you sure you want to delete the template "${template.name}"?`,
      )
    ) {
      dispatch({ type: "DELETE_TEMPLATE", payload: template.id });
      toast({ title: "Deleted", description: "Template has been deleted." });
    }
  };

  const handleEditTemplate = (template: BudgetLogTemplate) => {
    setEditingTemplate(template);
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <div className="overflow-auto max-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">
                Description
              </TableHead>
              {state.moneySources.map((ms) => (
                <TableHead key={ms.id} className="text-right min-w-[80px]">
                  {ms.name}
                </TableHead>
              ))}
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.templates.length > 0 ? (
              state.templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground hidden sm:block" />
                      <span>{template.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {template.description || "—"}
                  </TableCell>
                  {state.moneySources.map((ms) => {
                    const change = template.changes[ms.id] || 0;
                    return (
                      <TableCell
                        key={ms.id}
                        className={`text-right text-sm ${
                          change > 0
                            ? "text-green-600 dark:text-green-400"
                            : change < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground/40"
                        }`}
                      >
                        {change === 0
                          ? "—"
                          : `${change > 0 ? "+" : ""}${formatCurrency(change)}`}
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTemplate(template)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={state.moneySources.length + 3}
                  className="h-24 text-center"
                >
                  No templates yet. Create one to speed up budget entry.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TemplateFormDialog
        isOpen={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingTemplate(null);
        }}
        template={editingTemplate}
      />
    </>
  );
}
