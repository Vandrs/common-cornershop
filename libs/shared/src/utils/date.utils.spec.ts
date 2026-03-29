import { formatISO, isValidDate } from './date.utils';

describe('date.utils', () => {
  describe('formatISO', () => {
    it('should format a Date as an ISO 8601 UTC string', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');

      const result = formatISO(date);

      expect(result).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should include milliseconds in the output', () => {
      const date = new Date('2024-06-01T00:00:00.123Z');

      const result = formatISO(date);

      expect(result).toContain('.123Z');
    });

    it('should always produce a string ending with Z (UTC)', () => {
      const date = new Date();

      const result = formatISO(date);

      expect(result).toMatch(/Z$/);
    });
  });

  describe('isValidDate', () => {
    it('should return true for a valid Date instance', () => {
      const date = new Date('2024-01-15');

      const result = isValidDate(date);

      expect(result).toBe(true);
    });

    it('should return false for an Invalid Date', () => {
      const invalid = new Date('not-a-date');

      const result = isValidDate(invalid);

      expect(result).toBe(false);
    });

    it('should return false for a date string (not a Date instance)', () => {
      const dateString = '2024-01-15';

      const result = isValidDate(dateString);

      expect(result).toBe(false);
    });

    it('should return false for null', () => {
      const value = null;

      const result = isValidDate(value);

      expect(result).toBe(false);
    });

    it('should return false for undefined', () => {
      const value = undefined;

      const result = isValidDate(value);

      expect(result).toBe(false);
    });

    it('should return false for a number timestamp', () => {
      const timestamp = Date.now();

      const result = isValidDate(timestamp);

      expect(result).toBe(false);
    });

    it('should return true for the epoch Date (new Date(0))', () => {
      const epoch = new Date(0);

      const result = isValidDate(epoch);

      expect(result).toBe(true);
    });

    it('should return false for a plain object', () => {
      const obj = { date: '2024-01-01' };

      const result = isValidDate(obj);

      expect(result).toBe(false);
    });
  });
});
