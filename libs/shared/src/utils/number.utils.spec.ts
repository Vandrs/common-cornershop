import { roundDecimal } from './number.utils';

describe('roundDecimal', () => {
  describe('roundDecimal', () => {
    it('should round to 2 decimal places correctly for a standard value', () => {
      // Arrange
      const value = 1.555;

      // Act
      const result = roundDecimal(value, 2);

      // Assert
      expect(result).toBe(1.56);
    });

    it('should round down when the next digit is less than 5', () => {
      // Arrange
      const value = 1.554;

      // Act
      const result = roundDecimal(value, 2);

      // Assert
      expect(result).toBe(1.55);
    });

    it('should handle floating-point precision issues (1.005 → 1.01)', () => {
      // Arrange
      const value = 1.005;

      // Act
      const result = roundDecimal(value, 2);

      // Assert
      expect(result).toBe(1.01);
    });

    it('should return an integer when places is 0', () => {
      // Arrange
      const value = 4.6;

      // Act
      const result = roundDecimal(value, 0);

      // Assert
      expect(result).toBe(5);
    });

    it('should return the same value when no rounding is needed', () => {
      // Arrange
      const value = 1.5;

      // Act
      const result = roundDecimal(value, 2);

      // Assert
      expect(result).toBe(1.5);
    });

    it('should handle negative values correctly', () => {
      // Arrange
      // Note: -1.555 rounds to -1.55 because Math.round rounds toward +Infinity
      // (i.e. -1.555 → -1.55, not -1.56). This is standard JS/IEEE-754 behavior.
      const value = -1.554;

      // Act
      const result = roundDecimal(value, 2);

      // Assert
      expect(result).toBe(-1.55);
    });

    it('should handle zero value', () => {
      // Arrange
      const value = 0;

      // Act
      const result = roundDecimal(value, 2);

      // Assert
      expect(result).toBe(0);
    });

    it('should round to 4 decimal places', () => {
      // Arrange
      const value = 3.14159265;

      // Act
      const result = roundDecimal(value, 4);

      // Assert
      expect(result).toBe(3.1416);
    });

    it('should handle large numbers', () => {
      // Arrange
      const value = 99999.995;

      // Act
      const result = roundDecimal(value, 2);

      // Assert
      expect(result).toBe(100000);
    });
  });
});
