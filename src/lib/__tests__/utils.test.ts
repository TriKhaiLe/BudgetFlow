import {
  formatCurrency,
  formatNumberWithCommas,
  parseFormattedNumber,
  getCategoryColor,
  cn,
} from '../utils';

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers as USD currency', () => {
      expect(formatCurrency(1234)).toBe('$1,234');
      expect(formatCurrency(1234.56)).toBe('$1,235'); // Rounds to nearest integer
      expect(formatCurrency(0)).toBe('$0');
    });

    it('should handle negative numbers', () => {
      expect(formatCurrency(-1234)).toBe('-$1,234');
      expect(formatCurrency(-0.5)).toBe('-$1');
    });

    it('should handle large numbers', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000');
      expect(formatCurrency(9999999.99)).toBe('$10,000,000');
    });
  });

  describe('formatNumberWithCommas', () => {
    it('should format numbers with thousand separators', () => {
      expect(formatNumberWithCommas(1234)).toBe('1,234');
      expect(formatNumberWithCommas(1234567)).toBe('1,234,567');
      expect(formatNumberWithCommas(0)).toBe('0');
    });

    it('should handle string inputs', () => {
      expect(formatNumberWithCommas('1234')).toBe('1,234');
      expect(formatNumberWithCommas('1234567')).toBe('1,234,567');
    });

    it('should preserve decimal places', () => {
      expect(formatNumberWithCommas('1234.56')).toBe('1,234.56');
      expect(formatNumberWithCommas('1234567.89')).toBe('1,234,567.89');
    });

    it('should handle already formatted numbers', () => {
      expect(formatNumberWithCommas('1,234')).toBe('1,234');
      expect(formatNumberWithCommas('1,234,567')).toBe('1,234,567');
    });

    it('should handle empty or invalid inputs', () => {
      expect(formatNumberWithCommas('')).toBe('');
      expect(formatNumberWithCommas('abc')).toBe('');
      expect(formatNumberWithCommas('12abc')).toBe('');
    });
  });

  describe('parseFormattedNumber', () => {
    it('should parse formatted numbers to numeric values', () => {
      expect(parseFormattedNumber('1,234')).toBe(1234);
      expect(parseFormattedNumber('1,234,567')).toBe(1234567);
      expect(parseFormattedNumber('1,234.56')).toBe(1234.56);
    });

    it('should handle unformatted numbers', () => {
      expect(parseFormattedNumber('1234')).toBe(1234);
      expect(parseFormattedNumber('1234.56')).toBe(1234.56);
    });

    it('should handle negative numbers', () => {
      expect(parseFormattedNumber('-1,234')).toBe(-1234);
      expect(parseFormattedNumber('-1,234.56')).toBe(-1234.56);
    });

    it('should handle edge cases', () => {
      expect(parseFormattedNumber('0')).toBe(0);
      expect(parseFormattedNumber('')).toBe(0);
    });
  });

  describe('getCategoryColor', () => {
    it('should return a color string in HSL format', () => {
      const color = getCategoryColor('Food');
      expect(color).toMatch(/^hsl\(\d+,\s*\d+%,\s*\d+%\)$/);
    });

    it('should return consistent colors for same category', () => {
      const color1 = getCategoryColor('Food');
      const color2 = getCategoryColor('Food');
      expect(color1).toBe(color2);
    });

    it('should return different colors for different categories', () => {
      const color1 = getCategoryColor('Food');
      const color2 = getCategoryColor('Transport');
      expect(color1).not.toBe(color2);
    });

    it('should handle empty string with default color', () => {
      const color = getCategoryColor('');
      expect(color).toBe('hsl(0, 0%, 95%)');
    });

    it('should handle special characters', () => {
      const color = getCategoryColor('Café & Restaurant');
      expect(color).toMatch(/^hsl\(\d+,\s*\d+%,\s*\d+%\)$/);
    });
  });

  describe('cn (className utility)', () => {
    it('should merge class names', () => {
      const result = cn('foo', 'bar');
      expect(result).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      const result = cn('foo', false && 'bar', 'baz');
      expect(result).toBe('foo baz');
    });

    it('should handle tailwind conflicts with twMerge', () => {
      const result = cn('px-2 py-1', 'px-4');
      expect(result).toBe('py-1 px-4');
    });

    it('should handle empty inputs', () => {
      const result = cn();
      expect(result).toBe('');
    });
  });
});
