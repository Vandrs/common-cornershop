import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './pagination.constants';

describe('pagination.constants', () => {
  describe('DEFAULT_PAGE_SIZE', () => {
    it('should equal 10', () => {
      expect(DEFAULT_PAGE_SIZE).toBe(10);
    });
  });

  describe('MAX_PAGE_SIZE', () => {
    it('should equal 100', () => {
      expect(MAX_PAGE_SIZE).toBe(100);
    });

    it('should be greater than DEFAULT_PAGE_SIZE', () => {
      expect(MAX_PAGE_SIZE).toBeGreaterThan(DEFAULT_PAGE_SIZE);
    });
  });
});
