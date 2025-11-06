'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBudget } from '@/contexts/budget-context';
import type { Transaction, FeaturedTransaction } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Trash, MoreHorizontal, Loader2, Sparkles, Pen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { suggestTransactionCategories } from '@/ai/flows/suggest-transaction-categories';
import { Badge } from '../ui/badge';

const transactionSchema = z.object({
  description: z.string().min(2, 'Description is required.'),
  amount: z.coerce.number().refine(n => n !== 0, 'Amount cannot be zero.'),
  category: z.string().min(2, 'Category is required.'),
  moneySourceId: z.string().min(1, 'Please select a money source.'),
});

const featuredTransactionSchema = z.object({
    description: z.string().min(2, "Description is required."),
    category: z.string().min(2, "Category is required."),
});


function AddTransactionDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { state, dispatch } = useBudget();
  const { toast } = useToast();

  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = React.useState(false);

  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { description: '', amount: 0, category: '', moneySourceId: '' },
  });

  const description = form.watch('description');

  React.useEffect(() => {
    const handleCategorySuggestion = async () => {
      if (description && description.length > 3) {
        setIsSuggesting(true);
        try {
          const result = await suggestTransactionCategories({ description });
          setSuggestions(result.categories);
        } catch (error) {
          console.error("Failed to get category suggestions:", error);
        } finally {
          setIsSuggesting(false);
        }
      } else {
        setSuggestions([]);
      }
    };

    const debounce = setTimeout(handleCategorySuggestion, 500);
    return () => clearTimeout(debounce);
  }, [description]);


  function onSubmit(values: z.infer<typeof transactionSchema>) {
    dispatch({ type: 'ADD_TRANSACTION', payload: values });
    toast({ title: 'Success', description: 'Transaction added.' });
    form.reset();
    setSuggestions([]);
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Transaction</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>Log an income or expense that affects your budget.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Input placeholder="e.g., Salary or Groceries" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="-55.50" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="moneySourceId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Money Source</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a source" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {state.moneySources.map(source => <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl><Input placeholder="e.g., Food" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              {isSuggesting && <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Thinking...</div>}
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <div className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><Sparkles className="w-4 h-4 text-primary" /> Suggestions:</div>
                  {suggestions.map(s => <Button key={s} size="sm" variant="outline" onClick={() => form.setValue('category', s)}>{s}</Button>)}
                </div>
              )}
            <DialogFooter>
              <Button type="submit">Add Transaction</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AddFeaturedTransactionDialog() {
    const [isOpen, setIsOpen] = React.useState(false);
    const { dispatch } = useBudget();
    const { toast } = useToast();
    const form = useForm<z.infer<typeof featuredTransactionSchema>>({
        resolver: zodResolver(featuredTransactionSchema),
        defaultValues: { description: '', category: '' },
    });

    function onSubmit(values: z.infer<typeof featuredTransactionSchema>) {
        dispatch({ type: 'ADD_FEATURED_TRANSACTION', payload: values });
        toast({ title: "Success", description: "Featured transaction logged." });
        form.reset();
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Log Featured Spend</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Log Featured Spend</DialogTitle>
                    <DialogDescription>Log a meaningful spend that doesn't affect your budget.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl><Input placeholder="e.g., Coffee with a friend" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="category" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <FormControl><Input placeholder="e.g., Social" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="submit">Log Spend</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function TransactionsView() {
  const { state, dispatch } = useBudget();
  const { toast } = useToast();

  const handleDeleteTransaction = (transaction: Transaction) => {
    if (confirm(`Are you sure you want to delete this transaction?`)) {
      dispatch({ type: 'DELETE_TRANSACTION', payload: transaction });
      toast({ title: 'Deleted', description: 'Transaction has been deleted.' });
    }
  }

  const handleDeleteFeatured = (id: string) => {
    if (confirm(`Are you sure you want to delete this featured transaction?`)) {
      dispatch({ type: 'DELETE_FEATURED_TRANSACTION', payload: id });
      toast({ title: 'Deleted', description: 'Featured transaction has been deleted.' });
    }
  }

  return (
    <Tabs defaultValue="transactions">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
            <AddFeaturedTransactionDialog />
            <AddTransactionDialog />
        </div>
      </div>
      <TabsContent value="transactions">
        <Card>
          <CardHeader>
            <CardTitle>Budget Transactions</CardTitle>
            <CardDescription>Income and expenses that impact your budget.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.transactions.length > 0 ? (
                    state.transactions.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.description}</TableCell>
                        <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
                        <TableCell>{state.moneySources.find(ms => ms.id === t.moneySourceId)?.name || 'N/A'}</TableCell>
                        <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                        <TableCell className={`text-right ${t.amount > 0 ? 'text-green-600' : 'text-destructive'}`}>
                          {formatCurrency(t.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTransaction(t)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No transactions yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="featured">
         <Card>
           <CardHeader>
             <CardTitle>Featured Spends</CardTitle>
             <CardDescription>Meaningful transactions that don't affect your budget balance.</CardDescription>
           </CardHeader>
           <CardContent>
            <div className="overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.featuredTransactions.length > 0 ? (
                    state.featuredTransactions.map(ft => (
                      <TableRow key={ft.id}>
                        <TableCell className="font-medium">{ft.description}</TableCell>
                        <TableCell><Badge variant="secondary">{ft.category}</Badge></TableCell>
                        <TableCell>{new Date(ft.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteFeatured(ft.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No featured spends yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
             </div>
           </CardContent>
         </Card>
       </TabsContent>
      <TabsContent value="history">
        <Card>
          <CardHeader>
            <CardTitle>History Log</CardTitle>
            <CardDescription>An automatic log of all activities in your budget.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.history.slice().reverse().map(log => (
                    <TableRow key={log.id}>
                      <TableCell>{log.description}</TableCell>
                      <TableCell className="text-right">{new Date(log.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
