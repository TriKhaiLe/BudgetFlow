import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumberWithCommas(value: number | string): string {
  const stringValue = String(value);
  const [integerPart, decimalPart] = stringValue.split('.');
  const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimalPart ? `${formattedIntegerPart}.${decimalPart}` : formattedIntegerPart;
}

export function parseFormattedNumber(value: string): number {
  return Number(value.replace(/,/g, ''));
}
