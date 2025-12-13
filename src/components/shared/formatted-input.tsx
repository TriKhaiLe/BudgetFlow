'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatNumberWithCommas } from '@/lib/utils';

interface FormattedInputProps {
  field: {
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    name?: string;
    ref?: React.Ref<HTMLInputElement>;
  };
  placeholder?: string;
  showQuickButtons?: boolean;
  quickButtonValues?: string[];
  className?: string;
}

/**
 * A reusable input component that formats numbers with commas as the user types.
 * Optionally displays quick-add buttons for common suffixes like "00" or "000".
 */
export function FormattedInput({
  field,
  placeholder,
  showQuickButtons = true,
  quickButtonValues = ['00', '000'],
  className,
}: FormattedInputProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '');
    // Allow digits and one decimal point
    if (/^\d*\.?\d*$/.test(rawValue)) {
      field.onChange(formatNumberWithCommas(rawValue));
    }
  };

  const handleQuickButtonClick = (value: string) => {
    const currentValue = field.value || '';
    const rawValue = currentValue.replace(/,/g, '');
    field.onChange(formatNumberWithCommas(rawValue + value));
  };

  return (
    <div className={`relative ${className || ''}`}>
      <Input
        placeholder={placeholder}
        value={field.value}
        onChange={handleInputChange}
        onBlur={field.onBlur}
        name={field.name}
        ref={field.ref}
      />
      {showQuickButtons && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
          {quickButtonValues.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant="ghost"
              className="h-7"
              onClick={() => handleQuickButtonClick(value)}
            >
              {value}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
