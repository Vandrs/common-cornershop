import { toSlug, capitalize, normalizeCase } from './string.utils';

describe('string.utils', () => {
  describe('toSlug', () => {
    it('should convert a plain string to kebab-case lowercase', () => {
      const input = 'Hello World';

      const result = toSlug(input);

      expect(result).toBe('hello-world');
    });

    it('should strip diacritics from accented characters', () => {
      const input = 'Café Latte';

      const result = toSlug(input);

      expect(result).toBe('cafe-latte');
    });

    it('should trim surrounding whitespace', () => {
      const input = '  hello world  ';

      const result = toSlug(input);

      expect(result).toBe('hello-world');
    });

    it('should replace special characters with hyphens', () => {
      const input = 'TypeScript 5+ & More!';

      const result = toSlug(input);

      expect(result).toBe('typescript-5-more');
    });

    it('should collapse multiple consecutive non-alphanumeric chars into one hyphen', () => {
      const input = 'foo---bar';

      const result = toSlug(input);

      expect(result).toBe('foo-bar');
    });

    it('should not produce leading or trailing hyphens', () => {
      const input = '---hello---';

      const result = toSlug(input);

      expect(result).toBe('hello');
    });

    it('should return an empty string when input is empty', () => {
      const input = '';

      const result = toSlug(input);

      expect(result).toBe('');
    });

    it('should handle strings that are already slugs', () => {
      const input = 'already-a-slug';

      const result = toSlug(input);

      expect(result).toBe('already-a-slug');
    });
  });

  describe('capitalize', () => {
    it('should capitalize the first letter of a lowercase string', () => {
      const input = 'hello world';

      const result = capitalize(input);

      expect(result).toBe('Hello world');
    });

    it('should leave the rest of the string unchanged', () => {
      const input = 'hELLO wORLD';

      const result = capitalize(input);

      expect(result).toBe('HELLO wORLD');
    });

    it('should return an empty string when input is empty', () => {
      const input = '';

      const result = capitalize(input);

      expect(result).toBe('');
    });

    it('should handle a single character string', () => {
      const input = 'a';

      const result = capitalize(input);

      expect(result).toBe('A');
    });

    it('should return the string unchanged when it already starts with uppercase', () => {
      const input = 'Hello';

      const result = capitalize(input);

      expect(result).toBe('Hello');
    });
  });

  describe('normalizeCase', () => {
    it('should trim surrounding whitespace and convert to lowercase', () => {
      const input = '  Hello World  ';

      const result = normalizeCase(input);

      expect(result).toBe('hello world');
    });

    it('should convert an uppercase string to lowercase', () => {
      const input = 'TYPESCRIPT';

      const result = normalizeCase(input);

      expect(result).toBe('typescript');
    });

    it('should return an empty string when input is empty', () => {
      const input = '';

      const result = normalizeCase(input);

      expect(result).toBe('');
    });

    it('should handle strings with internal spaces without collapsing them', () => {
      const input = '  Hello   World  ';

      const result = normalizeCase(input);

      expect(result).toBe('hello   world');
    });
  });
});
