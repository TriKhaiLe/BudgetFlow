"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBudget } from "@/contexts/budget-context";
import type { Transaction, FeaturedTransaction } from "@/lib/types";
import {
  formatCurrency,
  parseFormattedNumber,
  getCategoryColor,
} from "@/lib/utils";
import { CATEGORY_SUGGESTIONS, getHistoryIconConfig } from "@/lib/constants";
import {
  transactionSchema,
  featuredTransactionSchema,
  type TransactionFormValues,
  type FeaturedTransactionFormValues,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlusCircle,
  Trash,
  History,
  CalendarIcon,
  X,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "../ui/badge";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Combobox } from "../ui/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";
import { Switch } from "../ui/switch";
import { TemplateFormDialog } from "./templates-view";
import type { TransactionTemplate } from "@/lib/types";
import { FileText, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ScrollArea } from "../ui/scroll-area";

function AddTransactionDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = React.useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = React.useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = React.useState(false);
  const [templateName, setTemplateName] = React.useState("");
  const { state, dispatch } = useBudget();
  const { toast } = useToast();

  const defaultMoneySourceId =
    state.moneySources.length > 0 ? state.moneySources[0].id : "";

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      moneySourceId: defaultMoneySourceId,
      type: "income",
      date: new Date(),
      affectBalance: true,
    },
  });

  React.useEffect(() => {
    if (state.moneySources.length > 0 && !form.getValues("moneySourceId")) {
      form.setValue("moneySourceId", state.moneySources[0].id);
    }
  }, [state.moneySources, form]);

  const applyTemplate = (template: TransactionTemplate) => {
    form.setValue("description", template.description);
    form.setValue("amount", template.amount.toString());
    form.setValue("category", template.category);
    form.setValue("type", template.type);
    form.setValue("affectBalance", template.affectBalance);

    // Check if the money source still exists
    const moneySourceExists = state.moneySources.some(
      (ms) => ms.id === template.moneySourceId
    );
    if (moneySourceExists) {
      form.setValue("moneySourceId", template.moneySourceId);
    } else {
      toast({
        title: "Warning",
        description:
          "Original money source not found. Please select a money source.",
        variant: "destructive",
      });
    }

    // Close the dropdown menu
    setIsTemplateMenuOpen(false);
  };

  function onSubmit(values: TransactionFormValues) {
    // Add the transaction
    dispatch({
      type: "ADD_TRANSACTION",
      payload: {
        description: values.description || "",
        amount: parseFormattedNumber(values.amount),
        category: values.category || "Uncategorized",
        date: values.date.toISOString(),
        type: values.type,
        moneySourceId: values.moneySourceId,
        affectBalance: values.affectBalance,
      },
    });

    // If save as template is checked, create a template
    if (saveAsTemplate && templateName.trim()) {
      dispatch({
        type: "ADD_TEMPLATE",
        payload: {
          name: templateName.trim(),
          description: values.description || "",
          amount: parseFormattedNumber(values.amount),
          category: values.category || "",
          moneySourceId: values.moneySourceId,
          type: values.type,
          affectBalance: values.affectBalance,
        },
      });
      toast({
        title: "Success",
        description: "Transaction added and template created.",
      });
    } else {
      toast({ title: "Success", description: "Transaction added." });
    }

    form.reset({
      description: "",
      amount: "",
      category: "",
      moneySourceId: defaultMoneySourceId,
      type: "income",
      date: new Date(),
      affectBalance: true,
    });
    setSaveAsTemplate(false);
    setTemplateName("");
    setIsOpen(false);
  }

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            form.reset({
              description: "",
              amount: "",
              category: "",
              moneySourceId: defaultMoneySourceId,
              type: "income",
              date: new Date(),
              affectBalance: true,
            });
            setSaveAsTemplate(false);
            setTemplateName("");
          }
          setIsOpen(open);
        }}
      >
        <DialogTrigger asChild>
          <Button size="sm" className="h-8 gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Add Transaction
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="w-full max-w-[90vw] sm:max-w-xl p-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="px-4 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <DialogTitle>Add Transaction</DialogTitle>
                <DialogDescription>
                  Log an income or withdrawal that affects your budget.
                </DialogDescription>
              </div>
              <DropdownMenu
                open={isTemplateMenuOpen}
                onOpenChange={setIsTemplateMenuOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 w-full sm:w-auto"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Use Template</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="max-h-[200px] overflow-y-auto">
                    {state.transactionTemplates.length > 0 ? (
                      state.transactionTemplates.map((template) => (
                        <DropdownMenuItem
                          key={template.id}
                          onClick={() => applyTemplate(template)}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{template.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {template.type === "income" ? "+" : "-"}
                              {formatCurrency(template.amount)}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>
                        No templates available
                      </DropdownMenuItem>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setIsTemplateDialogOpen(true)}
                    className="cursor-pointer"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create New Template
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setIsTemplateMenuOpen(false)}
                    className="cursor-pointer"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Close
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col"
            >
              <div className="overflow-y-auto px-4 space-y-4 max-h-[calc(90vh-180px)]">
                <div className="space-y-4 pt-4">
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
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="income" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Income
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="withdraw" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Withdraw
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
                          <FormLabel>Money Source</FormLabel>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Transaction Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() ||
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="affectBalance"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Update Balance</FormLabel>
                          <FormDescription>
                            Toggle whether this transaction affects the money
                            source balance.
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

                  {/* Save as Template Option */}
                  <div className="rounded-lg border p-3 shadow-sm space-y-3">
                    <div className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Save as Template</FormLabel>
                        <FormDescription>
                          Create a reusable template from this transaction.
                        </FormDescription>
                      </div>
                      <Switch
                        checked={saveAsTemplate}
                        onCheckedChange={setSaveAsTemplate}
                      />
                    </div>
                    {saveAsTemplate && (
                      <div>
                        <FormLabel>Template Name *</FormLabel>
                        <ClearableInput
                          placeholder="e.g., Monthly Rent Payment"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          onClear={() => setTemplateName("")}
                          className="mt-2"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter className="px-4 pb-4 pt-4 border-t">
                <Button
                  type="submit"
                  disabled={saveAsTemplate && !templateName.trim()}
                >
                  Add Transaction
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Template creation dialog - opens on top of the transaction dialog */}
      <TemplateFormDialog
        isOpen={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
      />
    </>
  );
}

function AddFeaturedTransactionDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { dispatch } = useBudget();
  const { toast } = useToast();
  const form = useForm<FeaturedTransactionFormValues>({
    resolver: zodResolver(featuredTransactionSchema),
    defaultValues: { description: "", category: "", amount: "" },
  });

  function onSubmit(values: FeaturedTransactionFormValues) {
    dispatch({
      type: "ADD_FEATURED_TRANSACTION",
      payload: {
        description: values.description || "",
        category: values.category,
        amount: parseFormattedNumber(values.amount),
      },
    });
    toast({ title: "Success", description: "Featured transaction logged." });
    form.reset();
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Log Featured Spend
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-[90vw] sm:max-w-md p-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Log Featured Spend</DialogTitle>
          <DialogDescription>
            Log a meaningful spend that doesn't affect your budget.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col"
          >
            <div className="overflow-y-auto px-4 space-y-4 py-4 max-h-[calc(90vh-180px)]">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <ClearableInput
                        placeholder="e.g., Coffee with a friend"
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
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <ClearableInput placeholder="e.g., Social" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <FormattedInput field={field} placeholder="15" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter className="px-4 pb-4 pt-4">
              <Button type="submit">Log Spend</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Helper to render history icons based on log description.
 * Uses centralized config from constants.
 */
function getHistoryIcon(description: string) {
  const config = getHistoryIconConfig(description);
  const IconComponent = config.icon;
  return <IconComponent className={`h-4 w-4 ${config.color}`} />;
}

export function AddTransactionButton() {
  return <AddTransactionDialog />;
}

export default function TransactionsView() {
  const { state, dispatch } = useBudget();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState("transactions");

  const handleDeleteTransaction = (transaction: Transaction) => {
    if (confirm(`Are you sure you want to delete this transaction?`)) {
      dispatch({ type: "DELETE_TRANSACTION", payload: transaction });
      toast({ title: "Deleted", description: "Transaction has been deleted." });
    }
  };

  const handleDeleteFeatured = (id: string) => {
    if (confirm(`Are you sure you want to delete this featured transaction?`)) {
      dispatch({ type: "DELETE_FEATURED_TRANSACTION", payload: id });
      toast({
        title: "Deleted",
        description: "Featured transaction has been deleted.",
      });
    }
  };

  return (
    <Tabs
      defaultValue="transactions"
      className="w-full"
      onValueChange={setActiveTab}
    >
      <div className="flex justify-between items-center gap-2 mb-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <div className="flex gap-2">
          {activeTab === "transactions" && <AddTransactionDialog />}
          {activeTab === "featured" && <AddFeaturedTransactionDialog />}
        </div>
      </div>
      <TabsContent value="transactions">
        <div className="overflow-auto max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Update Balance</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.transactions.length > 0 ? (
                state.transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      {t.description}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: getCategoryColor(t.category),
                        }}
                      >
                        {t.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {state.moneySources.find(
                        (ms) => ms.id === t.moneySourceId
                      )?.name || "N/A"}
                    </TableCell>
                    <TableCell>
                      {new Date(t.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          t.affectBalance !== false ? "default" : "secondary"
                        }
                      >
                        {t.affectBalance !== false ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        t.type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {t.snapshot && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Info className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm">
                                  Transaction Snapshot
                                </h4>
                                <div className="text-sm space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Budget Before:
                                    </span>
                                    <span>
                                      {formatCurrency(t.snapshot.budgetBefore)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Budget After:
                                    </span>
                                    <span>
                                      {formatCurrency(t.snapshot.budgetAfter)}
                                    </span>
                                  </div>
                                  <div className="border-t my-1" />
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Balance Before:
                                    </span>
                                    <span>
                                      {formatCurrency(t.snapshot.balanceBefore)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Balance After:
                                    </span>
                                    <span>
                                      {formatCurrency(t.snapshot.balanceAfter)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTransaction(t)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
      <TabsContent value="featured">
        <div className="overflow-auto max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.featuredTransactions.length > 0 ? (
                state.featuredTransactions.map((ft) => (
                  <TableRow key={ft.id}>
                    <TableCell className="font-medium">
                      {ft.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ft.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(ft.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(ft.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteFeatured(ft.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No featured spends yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
      <TabsContent value="history">
        <div className="overflow-auto max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <span className="sr-only">Icon</span>
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.history
                .slice()
                .reverse()
                .map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{getHistoryIcon(log.description)}</TableCell>
                    <TableCell>{log.description}</TableCell>
                    <TableCell className="text-right">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  );
}
