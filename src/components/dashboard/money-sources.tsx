'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBudget } from '@/contexts/budget-context';
import type { MoneySource } from '@/lib/types';
import { formatCurrency, formatNumberWithCommas, parseFormattedNumber } from '@/lib/utils';
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
import { MoreHorizontal, PlusCircle, Trash, Pen, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';

const moneySourceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  budget: z.string().refine(value => !isNaN(parseFormattedNumber(value)) && parseFormattedNumber(value) > 0, {
    message: "Budget must be a positive number.",
  }),
  balance: z.string().refine(value => !isNaN(parseFormattedNumber(value)), {
    message: "Balance must be a valid number.",
  }),
});


function FormattedInput({ field, placeholder }: { field: any, placeholder?: string }) {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/,/g, '');
      if (!isNaN(Number(rawValue))) {
        field.onChange(formatNumberWithCommas(rawValue));
      }
    };
  
    return <Input placeholder={placeholder} {...field} onChange={handleInputChange} />;
}

function MoneySourceForm({
  source,
  onFinished,
}: {
  source?: MoneySource;
  onFinished: () => void;
}) {
  const { dispatch } = useBudget();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof moneySourceSchema>>({
    resolver: zodResolver(moneySourceSchema),
    defaultValues: {
      name: source?.name || '',
      budget: source ? formatNumberWithCommas(source.budget) : '0',
      balance: source ? formatNumberWithCommas(source.balance) : '0',
    },
  });

  function onSubmit(values: z.infer<typeof moneySourceSchema>) {
    const numericValues = {
        name: values.name,
        budget: parseFormattedNumber(values.budget),
        balance: parseFormattedNumber(values.balance),
    }

    if (source) {
      dispatch({ type: 'UPDATE_MONEY_SOURCE', payload: { ...source, ...numericValues } });
      toast({ title: 'Success', description: 'Money source updated.' });
    } else {
      dispatch({ type: 'ADD_MONEY_SOURCE', payload: numericValues });
      toast({ title: 'Success', description: 'Money source added.' });
    }
    onFinished();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Wallet" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Budget</FormLabel>
                <FormControl>
                  <FormattedInput field={field} placeholder="500" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Balance</FormLabel>
                <FormControl>
                  <FormattedInput field={field} placeholder="1,200" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <DialogFooter>
          <Button type="submit">{source ? 'Save Changes' : 'Add Source'}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function AddEditMoneySourceDialog({
  source,
  children,
}: {
  source?: MoneySource;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{source ? 'Edit' : 'Add'} Money Source</DialogTitle>
          <DialogDescription>
            {source ? 'Update' : 'Create'} a source of funds like a bank account or wallet.
          </DialogDescription>
        </DialogHeader>
        <MoneySourceForm source={source} onFinished={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

const updateBalanceSchema = z.object({
    newBalance: z.string().refine(val => !isNaN(parseFormattedNumber(val)), {
        message: "Please enter a valid number.",
    }),
});

function UpdateBalanceDialog({ source }: { source: MoneySource }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const { dispatch } = useBudget();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof updateBalanceSchema>>({
        resolver: zodResolver(updateBalanceSchema),
        defaultValues: { newBalance: formatNumberWithCommas(source.balance) }
    });
    
    const newBalanceValue = form.watch('newBalance');
    const parsedNewBalance = parseFormattedNumber(newBalanceValue);
    const difference = parsedNewBalance - source.balance;

    function onSubmit(values: z.infer<typeof updateBalanceSchema>) {
        const newBalance = parseFormattedNumber(values.newBalance);
        dispatch({
            type: 'ADJUST_BALANCE',
            payload: {
                moneySourceId: source.id,
                newBalance,
                oldBalance: source.balance,
                sourceName: source.name
            }
        });
        toast({ title: 'Success', description: `${source.name} balance updated.`});
        setIsOpen(false);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Edit className="mr-2 h-4 w-4" /> Update Balance
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Balance for {source.name}</DialogTitle>
                    <DialogDescription>
                        Directly set the new balance for this money source. This will be logged in your history.
                    </DialogDescription>
                </DialogHeader>
                 <div className="grid grid-cols-2 gap-4 py-4 text-center">
                    <div>
                        <p className="text-sm text-muted-foreground">Before</p>
                        <p className="font-bold text-lg">{formatCurrency(source.balance)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">After</p>
                        <p className="font-bold text-lg">{formatCurrency(isNaN(parsedNewBalance) ? source.balance : parsedNewBalance)}</p>
                    </div>
                </div>
                 <div className="py-2 text-center">
                    <p className="text-sm text-muted-foreground">Difference</p>
                    <Badge variant={difference === 0 ? "outline" : difference > 0 ? "default" : "destructive"} className="text-lg">
                      {difference > 0 ? '+' : ''}{formatCurrency(isNaN(difference) ? 0 : difference)}
                    </Badge>
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="newBalance" render={({ field }) => (
                            <FormItem>
                                <FormLabel>New Balance</FormLabel>
                                <FormControl>
                                    <FormattedInput field={field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="submit">Confirm Update</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default function MoneySources() {
  const { state, dispatch } = useBudget();
  const { toast } = useToast();

  const handleDelete = (source: MoneySource) => {
    if (confirm(`Are you sure you want to delete ${source.name}? This will remove all associated transactions.`)) {
      dispatch({ type: 'DELETE_MONEY_SOURCE', payload: source.id });
      toast({ title: 'Deleted', description: `${source.name} has been deleted.` });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
            <CardTitle>Money Sources</CardTitle>
            <CardDescription>Manage your financial accounts and wallets.</CardDescription>
        </div>
        <div className="ml-auto">
            <AddEditMoneySourceDialog>
                <Button size="sm" className="gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Source</span>
                </Button>
            </AddEditMoneySourceDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-[250px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.moneySources.length > 0 ? (
                state.moneySources.map(source => (
                  <TableRow key={source.id}>
                    <TableCell className="font-medium">{source.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(source.budget)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(source.spent)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(source.balance)}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <AddEditMoneySourceDialog source={source}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Pen className="mr-2 h-4 w-4" /> Edit Source
                                    </DropdownMenuItem>
                                </AddEditMoneySourceDialog>
                                <UpdateBalanceDialog source={source} />
                                <DropdownMenuItem onClick={() => handleDelete(source)} className="text-destructive">
                                    <Trash className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No money sources yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
