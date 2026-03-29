import { z } from 'zod';

/**
 * Zod schema that validates all required database environment variables.
 *
 * Throws a descriptive error at startup if any required variable is missing
 * or has an incorrect type, preventing silent misconfiguration.
 */
const databaseEnvSchema = z.object({
  DB_HOST: z.string().min(1, 'DB_HOST is required'),
  DB_PORT: z
    .string()
    .min(1, 'DB_PORT is required')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val <= 65535, {
      message: 'DB_PORT must be a valid port number (1-65535)',
    }),
  DB_USER: z.string().min(1, 'DB_USER is required'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required'),
  DB_NAME: z.string().min(1, 'DB_NAME is required'),
  /**
   * Set to "true" to enable TLS for the database connection.
   * Defaults to false (plain-text, suitable for local development).
   */
  DB_SSL: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  /**
   * Set to "false" ONLY in trusted internal networks where a CA bundle is not
   * available (e.g. some managed-database providers that use self-signed
   * certificates). Defaults to "true" so that certificate chain validation is
   * enforced by default, preventing MITM attacks on TLS-enabled connections.
   */
  DB_SSL_REJECT_UNAUTHORIZED: z
    .enum(['true', 'false'])
    .optional()
    .default('true')
    .transform((val) => val !== 'false'),
});

type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

/**
 * Parsed and validated database configuration derived from environment variables.
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  sslRejectUnauthorized: boolean;
}

/**
 * Reads, validates, and returns database configuration from environment variables.
 *
 * Validation is performed with Zod. If any required variable is absent or
 * invalid, a descriptive error is thrown so the process fails fast at boot
 * rather than producing a cryptic runtime error.
 *
 * The error message intentionally lists only the **names** of invalid
 * variables — never their values — to prevent accidental credential leakage
 * in logs or error tracking systems.
 *
 * @returns Validated {@link DatabaseConfig} object ready for use in TypeORM.
 * @throws {Error} When one or more required environment variables are missing or invalid.
 */
export function getDatabaseConfig(): DatabaseConfig {
  const result = databaseEnvSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `Database configuration is invalid. Missing or incorrect environment variables:\n${issues}`,
    );
  }

  const env: DatabaseEnv = result.data;

  return {
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl: env.DB_SSL,
    sslRejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED,
  };
}
