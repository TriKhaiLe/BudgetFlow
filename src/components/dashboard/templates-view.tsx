"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBudget } from "@/contexts/budget-context";
import type { TransactionTemplate } from "@/lib/types";
import {
  formatCurrency,
  parseFormattedNumber,
  getCategoryColor,
} from "@/lib/utils";
import { CATEGORY_SUGGESTIONS } from "@/lib/constants";
import {
  transactionTemplateSchema,
  type TransactionTemplateFormValues,
} from "@/lib/schemas";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Trash, Edit, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "../ui/badge";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Combobox } from "../ui/combobox";
import { Switch } from "../ui/switch";
import { ScrollArea } from "../ui/scroll-area";

interface TemplateFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  template?: TransactionTemplate | null;
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

  const defaultMoneySourceId =
    state.moneySources.length > 0 ? state.moneySources[0].id : "";
  const isEditing = !!template;

  const form = useForm<TransactionTemplateFormValues>({
    resolver: zodResolver(transactionTemplateSchema),
    defaultValues: template
      ? {
          name: template.name,
          description: template.description,
          amount: template.amount.toString(),
          category: template.category,
          moneySourceId: template.moneySourceId,
          targetMoneySourceId: template.targetMoneySourceId || "",
          type: template.type,
          affectBalance: template.affectBalance,
        }
      : {
          name: "",
          description: "",
          amount: "",
          category: "",
          moneySourceId: defaultMoneySourceId,
          targetMoneySourceId: "",
          type: "withdraw",
          affectBalance: true,
        },
  });

  // Watch the type field to auto-select category for transfers
  const watchedType = form.watch("type");

  React.useEffect(() => {
    if (isOpen) {
      if (template) {
        form.reset({
          name: template.name,
          description: template.description,
          amount: template.amount.toString(),
          category: template.category,
          moneySourceId: template.moneySourceId,
          targetMoneySourceId: template.targetMoneySourceId || "",
          type: template.type,
          affectBalance: template.affectBalance,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          amount: "",
          category: "",
          moneySourceId: defaultMoneySourceId,
          targetMoneySourceId: "",
          type: "withdraw",
          affectBalance: true,
        });
      }
    }
  }, [isOpen, template, form, defaultMoneySourceId]);

  // Auto-select 'transfer' category when type changes to transfer
  React.useEffect(() => {
    if (watchedType === "transfer") {
      form.setValue("category", "transfer");
    }
  }, [watchedType, form]);

  function onSubmit(values: TransactionTemplateFormValues) {
    if (isEditing && template) {
      dispatch({
        type: "UPDATE_TEMPLATE",
        payload: {
          id: template.id,
          name: values.name,
          description: values.description || "",
          amount: parseFormattedNumber(values.amount),
          category: values.category || "",
          moneySourceId: values.moneySourceId,
          targetMoneySourceId:
            values.type === "transfer" ? values.targetMoneySourceId : undefined,
          type: values.type,
          affectBalance: values.affectBalance,
        },
      });
      toast({ title: "Success", description: "Template updated." });
    } else {
      dispatch({
        type: "ADD_TEMPLATE",
        payload: {
          name: values.name,
          description: values.description || "",
          amount: parseFormattedNumber(values.amount),
          category: values.category || "",
          moneySourceId: values.moneySourceId,
          targetMoneySourceId:
            values.type === "transfer" ? values.targetMoneySourceId : undefined,
          type: values.type,
          affectBalance: values.affectBalance,
        },
      });
      toast({ title: "Success", description: "Template created." });
    }
    form.reset();
    onOpenChange(false);
    onSubmitCallback?.();
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          form.reset();
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="w-full max-w-[90vw] sm:max-w-xl p-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>
            {isEditing ? "Edit Template" : "Create Template"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your transaction template."
              : "Create a reusable template for quick transaction entry."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col"
          >
            <div className="overflow-y-auto px-4 space-y-4 max-h-[calc(90vh-180px)]">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name *</FormLabel>
                    <FormControl>
                      <ClearableInput
                        placeholder="e.g., Monthly Rent"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Transaction Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-wrap gap-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="income" />
                          </FormControl>
                          <FormLabel className="font-normal">Income</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="withdraw" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Withdraw
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="transfer" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Transfer
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <ClearableInput
                        placeholder="e.g., Salary or Groceries"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <FormattedInput field={field} placeholder="55" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="moneySourceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {watchedType === "transfer"
                          ? "From (Source)"
                          : "Money Source"}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {state.moneySources.map((source) => (
                            <SelectItem key={source.id} value={source.id}>
                              {source.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchedType === "transfer" && (
                <FormField
                  control={form.control}
                  name="targetMoneySourceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To (Target)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select target source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {state.moneySources
                            .filter(
                              (source) =>
                                source.id !== form.getValues("moneySourceId")
                            )
                            .map((source) => (
                              <SelectItem key={source.id} value={source.id}>
                                {source.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Category</FormLabel>
                    <Combobox
                      options={[...CATEGORY_SUGGESTIONS]}
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Select or type..."
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="affectBalance"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Update Balance</FormLabel>
                      <FormDescription>
                        Toggle whether transactions from this template affect
                        the money source balance.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="px-4 pb-4 pt-4 border-t">
              <Button type="submit">
                {isEditing ? "Update Template" : "Create Template"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AddTemplateDialog() {
  const [isOpen, setIsOpen] = React.useState(false);

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

export default function TemplatesView() {
  const { state, dispatch } = useBudget();
  const { toast } = useToast();
  const [editingTemplate, setEditingTemplate] =
    React.useState<TransactionTemplate | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const handleDeleteTemplate = (template: TransactionTemplate) => {
    if (
      confirm(
        `Are you sure you want to delete the template "${template.name}"?`
      )
    ) {
      dispatch({ type: "DELETE_TEMPLATE", payload: template.id });
      toast({ title: "Deleted", description: "Template has been deleted." });
    }
  };

  const handleEditTemplate = (template: TransactionTemplate) => {
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
              <TableHead>Category</TableHead>
              <TableHead className="hidden sm:table-cell">Source</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.transactionTemplates.length > 0 ? (
              state.transactionTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground hidden sm:block" />
                      <span>{template.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {template.description || "-"}
                  </TableCell>
                  <TableCell>
                    {template.category ? (
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: getCategoryColor(template.category),
                        }}
                      >
                        {template.category}
                      </Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {state.moneySources.find(
                      (ms) => ms.id === template.moneySourceId
                    )?.name || "N/A"}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      template.type === "income"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {template.type === "income" ? "+" : "-"}
                    {formatCurrency(template.amount)}
                  </TableCell>
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
                <TableCell colSpan={6} className="h-24 text-center">
                  No templates yet. Create one to speed up transaction entry.
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
