import { clsx, type ClassValue } from "clsx"
import { format } from "date-fns"
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
  const stringValue = String(value).replace(/,/g, '');
  if (stringValue === '' || isNaN(Number(stringValue))) return '';
  const [integerPart, decimalPart] = stringValue.split('.');
  const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimalPart !== undefined ? `${formattedIntegerPart}.${decimalPart}` : formattedIntegerPart;
}

export function parseFormattedNumber(value: string): number {
  return Number(String(value).replace(/,/g, ''));
}

export function toMonthKey(value: string | Date): string | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, "yyyy-MM");
}

// Simple hash function to get a color from a string
function simpleHash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

// Generate a pastel color from a hash
export function getCategoryColor(category: string): string {
  if (!category) {
    return 'hsl(0, 0%, 95%)'; // A default light gray
  }
  const hash = simpleHash(category);
  const h = (hash & 0xFF) % 360; // Hue
  const s = 70 + (hash & 0x0F); // Saturation
  const l = 85 + ((hash >> 4) & 0x0F); // Lightness
  return `hsl(${h}, ${s}%, ${l}%)`;
}
