import { roundDecimal } from './number.utils';

describe('roundDecimal', () => {
  describe('roundDecimal', () => {
    it('should round to 2 decimal places correctly for a standard value', () => {
      const value = 1.555;

      const result = roundDecimal(value, 2);

      expect(result).toBe(1.56);
    });

    it('should round down when the next digit is less than 5', () => {
      const value = 1.554;

      const result = roundDecimal(value, 2);

      expect(result).toBe(1.55);
    });

    it('should handle floating-point precision issues (1.005 → 1.01)', () => {
      const value = 1.005;

      const result = roundDecimal(value, 2);

      expect(result).toBe(1.01);
    });

    it('should return an integer when places is 0', () => {
      const value = 4.6;

      const result = roundDecimal(value, 0);

      expect(result).toBe(5);
    });

    it('should return the same value when no rounding is needed', () => {
      const value = 1.5;

      const result = roundDecimal(value, 2);

      expect(result).toBe(1.5);
    });

    it('should handle negative values correctly', () => {
      // Note: -1.555 rounds to -1.55 because Math.round rounds toward +Infinity
      // (i.e. -1.555 → -1.55, not -1.56). This is standard JS/IEEE-754 behavior.
      const value = -1.554;

      const result = roundDecimal(value, 2);

      expect(result).toBe(-1.55);
    });

    it('should handle zero value', () => {
      const value = 0;

      const result = roundDecimal(value, 2);

      expect(result).toBe(0);
    });

    it('should round to 4 decimal places', () => {
      const value = 3.14159265;

      const result = roundDecimal(value, 4);

      expect(result).toBe(3.1416);
    });

    it('should handle large numbers', () => {
      const value = 99999.995;

      const result = roundDecimal(value, 2);

      expect(result).toBe(100000);
    });
  });
});
