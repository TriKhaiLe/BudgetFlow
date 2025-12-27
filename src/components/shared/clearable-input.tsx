"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClearableInputProps extends React.ComponentProps<"input"> {
  /** Handler called when the clear button is clicked. If not provided, value will be set to empty string via onChange. */
  onClear?: () => void;
  /** Custom class for the wrapper div */
  wrapperClassName?: string;
  /** Whether to show the clear button (defaults to true when there's a value) */
  showClearButton?: boolean;
}

/**
 * A text input component with a clear button that appears when the input has value.
 * Works with both controlled and uncontrolled inputs.
 *
 * For react-hook-form usage, spread the field props:
 * ```tsx
 * <ClearableInput {...field} placeholder="Enter text" />
 * ```
 */
const ClearableInput = React.forwardRef<HTMLInputElement, ClearableInputProps>(
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
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!);

    // Determine if the input has a value (for both controlled and uncontrolled)
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
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
      // Focus the input after clearing
      inputRef.current?.focus();
    };

    return (
      <div className={cn("relative", wrapperClassName)}>
        <Input
          ref={inputRef}
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
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
            onClick={handleClear}
            tabIndex={-1}
            aria-label="Clear input"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        )}
      </div>
    );
  }
);

ClearableInput.displayName = "ClearableInput";

export { ClearableInput };
