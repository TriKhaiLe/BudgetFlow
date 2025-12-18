'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { useBudget } from '@/contexts/budget-context';
import { useToast } from '@/hooks/use-toast';
import { aiAssistedBudgetUpdates } from '@/ai/flows/ai-assisted-budget-updates';
import { Loader2, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '../ui/badge';

const aiSchema = z.object({
  description: z.string().min(10, 'Please describe your transaction in more detail.'),
});

type AiSuggestion = {
  category: string;
  amount: number;
  type: 'income' | 'expense';
};

export function AIAssistantDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [suggestion, setSuggestion] = React.useState<AiSuggestion | null>(null);
  const { state, dispatch } = useBudget();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof aiSchema>>({
    resolver: zodResolver(aiSchema),
    defaultValues: { description: '' },
  });

  const confirmForm = useForm({
    defaultValues: { moneySourceId: '' },
  });

  async function onSubmit(values: z.infer<typeof aiSchema>) {
    setIsLoading(true);
    setSuggestion(null);
    try {
      const result = await aiAssistedBudgetUpdates(values);
      const [category, amountStr] = result.suggestedUpdates.split(':');
      const amount = parseFloat(amountStr);

      if (category && !isNaN(amount)) {
        setSuggestion({
          category,
          amount: Math.abs(amount),
          type: amount >= 0 ? 'income' : 'expense',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Uh oh!',
          description: 'The AI could not understand your request. Please try rephrasing it.',
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred while contacting the AI assistant.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  function onConfirm(values: { moneySourceId: string }) {
    if (!suggestion || !values.moneySourceId) return;

    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        description: form.getValues('description'),
        amount: suggestion.amount,
        category: suggestion.category,
        date: new Date().toISOString(),
        moneySourceId: values.moneySourceId,
        type: suggestion.type,
        affectBalance: true,
      },
    });

    toast({ title: 'Success!', description: 'AI-assisted transaction has been added.' });
    setIsOpen(false);
    form.reset();
    setSuggestion(null);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
            form.reset();
            setSuggestion(null);
        }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap flex-shrink-0">
          <Sparkles className="h-4 w-4" />
          <span className="md:hidden">AI Assistant</span>
          <span className="hidden md:inline">AI Assistant</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-[90vw] sm:max-w-lg p-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>AI Assistant</DialogTitle>
          <DialogDescription>
            Describe a transaction in plain English. For example: "I just bought groceries for $78.34" or "Paycheck of $1500 came in".
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto px-4 max-h-[calc(90vh-180px)]">
        {!suggestion && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Type here..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="pt-4">
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ask AI
                </Button>
              </div>
            </form>
          </Form>
        )}

        {suggestion && (
          <Form {...confirmForm}>
            <form onSubmit={confirmForm.handleSubmit(onConfirm)} className="space-y-4 py-4">
                <div className="rounded-lg border bg-card text-card-foreground p-4 space-y-2">
                    <h4 className="font-semibold">AI Suggestion</h4>
                    <div className="flex justify-between items-center">
                        <span>Type:</span>
                        <Badge variant={suggestion.type === 'income' ? 'default' : 'secondary'}>{suggestion.type}</Badge>
                    </div>
                     <div className="flex justify-between items-center">
                        <span>Category:</span>
                        <span className='font-medium'>{suggestion.category}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span>Amount:</span>
                        <span className={`font-medium ${suggestion.type === 'income' ? 'text-green-600' : 'text-destructive'}`}>
                            {suggestion.type === 'income' ? '+' : '-'}{formatCurrency(suggestion.amount)}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground pt-2"><strong>Original:</strong> {form.getValues('description')}</p>
                </div>
                
                <FormField control={confirmForm.control} name="moneySourceId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Apply to which source?</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value} required>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a money source" /></SelectTrigger></FormControl>
                            <SelectContent>
                            {state.moneySources.map(source => <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
              <div className="flex gap-2 pt-4">
                <Button variant="ghost" onClick={() => setSuggestion(null)} className="flex-1">Back</Button>
                <Button type="submit" className="flex-1">Confirm & Add</Button>
              </div>
            </form>
          </Form>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
