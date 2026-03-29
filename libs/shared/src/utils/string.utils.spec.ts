import { toSlug, capitalize, normalizeCase } from './string.utils';

describe('string.utils', () => {
  describe('toSlug', () => {
    it('should convert a plain string to kebab-case lowercase', () => {
      // Arrange
      const input = 'Hello World';

      // Act
      const result = toSlug(input);

      // Assert
      expect(result).toBe('hello-world');
    });

    it('should strip diacritics from accented characters', () => {
      // Arrange
      const input = 'Café Latte';

      // Act
      const result = toSlug(input);

      // Assert
      expect(result).toBe('cafe-latte');
    });

    it('should trim surrounding whitespace', () => {
      // Arrange
      const input = '  hello world  ';

      // Act
      const result = toSlug(input);

      // Assert
      expect(result).toBe('hello-world');
    });

    it('should replace special characters with hyphens', () => {
      // Arrange
      const input = 'TypeScript 5+ & More!';

      // Act
      const result = toSlug(input);

      // Assert
      expect(result).toBe('typescript-5-more');
    });

    it('should collapse multiple consecutive non-alphanumeric chars into one hyphen', () => {
      // Arrange
      const input = 'foo---bar';

      // Act
      const result = toSlug(input);

      // Assert
      expect(result).toBe('foo-bar');
    });

    it('should not produce leading or trailing hyphens', () => {
      // Arrange
      const input = '---hello---';

      // Act
      const result = toSlug(input);

      // Assert
      expect(result).toBe('hello');
    });

    it('should return an empty string when input is empty', () => {
      // Arrange
      const input = '';

      // Act
      const result = toSlug(input);

      // Assert
      expect(result).toBe('');
    });

    it('should handle strings that are already slugs', () => {
      // Arrange
      const input = 'already-a-slug';

      // Act
      const result = toSlug(input);

      // Assert
      expect(result).toBe('already-a-slug');
    });
  });

  describe('capitalize', () => {
    it('should capitalize the first letter of a lowercase string', () => {
      // Arrange
      const input = 'hello world';

      // Act
      const result = capitalize(input);

      // Assert
      expect(result).toBe('Hello world');
    });

    it('should leave the rest of the string unchanged', () => {
      // Arrange
      const input = 'hELLO wORLD';

      // Act
      const result = capitalize(input);

      // Assert
      expect(result).toBe('HELLO wORLD');
    });

    it('should return an empty string when input is empty', () => {
      // Arrange
      const input = '';

      // Act
      const result = capitalize(input);

      // Assert
      expect(result).toBe('');
    });

    it('should handle a single character string', () => {
      // Arrange
      const input = 'a';

      // Act
      const result = capitalize(input);

      // Assert
      expect(result).toBe('A');
    });

    it('should return the string unchanged when it already starts with uppercase', () => {
      // Arrange
      const input = 'Hello';

      // Act
      const result = capitalize(input);

      // Assert
      expect(result).toBe('Hello');
    });
  });

  describe('normalizeCase', () => {
    it('should trim surrounding whitespace and convert to lowercase', () => {
      // Arrange
      const input = '  Hello World  ';

      // Act
      const result = normalizeCase(input);

      // Assert
      expect(result).toBe('hello world');
    });

    it('should convert an uppercase string to lowercase', () => {
      // Arrange
      const input = 'TYPESCRIPT';

      // Act
      const result = normalizeCase(input);

      // Assert
      expect(result).toBe('typescript');
    });

    it('should return an empty string when input is empty', () => {
      // Arrange
      const input = '';

      // Act
      const result = normalizeCase(input);

      // Assert
      expect(result).toBe('');
    });

    it('should handle strings with internal spaces without collapsing them', () => {
      // Arrange
      const input = '  Hello   World  ';

      // Act
      const result = normalizeCase(input);

      // Assert
      expect(result).toBe('hello   world');
    });
  });
});
