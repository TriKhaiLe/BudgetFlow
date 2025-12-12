'use client';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { AIAssistantDialog } from './ai-assistant-dialog';
import { DataManagement } from './data-management';
import { BudgetMonthSelector } from './budget-month-selector';
import { HelpDialog } from './help-dialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Wallet } from 'lucide-react';

export default function DashboardHeader() {
  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Logo />
      </nav>
      
      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <div className="sr-only">
            <h2>Navigation Menu</h2>
            <p>Access AI Assistant, Data Management, and Help options</p>
          </div>
          <nav className="grid gap-6 text-lg font-medium">
            <div
              className='flex items-center gap-2 text-lg font-semibold text-primary'
            >
              <Wallet className="h-6 w-6" />
              <span className="font-bold">BudgetFlow</span>
            </div>
            <div className='flex flex-col gap-4'>
                <AIAssistantDialog />
                <DataManagement />
                <HelpDialog />
            </div>
          </nav>
        </SheetContent>
      </Sheet>
      
      <div className="flex w-full items-center justify-end gap-4">
        <BudgetMonthSelector />
        <div className="hidden md:flex items-center gap-2">
            <AIAssistantDialog />
            <DataManagement />
            <HelpDialog />
        </div>
      </div>
    </header>
  );
}
