"use client";

import React from "react";
import { useBudget } from "@/contexts/budget-context";
import type { BudgetLogTemplate } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Edit, Trash, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TemplateFormDialog } from "./templates-view";

export function TemplatesManagementDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] =
    React.useState<BudgetLogTemplate | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const { state, dispatch } = useBudget();
  const { toast } = useToast();

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
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 whitespace-nowrap flex-shrink-0"
          >
            <FileText className="h-4 w-4" />
            <span>Templates</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="w-full max-w-[90vw] sm:max-w-4xl p-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="px-4 pt-4 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1">
                <DialogTitle>Budget Entry Templates</DialogTitle>
                <DialogDescription>
                  Manage your reusable budget entry templates for quick entry.
                </DialogDescription>
              </div>
              <Button
                size="sm"
                className="gap-1 shrink-0 w-full sm:w-auto"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Add Template</span>
              </Button>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto px-4 pb-4 max-h-[calc(90vh-180px)]">
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
        </DialogContent>
      </Dialog>

      {/* Add Template Dialog */}
      <TemplateFormDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      {/* Edit Template Dialog */}
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
