"use client";

import React from "react";
import { useBudget } from "@/contexts/budget-context";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, addMonths } from "date-fns";

export function StartNewMonthButton() {
  const { state, dispatch } = useBudget();
  const { toast } = useToast();

  const handleStartNewMonth = () => {
    dispatch({ type: "START_NEW_MONTH" });

    const currentDate = new Date(state.currentMonth);
    const nextMonth = addMonths(currentDate, 1);

    toast({
      title: "New Month Started",
      description: `Moved to ${format(
        nextMonth,
        "MMMM yyyy"
      )}. Current balances set as budget for new month.`,
    });
  };

  const currentDate = new Date(state.currentMonth);
  const nextMonth = addMonths(currentDate, 1);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="whitespace-nowrap flex-shrink-0">
          <CalendarPlus className="h-4 w-4 mr-2" />
          New Month
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Start New Month?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>This action will:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                Move to <strong>{format(nextMonth, "MMMM yyyy")}</strong>
              </li>
              <li>Use current balances as budget for new month</li>
              <li>Reset all spending to 0</li>
              <li>
                Clear all transactions, featured transactions, and history
              </li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3">
              <strong>Note:</strong> Current balances will be logged to history
              before moving to the new month.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleStartNewMonth}>
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
