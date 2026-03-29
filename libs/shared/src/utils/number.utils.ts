/**
 * Rounds a decimal number to the specified number of decimal places.
 *
 * Uses the "round half away from zero" strategy, which is the expected
 * behaviour for monetary/financial values.
 *
 * @param value  - The number to round
 * @param places - Number of decimal places (must be ≥ 0)
 * @returns The rounded number
 *
 * @example
 * roundDecimal(1.005, 2); // 1.01
 * roundDecimal(1.555, 2); // 1.56
 * roundDecimal(100,   0); // 100
 */
export function roundDecimal(value: number, places: number): number {
  const factor = Math.pow(10, places);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
