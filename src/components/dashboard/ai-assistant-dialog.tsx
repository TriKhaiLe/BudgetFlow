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
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const aiSchema = z.object({
  description: z.string().min(10, 'Please describe your transaction in more detail.'),
});

type AiSuggestion = {
  category: string;
  amount: number;
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
        setSuggestion({ category, amount });
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
        moneySourceId: values.moneySourceId,
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
        <Button variant="outline" className="gap-1">
          <Sparkles className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">AI Assistant</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Assistant</DialogTitle>
          <DialogDescription>
            Describe a transaction in plain English. For example: "I just bought groceries for $78.34" or "Paycheck of $1500 came in".
          </DialogDescription>
        </DialogHeader>

        {!suggestion && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ask AI
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {suggestion && (
          <Form {...confirmForm}>
            <form onSubmit={confirmForm.handleSubmit(onConfirm)} className="space-y-4">
                <div className="rounded-lg border bg-card text-card-foreground p-4 space-y-2">
                    <h4 className="font-semibold">AI Suggestion</h4>
                    <p><strong>Category:</strong> {suggestion.category}</p>
                    <p><strong>Amount:</strong> {suggestion.amount}</p>
                    <p><strong>Description:</strong> {form.getValues('description')}</p>
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

              <DialogFooter>
                <Button variant="ghost" onClick={() => setSuggestion(null)}>Back</Button>
                <Button type="submit">Confirm & Add</Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
