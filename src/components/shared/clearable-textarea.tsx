"use client";

import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClearableTextareaProps extends React.ComponentProps<"textarea"> {
  /** Handler called when the clear button is clicked. If not provided, value will be set to empty string via onChange. */
  onClear?: () => void;
  /** Custom class for the wrapper div */
  wrapperClassName?: string;
  /** Whether to show the clear button (defaults to true when there's a value) */
  showClearButton?: boolean;
}

/**
 * A textarea component with a clear button that appears when there's content.
 * Works with both controlled and uncontrolled textareas.
 *
 * For react-hook-form usage, spread the field props:
 * ```tsx
 * <ClearableTextarea {...field} placeholder="Enter text" />
 * ```
 */
const ClearableTextarea = React.forwardRef<
  HTMLTextAreaElement,
  ClearableTextareaProps
>(
  (
    {
      className,
      wrapperClassName,
      value,
      defaultValue,
      onChange,
      onClear,
      showClearButton,
      ...props
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => textareaRef.current!);

    // Determine if the textarea has a value (for both controlled and uncontrolled)
    const hasValue = React.useMemo(() => {
      if (value !== undefined) {
        return String(value).length > 0;
      }
      return false;
    }, [value]);

    // Use showClearButton prop if provided, otherwise show when there's a value
    const shouldShowClear = showClearButton ?? hasValue;

    const handleClear = () => {
      if (onClear) {
        onClear();
      } else if (onChange) {
        // Create a synthetic event to clear the value
        const syntheticEvent = {
          target: { value: "" },
          currentTarget: { value: "" },
        } as React.ChangeEvent<HTMLTextAreaElement>;
        onChange(syntheticEvent);
      }
      // Focus the textarea after clearing
      textareaRef.current?.focus();
    };

    return (
      <div className={cn("relative", wrapperClassName)}>
        <Textarea
          ref={textareaRef}
          className={cn(shouldShowClear ? "pr-9" : "", className)}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          {...props}
        />
        {shouldShowClear && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="absolute right-2 top-2 h-7 w-7 p-0 hover:bg-muted"
            onClick={handleClear}
            tabIndex={-1}
            aria-label="Clear textarea"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        )}
      </div>
    );
  }
);

ClearableTextarea.displayName = "ClearableTextarea";

export { ClearableTextarea };
