/**
 * Represents a value that can be of type T or null
 * @template T - The base type
 */
export type Nullable<T> = T | null;

/**
 * Represents a value that can be of type T or undefined
 * @template T - The base type
 */
export type Optional<T> = T | undefined;

/**
 * UUID v4 identifier string
 * Used across the domain to represent entity IDs
 */
export type ID = string;
