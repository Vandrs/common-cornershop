/**
 * Formats a Date object as an ISO 8601 string (UTC).
 *
 * Delegates to the native `Date.prototype.toISOString()` which always
 * returns a UTC timestamp in the format `YYYY-MM-DDTHH:mm:ss.sssZ`.
 *
 * @param date - A valid Date object
 * @returns ISO 8601 string representation of the date
 *
 * @example
 * formatISO(new Date('2024-01-15T10:30:00Z')); // '2024-01-15T10:30:00.000Z'
 */
export function formatISO(date: Date): string {
  return date.toISOString();
}

/**
 * Determines whether the given value is a valid, non-NaN Date instance.
 *
 * Returns `false` for non-Date values, `null`, `undefined`, and
 * `Invalid Date` instances.
 *
 * @param date - The value to check
 * @returns `true` if the value is a valid Date, `false` otherwise
 *
 * @example
 * isValidDate(new Date());           // true
 * isValidDate(new Date('invalid'));   // false
 * isValidDate('2024-01-01');         // false — string, not a Date
 * isValidDate(null);                 // false
 */
export function isValidDate(date: unknown): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}
