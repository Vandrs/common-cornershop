/**
 * Converts a string to a URL-friendly slug in kebab-case lowercase.
 *
 * Steps applied:
 * 1. Trim whitespace
 * 2. Lowercase the whole string
 * 3. Normalize unicode characters (NFD) and remove diacritics
 * 4. Replace any non-alphanumeric character sequence with a single hyphen
 * 5. Strip leading/trailing hyphens
 *
 * @param value - The string to convert
 * @returns Slug string
 *
 * @example
 * toSlug('Hello World');    // 'hello-world'
 * toSlug('  Café Latte  '); // 'cafe-latte'
 * toSlug('TypeScript 5+');  // 'typescript-5'
 */
export function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Capitalizes the first letter of a string, leaving the rest unchanged.
 *
 * @param value - The string to capitalize
 * @returns String with the first character uppercased
 *
 * @example
 * capitalize('hello world'); // 'Hello world'
 * capitalize('');            // ''
 */
export function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Normalizes a string by trimming surrounding whitespace and converting to lowercase.
 *
 * Useful for case-insensitive comparisons and sanitizing user input before storage.
 *
 * @param value - The string to normalize
 * @returns Trimmed lowercase string
 *
 * @example
 * normalizeCase('  Hello World  '); // 'hello world'
 * normalizeCase('TYPESCRIPT');      // 'typescript'
 */
export function normalizeCase(value: string): string {
  return value.trim().toLowerCase();
}
