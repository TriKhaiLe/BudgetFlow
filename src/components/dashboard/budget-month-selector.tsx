'use client';

import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useBudget } from '@/contexts/budget-context';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';

export function BudgetMonthSelector() {
  const { state, dispatch } = useBudget();
  const [isOpen, setIsOpen] = React.useState(false);
  const budgetDate = state.currentMonth ? new Date(state.currentMonth) : null;

  const handleMonthChange = (monthStr: string) => {
    if (!budgetDate) return;
    const newDate = new Date(budgetDate);
    newDate.setMonth(parseInt(monthStr, 10));
    dispatch({ type: 'SET_CURRENT_MONTH', payload: newDate });
  };
  
  const handleYearChange = (yearStr: string) => {
      if (!budgetDate) return;
      const newDate = new Date(budgetDate);
      newDate.setFullYear(parseInt(yearStr, 10));
      dispatch({ type: 'SET_CURRENT_MONTH', payload: newDate });
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);


  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-[200px] justify-start text-left font-normal',
            !budgetDate && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {budgetDate ? format(budgetDate, 'MMMM yyyy') : <span>Pick a month</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {budgetDate && (
            <div className="p-2 flex justify-around">
                <Select onValueChange={handleMonthChange} value={budgetDate.getMonth().toString()}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                        {Array.from({length: 12}).map((_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                                {format(new Date(0, i), 'MMMM')}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select onValueChange={handleYearChange} value={budgetDate.getFullYear().toString()}>
                    <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map(year => (
                            <SelectItem key={year} value={year.toString()}>
                                {year}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
