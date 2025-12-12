'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QuestionCircle } from '../ui/question-circle';
import { ScrollArea } from '../ui/scroll-area';

export function HelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <QuestionCircle className="h-5 w-5" />
          <span className="sr-only">Help</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-[90vw] sm:max-w-2xl p-4">
        <DialogHeader>
          <DialogTitle>BudgetFlow Guide</DialogTitle>
          <DialogDescription>
            Here’s a quick guide to help you get the most out of the app.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="font-semibold text-primary mb-2">1. Money Sources</h3>
              <p>
                This is where your money lives (e.g., Bank Account, Wallet, Credit Card). Each source has a{' '}
                <strong className="text-blue-600">Balance</strong> (how much is in it now) and a{' '}
                <strong className="text-green-600">Budget</strong> (how much you plan to spend from it this month).
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  <strong className="font-medium">Update Balance:</strong> Use the Pen icon (<span className="inline-block h-4 w-4 i-lucide-pen" />) to directly set the current balance. The app logs this as a balance adjustment.
                </li>
                <li>
                  <strong className="font-medium">Edit Details:</strong> Use the "More" menu (<span className="inline-block h-4 w-4 i-lucide-more-horizontal" />) to change a source's name or planned budget.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-primary mb-2">2. Transactions</h3>
              <p>
                Transactions are the core of your budget. You can add an <strong className="text-green-600">Income</strong> or an <strong className="text-red-600">Expense</strong>.
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  An <strong className="font-medium">Expense</strong> will increase your <strong className="text-red-600">"Spent"</strong> amount for the month.
                </li>
                <li>
                  An <strong className="font-medium">Income</strong> will increase the <strong className="text-green-600">"Budget"</strong> for that source, giving you more to spend.
                </li>
                <li>
                  <strong className="font-medium">Update Balance Toggle:</strong> When adding a transaction, this switch (on by default) controls if the transaction also changes the source's <strong className="text-blue-600">Balance</strong>. Turn it off for transactions that are already reflected in your bank account balance but you still want to track against your budget.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-primary mb-2">3. AI Assistant</h3>
              <p>
                Use the AI Assistant (<span className="inline-block h-4 w-4 i-lucide-sparkles" />) to quickly add transactions by just describing them in plain English, like "I paid $50 for gas" or "got my $2,000 paycheck".
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold text-primary mb-2">4. Data Management</h3>
              <p>
                Use the <strong className="font-medium">Import/Export</strong> buttons to back up your data or move it between devices.
              </p>
               <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  <strong className="font-medium">Replace Everything:</strong> Overwrites all current data with the file's content.
                </li>
                <li>
                  <strong className="font-medium">Start Next Month:</strong> Resets your spending and transactions but keeps your money sources. The final balances from the imported file become the starting budgets for the new month.
                </li>
              </ul>
            </section>

             <section>
              <h3 className="font-semibold text-primary mb-2">5. Month Selector</h3>
              <p>
                Use the date picker in the header to view and manage your budget for different months. All data you see and export is tied to the selected month.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
