"use client";

import React from "react";
import { useBudget } from "@/contexts/budget-context";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

export function MonthDescription() {
  const { state, dispatch } = useBudget();
  const [localDescription, setLocalDescription] = React.useState(
    state.monthDescription || ""
  );
  const [showSavedIcon, setShowSavedIcon] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  // Update local state when global state changes (e.g., after import or month change)
  React.useEffect(() => {
    setLocalDescription(state.monthDescription || "");
  }, [state.monthDescription]);

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setLocalDescription(value);
    setShowSavedIcon(false);
  };

  const handleBlur = () => {
    if (localDescription !== state.monthDescription) {
      dispatch({
        type: "UPDATE_MONTH_DESCRIPTION",
        payload: localDescription,
      });

      setShowSavedIcon(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setShowSavedIcon(false);
      }, 3000);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="month-description">Notes for this month</Label>
        {showSavedIcon && (
          <div className="flex items-center gap-1.5 text-green-600 dark:text-green-500 animate-in fade-in-0 duration-200">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Saved</span>
          </div>
        )}
      </div>
      <Textarea
        id="month-description"
        placeholder="Add any notes or reminders for this month..."
        value={localDescription}
        onChange={handleDescriptionChange}
        onBlur={handleBlur}
        className="min-h-[100px] resize-y"
      />
      <p className="text-xs text-muted-foreground">
        Changes are saved automatically when you click outside the text box.
      </p>
    </div>
  );
}
