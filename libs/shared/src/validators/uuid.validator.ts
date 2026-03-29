const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates whether a given string is a valid UUID v4.
 *
 * Returns `false` for empty strings, null, undefined, or any string
 * that does not conform to the UUID v4 format.
 *
 * @param id - The string to validate
 * @returns `true` if the string is a valid UUID v4, `false` otherwise
 *
 * @example
 * isValidUUID('550e8400-e29b-41d4-a716-446655440000'); // false — v1
 * isValidUUID('550e8400-e29b-4fd4-a716-446655440000'); // true  — v4
 * isValidUUID('not-a-uuid');                           // false
 * isValidUUID('');                                     // false
 */
export function isValidUUID(id: string): boolean {
  if (!id) return false;
  return UUID_V4_REGEX.test(id);
}
