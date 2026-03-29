import { formatISO, isValidDate } from './date.utils';

describe('date.utils', () => {
  describe('formatISO', () => {
    it('should format a Date as an ISO 8601 UTC string', () => {
      // Arrange
      const date = new Date('2024-01-15T10:30:00.000Z');

      // Act
      const result = formatISO(date);

      // Assert
      expect(result).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should include milliseconds in the output', () => {
      // Arrange
      const date = new Date('2024-06-01T00:00:00.123Z');

      // Act
      const result = formatISO(date);

      // Assert
      expect(result).toContain('.123Z');
    });

    it('should always produce a string ending with Z (UTC)', () => {
      // Arrange
      const date = new Date();

      // Act
      const result = formatISO(date);

      // Assert
      expect(result).toMatch(/Z$/);
    });
  });

  describe('isValidDate', () => {
    it('should return true for a valid Date instance', () => {
      // Arrange
      const date = new Date('2024-01-15');

      // Act
      const result = isValidDate(date);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for an Invalid Date', () => {
      // Arrange
      const invalid = new Date('not-a-date');

      // Act
      const result = isValidDate(invalid);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for a date string (not a Date instance)', () => {
      // Arrange
      const dateString = '2024-01-15';

      // Act
      const result = isValidDate(dateString);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for null', () => {
      // Arrange
      const value = null;

      // Act
      const result = isValidDate(value);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for undefined', () => {
      // Arrange
      const value = undefined;

      // Act
      const result = isValidDate(value);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for a number timestamp', () => {
      // Arrange
      const timestamp = Date.now();

      // Act
      const result = isValidDate(timestamp);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for the epoch Date (new Date(0))', () => {
      // Arrange
      const epoch = new Date(0);

      // Act
      const result = isValidDate(epoch);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for a plain object', () => {
      // Arrange
      const obj = { date: '2024-01-01' };

      // Act
      const result = isValidDate(obj);

      // Assert
      expect(result).toBe(false);
    });
  });
});
